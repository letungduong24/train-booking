import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // Adjust production CORS later
    },
    namespace: 'booking',
})
export class BookingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(BookingGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    emitSeatsLocked(tripId: string, seatIds: string[]) {
        this.server.emit('seats.locked', { tripId, seatIds });
        this.logger.debug(`Emitted seats.locked for trip ${tripId}: ${seatIds.join(', ')}`);
    }

    emitSeatsReleased(tripId: string, seatIds: string[]) {
        this.server.emit('seats.released', { tripId, seatIds });
        this.logger.debug(`Emitted seats.released for trip ${tripId}: ${seatIds.join(', ')}`);
    }

    emitBookingStatusUpdate(bookingCode: string, status: string) {
        this.server.emit(`booking.status_update`, { bookingCode, status });
        this.logger.debug(`Emitted booking.status_update for ${bookingCode}: ${status}`);
    }

    emitSeatsBooked(tripId: string, seatIds: string[]) {
        this.server.emit('seats.booked', { tripId, seatIds });
        this.logger.debug(`Emitted seats.booked for trip ${tripId}: ${seatIds.join(', ')}`);
    }
}
