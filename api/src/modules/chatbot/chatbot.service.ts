import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createGroq, type GroqLanguageModelOptions } from '@ai-sdk/groq';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { StationService } from '../station/station.service';
import { TripService } from '../trip/trip.service';
import {
  CHATBOT_DATA_TOOL_NAMES,
  CHATBOT_MODEL,
  supportsGroqReasoningFormat,
} from './chatbot.constants';
import { buildChatbotSystemPrompt } from './chatbot.prompt';
import {
  createChatbotTools,
  findStationsByName,
  normalizeVietnameseSearch,
  searchTrainTripsForChatbot,
} from './chatbot.tools';

function getLatestUserText(messages: UIMessage[]) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  return (
    latestUserMessage?.parts
      ?.map((part) => (part.type === 'text' ? (part as { text?: string }).text ?? '' : ''))
      .join(' ')
      .trim() ?? ''
  );
}

function shouldRequireTrainSearchToolCall(messages: UIMessage[]) {
  const text = normalizeVietnameseSearch(getLatestUserText(messages));
  if (!text) return false;

  const bookingOnlyText = text.replace(/^(cho toi|cho minh|toi|minh|em|anh|chi)\s+/, '');
  if (['dat ve', 'muon dat ve', 'can dat ve'].includes(bookingOnlyText)) return false;

  const isAccountIntent = /\b(so du|vi|ve da dat|lich su|hoan tien|huy ve|loai hanh khach|giam gia)\b/.test(text);
  if (isAccountIntent) return false;

  const hasTripKeyword = /\b(dat ve|tim|kiem|chuyen tau|tau|ga|khoi hanh|lich trinh)\b/.test(text);
  const hasDate = /\b(hom nay|ngay mai|ngay kia|hom qua)\b|\b\d{1,2}[/-]\d{1,2}\b|\b\d{4}-\d{2}-\d{2}\b/.test(
    text,
  );
  const hasRouteConnector = /\b(tu|den|di|toi|sang)\b/.test(text);
  const hasLocationLikePhrase = text.split(' ').length >= 5;

  return (hasTripKeyword && (hasDate || hasRouteConnector)) || (hasDate && hasLocationLikePhrase);
}

function formatDateInVietnam(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

function addDaysToDateString(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  return formatDateInVietnam(new Date(Date.UTC(year, month - 1, day + days, 12)));
}

function parseRequestedDate(text: string, today: string) {
  const normalizedText = normalizeVietnameseSearch(text);
  if (/\bngay kia\b/.test(normalizedText)) return addDaysToDateString(today, 2);
  if (/\bngay mai\b/.test(normalizedText)) return addDaysToDateString(today, 1);
  if (/\bhom nay\b/.test(normalizedText)) return today;

  const isoMatch = normalizedText.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const shortDateMatch = normalizedText.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (!shortDateMatch) return null;

  const [, day, month, rawYear] = shortDateMatch;
  const currentYear = today.slice(0, 4);
  const year = rawYear ? (rawYear.length === 2 ? `20${rawYear}` : rawYear) : currentYear;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

interface StationNameCandidate {
  id: string;
  name: string;
  index: number;
}

@Injectable()
export class ChatbotService {
  private groq?: ReturnType<typeof createGroq>;

  constructor(
    private readonly stationService: StationService,
    private readonly tripService: TripService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async createChatResponse(req: Request, messages: UIMessage[]) {
    const userId = await this.authService.getUserIdFromRequest(req);
    const today = formatDateInVietnam(new Date());
    const directTrainSearchResponse = await this.createDirectTrainSearchResponse(messages, today);
    if (directTrainSearchResponse) return directTrainSearchResponse;

    const providerOptions = this.getProviderOptions(CHATBOT_MODEL);
    const tools = createChatbotTools({
      stationService: this.stationService,
      tripService: this.tripService,
      prisma: this.prisma,
      userId,
    });

    const result = streamText({
      model: this.getGroq()(CHATBOT_MODEL),
      ...(providerOptions ? { providerOptions } : {}),
      stopWhen: [
        stepCountIs(3),
        ({ steps }) =>
          steps.at(-1)?.toolCalls?.some((toolCall) =>
            CHATBOT_DATA_TOOL_NAMES.includes(toolCall.toolName as any),
          ) ?? false,
      ],
      system: buildChatbotSystemPrompt({ today, userId }),
      messages: await convertToModelMessages(messages),
      tools,
    });

    return result.toUIMessageStreamResponse();
  }

  private async createDirectTrainSearchResponse(messages: UIMessage[], today: string) {
    if (!shouldRequireTrainSearchToolCall(messages)) return null;

    const text = getLatestUserText(messages);
    const date = parseRequestedDate(text, today);
    const stationPair = await this.resolveStationPairFromText(text);
    if (!date || !stationPair) return null;

    const [fromStation, toStation] = stationPair;
    const input = {
      fromStationId: fromStation.id,
      toStationId: toStation.id,
      date,
    };
    const output = await searchTrainTripsForChatbot(
      this.tripService,
      this.prisma,
      input.fromStationId,
      input.toStationId,
      input.date,
    );
    const toolCallId = `chatbot-search-train-trips-${Date.now()}`;
    const stream = createUIMessageStream<UIMessage>({
      originalMessages: messages,
      execute: ({ writer }) => {
        writer.write({ type: 'start-step' });
        writer.write({
          type: 'tool-input-available',
          toolCallId,
          toolName: 'searchTrainTrips',
          input,
        });
        writer.write({
          type: 'tool-output-available',
          toolCallId,
          output,
        });
        writer.write({ type: 'finish-step' });
        writer.write({ type: 'finish', finishReason: 'tool-calls' });
      },
    });

    return createUIMessageStreamResponse({ stream });
  }

  private async resolveStationPairFromText(text: string) {
    const normalizedText = normalizeVietnameseSearch(text);
    const stations = await this.prisma.station.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    const candidatesByName = new Map<string, StationNameCandidate>();

    stations.forEach((station) => {
      const normalizedName = normalizeVietnameseSearch(station.name);
      if (!normalizedName) return;

      const index = normalizedText.indexOf(normalizedName);
      if (index < 0) return;

      const current = candidatesByName.get(normalizedName);
      if (!current || index < current.index || station.name.length > current.name.length) {
        candidatesByName.set(normalizedName, { id: station.id, name: station.name, index });
      }
    });

    const orderedCandidates = Array.from(candidatesByName.values()).sort(
      (left, right) => left.index - right.index || right.name.length - left.name.length,
    );
    if (orderedCandidates.length >= 2) return [orderedCandidates[0], orderedCandidates[1]] as const;

    const fallbackStations = await findStationsByName(this.stationService, this.prisma, text);
    if (fallbackStations.length >= 2) return [fallbackStations[0], fallbackStations[1]] as const;

    return null;
  }

  private getGroq() {
    if (this.groq) return this.groq;

    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('Chatbot chưa được cấu hình GROQ_API_KEY');
    }

    this.groq = createGroq({ apiKey });
    return this.groq;
  }

  private getProviderOptions(model: string) {
    if (!supportsGroqReasoningFormat(model)) return undefined;

    return {
      groq: {
        reasoningFormat: 'parsed',
      } satisfies GroqLanguageModelOptions,
    };
  }
}
