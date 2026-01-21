import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import type { Request } from 'express';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Có thể bỏ comment nếu muốn route này public hoặc yêu cầu login
// import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bookings')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post()
    // @UseGuards(JwtAuthGuard) // Bỏ comment để yêu cầu đăng nhập
    async createBooking(@Body() dto: CreateBookingDto, @Req() req: Request) {
        // const userId = req.user['id'];
        const userId = null; // Tạm thời để null (khách vãng lai) để test sandbox

        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

        const result = await this.bookingService.createBooking(userId, dto, ipAddr);

        return result;
    }
}
