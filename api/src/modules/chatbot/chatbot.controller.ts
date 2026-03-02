import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

@Controller('api/chat')
export class ChatbotController {
  @Post()
  async handleChat(@Req() req: Request, @Res() res: Response) {
    const { messages }: { messages: UIMessage[] } = req.body;

    const result = streamText({
      model: google('gemma-3-27b-it'),
      system:
        'Bạn là trợ lý ảo thân thiện và hữu ích của hệ thống Quản lý Tuyến Đường và Đặt Vé Tàu (Railway Management System) tại Việt Nam. Bạn giúp người dùng giải đáp các thắc mắc về lịch trình tàu, cách đặt vé, ga tàu, các chính sách, và những thông tin chung về hệ thống đường sắt. Hãy trả lời ngắn gọn, súc tích và luôn bằng tiếng Việt lịch sự.',
      messages: await convertToModelMessages(messages),
    });

    const response = result.toUIMessageStreamResponse();

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        read();
      };
      read();
    } else {
      res.end();
    }
  }
}
