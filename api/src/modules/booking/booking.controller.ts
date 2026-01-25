import { Body, Controller, Post, Req, UseGuards, Get, Param, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InitBookingDto } from './dto/init-booking.dto';
import { UpdateBookingPassengersDto } from './dto/update-booking-passengers.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
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

    @Post(':code/cancel')
    // @UseGuards(JwtAuthGuard) // Optional: allow cancel without login if strict code check? 
    // Ideally should be protected if ownership check is enforced.
    // For now let's allow "Guest" cancel if they have the code, or enforce Auth if userId needed.
    // Given the previous code uses userId from req, let's try to support both.
    // If header has token -> verify user. If not -> just code? 
    // BUT the service `cancelBooking` checks `userId` if provided. 
    // Let's assume we want to allow guests to cancel too if they have the code.
    async cancelBooking(@Param('code') code: string, @Req() req: any) {
        // Check for auth manually or strictly use Guard?
        // Let's check if req.user exists (via global middleware or we add Guard)
        // Since we didn't add @UseGuards at class level, we might need to check header. 
        // For simplicity, let's just pass userId if it exists (assuming middleware populates it)
        // or just let the service handle it.
        // Actually, for "My History", user is logged in. For "Guest Flow", they have code in URL.
        const userId = req.user?.id;
        return this.bookingService.cancelBooking(code, userId);
    }

    @Get('my-bookings')
    @UseGuards(JwtAuthGuard)
    async getMyBookings(@Req() req: any, @Query() query: FilterBookingDto) {
        return this.bookingService.getMyBookings(req.user.id, query);
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
