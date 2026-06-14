import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InitBookingDto } from './dto/init-booking.dto';
import { UpdateBookingPassengersDto } from './dto/update-booking-passengers.dto';
import { FilterBookingDto } from './dto/filter-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createBooking(@Body() dto: CreateBookingDto, @Req() req: any) {
    const userId = req.user.id;
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const result = await this.bookingService.createBooking(userId, dto, ipAddr);

    return result;
  }

  @Post('init')
  @UseGuards(JwtAuthGuard)
  async initBooking(@Body() dto: InitBookingDto, @Req() req: any) {
    const userId = req.user.id;
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.bookingService.initBooking(userId, dto, ipAddr);
  }

  @Post(':code/passengers') // Using POST or PUT
  @UseGuards(JwtAuthGuard)
  async updatePassengers(
    @Param('code') code: string,
    @Body() dto: UpdateBookingPassengersDto,
    @Req() req: any,
  ) {
    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    return this.bookingService.updateBookingPassengers(code, dto, ipAddr, req.user.id);
  }

  @Post(':code/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelBooking(@Param('code') code: string, @Req() req: any) {
    return this.bookingService.cancelBooking(code, req.user.id);
  }

  @Get('my-active-trips')
  @UseGuards(JwtAuthGuard)
  async getMyActiveTrips(@Req() req: any) {
    return this.bookingService.getMyActiveTrips(req.user.id);
  }

  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@Req() req: any, @Query() query: FilterBookingDto) {
    return this.bookingService.getMyBookings(req.user.id, query);
  }

  @Get('locked-seats/:tripId')
  async getLockedSeats(
    @Param('tripId') tripId: string,
    @Query('fromStationId') fromStationId?: string,
    @Query('toStationId') toStationId?: string,
  ) {
    return this.bookingService.getLockedSeats(
      tripId,
      fromStationId,
      toStationId,
    );
  }

  @Get(':code')
  // @UseGuards(JwtAuthGuard) // Có thể public hoặc protected tùy logic
  async getBooking(@Param('code') code: string) {
    return this.bookingService.getBookingByCode(code);
  }
}
