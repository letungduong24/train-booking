import { Body, Controller, Post, Req, UseGuards, Get, Param } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InitBookingDto } from './dto/init-booking.dto';
import { UpdateBookingPassengersDto } from './dto/update-booking-passengers.dto';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

    @Post('init')
    @UseGuards(JwtAuthGuard)
    async initBooking(@Body() dto: InitBookingDto, @Req() req: any) {
        const userId = req.user.id;
        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        return this.bookingService.initBooking(userId, dto, ipAddr);
    }

    @Post(':code/passengers') // Using POST or PUT
    async updatePassengers(@Param('code') code: string, @Body() dto: UpdateBookingPassengersDto, @Req() req: Request) {
        const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
        return this.bookingService.updateBookingPassengers(code, dto, ipAddr);
    }

    @Get('my-bookings')
    @UseGuards(JwtAuthGuard)
    async getMyBookings(@Req() req: any) {
        return this.bookingService.getMyBookings(req.user.id);
    }

    @Get('locked-seats/:tripId')
    async getLockedSeats(@Param('tripId') tripId: string) {
        return this.bookingService.getLockedSeats(tripId);
    }

    @Get(':code')
    // @UseGuards(JwtAuthGuard) // Có thể public hoặc protected tùy logic
    async getBooking(@Param('code') code: string) {
        return this.bookingService.getBookingByCode(code);
    }
}
