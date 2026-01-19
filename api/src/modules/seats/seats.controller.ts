import { Controller, Patch, Param, Body } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { UpdateSeatDto } from './dto/update-seat.dto';

@Controller('seats')
export class SeatsController {
    constructor(private readonly seatsService: SeatsService) { }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSeatDto: UpdateSeatDto) {
        return this.seatsService.update(id, updateSeatDto);
    }
}
