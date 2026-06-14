import { BadRequestException, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ChatbotService } from './chatbot.service';
import { chatbotRequestSchema } from './chatbot.schemas';

@Controller('api/chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  async handleChat(@Req() req: Request, @Res() res: Response) {
    const parsed = chatbotRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu chatbot không hợp lệ',
        errors: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const response = await this.chatbotService.createChatResponse(req, parsed.data.messages);
    await this.pipeStreamResponse(response, res);
  }

  private async pipeStreamResponse(response: globalThis.Response, res: Response) {
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!response.body) {
      res.end();
      return;
    }

    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      res.end();
    }
  }
}
