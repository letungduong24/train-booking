import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
const PDFDocument = require('pdfkit');

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateQRCode(text: string): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(text, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        color: {
          dark: '#18181B',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      this.logger.error(`Error generating QR Code: ${error.message}`);
      throw error;
    }
  }

  async generateBookingTicketsPDF(booking: any): Promise<Buffer> {
    const { code, tickets, trip } = booking;
    const trainName = trip?.train?.name || 'Railflow Express';
    const routeName = trip?.route?.name || 'Hành trình Railflow';
    const departureTime = trip?.departureTime 
      ? new Date(trip.departureTime).toLocaleString('vi-VN', { 
          year: 'numeric', month: '2-digit', day: '2-digit', 
          hour: '2-digit', minute: '2-digit' 
        }) 
      : 'N/A';

    // Split route name into from/to if possible
    const [fromStation, toStation] = routeName.includes(' - ') 
      ? routeName.split(' - ') 
      : ['Ga đi', 'Ga đến'];

    // Pre-generate all QR codes
    const qrBuffers = await Promise.all(
      tickets.map((ticket: any) => 
        this.generateQRCode(JSON.stringify({
          ticketId: ticket.id,
          bookingCode: code,
          passenger: ticket.passengerName,
          seat: ticket.seat?.name,
          trip: trainName
        }))
      )
    );

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Load Vietnamese fonts
        const fontPath = 'c:\\Study\\train-booking\\web\\public\\fonts\\Roboto\\static\\Roboto-Regular.ttf';
        const fontBoldPath = 'c:\\Study\\train-booking\\web\\public\\fonts\\Roboto\\static\\Roboto-Bold.ttf';
        
        doc.registerFont('Roboto', fontPath);
        doc.registerFont('Roboto-Bold', fontBoldPath);
        doc.font('Roboto');

        tickets.forEach((ticket: any, index: number) => {
          if (index > 0) doc.addPage();

          // Background Fill for the whole page
          doc.rect(0, 0, 595, 842).fill('#FFFFFF');

          // Header Bar
          doc.rect(0, 0, 595, 120).fill('#802222');
          
          // Branding using Roboto
          doc.fillColor('#FFFFFF').fontSize(36).font('Roboto-Bold').text('RAILFLOW.', 50, 40);
          doc.fontSize(12).font('Roboto').text('PREMIUM TRAVEL EXPERIENCE', 50, 80);
          
          doc.fillColor('#FFFFFF').fontSize(14).font('Roboto-Bold').text('BOARDING PASS', 400, 45, { align: 'right', width: 145 });
          doc.fontSize(10).font('Roboto').text('THẺ LÊN TÀU HỎA', 400, 65, { align: 'right', width: 145 });

          // Content Container (Vertical Stack for Code and Passenger)
          const contentTop = 160;
          
          // Row 1: Booking Code
          doc.fillColor('#71717A').fontSize(10).font('Roboto-Bold').text('MÃ ĐẶT CHỖ / BOOKING CODE', 50, contentTop);
          doc.fillColor('#18181B').fontSize(24).text(code, 50, contentTop + 15);

          // Row 2: Passenger (Moved down)
          const passengerTop = contentTop + 65;
          doc.fillColor('#71717A').fontSize(10).text('HÀNH KHÁCH / PASSENGER', 50, passengerTop);
          doc.fillColor('#18181B').fontSize(20).text(ticket.passengerName.toUpperCase(), 50, passengerTop + 15);

          doc.moveTo(50, passengerTop + 60).lineTo(545, passengerTop + 60).strokeColor('#E4E4E7').lineWidth(1).stroke();

          // Journey Details
          const journeyTop = passengerTop + 90;
          
          // From -> To
          doc.fillColor('#71717A').fontSize(10).text('GA ĐI / FROM', 50, journeyTop);
          doc.fillColor('#18181B').fontSize(16).font('Roboto-Bold').text(fromStation, 50, journeyTop + 15);

          doc.fillColor('#71717A').fontSize(10).text('GA ĐẾN / TO', 260, journeyTop);
          doc.fillColor('#18181B').fontSize(16).text(toStation, 260, journeyTop + 15);

          doc.fillColor('#71717A').fontSize(10).text('GIỜ KHỞI HÀNH / DEPARTURE', 420, journeyTop);
          doc.fillColor('#18181B').fontSize(12).text(departureTime, 420, journeyTop + 15);

          // Train info below
          doc.fillColor('#71717A').fontSize(9).font('Roboto').text(`Tàu / Train: ${trainName}`, 50, journeyTop + 45);

          doc.moveTo(50, journeyTop + 75).lineTo(545, journeyTop + 75).strokeColor('#E4E4E7').stroke();

          // Seat Details Box
          const boxTop = journeyTop + 110;
          doc.rect(50, boxTop, 495, 100).fill('#F8FAFC');
          doc.rect(50, boxTop, 10, 100).fill('#802222'); // Accent bar
          
          doc.fillColor('#64748B').fontSize(10).font('Roboto-Bold').text('TOA / COACH', 80, boxTop + 25);
          doc.fillColor('#1E293B').fontSize(32).text(ticket.seat?.coach?.name || 'N/A', 80, boxTop + 40);

          doc.fillColor('#64748B').fontSize(10).text('SỐ GHẾ / SEAT', 220, boxTop + 25);
          doc.fillColor('#1E293B').fontSize(32).text(ticket.seat?.name || 'N/A', 220, boxTop + 40);

          doc.fillColor('#64748B').fontSize(10).text('LOẠI VÉ / TYPE', 360, boxTop + 25);
          doc.fillColor('#1E293B').fontSize(18).text('NGƯỜI LỚN / ADULT', 360, boxTop + 45);

          // QR Code Section
          const qrTop = boxTop + 150;
          doc.image(qrBuffers[index], 50, qrTop, { width: 140 });

          const infoListTop = qrTop + 20;
          const infoListLeft = 210;
          doc.fillColor('#18181B').fontSize(12).font('Roboto-Bold').text('HƯỚNG DẪN SỬ DỤNG VÉ', infoListLeft, infoListTop);
          doc.fillColor('#3F3F46').fontSize(9).font('Roboto').text('1. Xuất trình mã QR tại cửa soát vé và khi lên tàu.', infoListLeft, infoListTop + 25);
          doc.text('2. Mang theo giấy tờ tùy thân (CCCD/Hộ chiếu) bản gốc.', infoListLeft, infoListTop + 45);
          doc.text('3. Có mặt tại ga ít nhất 30 phút trước giờ tàu chạy.', infoListLeft, infoListTop + 65);
          doc.text('4. Đây là vé điện tử hợp lệ, không nhất thiết phải in giấy.', infoListLeft, infoListTop + 85);

          // Footer
          doc.fillColor('#A1A1AA').fontSize(8).text(`TICKET ID: ${ticket.id} | Báo cáo sự cố: 1900 xxxx`, 0, 800, { align: 'center', width: 595 });
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
