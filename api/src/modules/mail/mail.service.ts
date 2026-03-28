import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4000';
    const url = `${frontendUrl}/verify-email?token=${token}`;
    
    const html = this.getHtmlTemplate({
      title: 'Xác thực Email của bạn',
      previewText: 'Chào mừng bạn đến với Railflow! Vui lòng xác thực email để bắt đầu hành trình.',
      content: `
        <p style="margin: 0; font-size: 16px; line-height: 24px;">Chào bạn,</p>
        <p style="margin: 20px 0; font-size: 16px; line-height: 24px;">Cảm ơn bạn đã đăng ký tài khoản tại <strong>Railflow</strong>. Để kích hoạt tài khoản và bắt đầu đặt vé, vui lòng nhấn vào nút xác nhận bên dưới:</p>
      `,
      buttonText: 'XÁC THỰC EMAIL',
      buttonUrl: url,
      footerText: 'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Đường dẫn sẽ hết hạn sau 24 giờ.',
    });

    await this.sendEmail(
      email,
      'Xác thực tài khoản - Railflow',
      `Chào bạn, vui lòng xác thực email tại: ${url}`,
      html
    );
  }

  async sendForgotPasswordEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4000';
    const url = `${frontendUrl}/reset-password?token=${token}`;
    
    const html = this.getHtmlTemplate({
      title: 'Khôi phục mật khẩu',
      previewText: 'Yêu cầu khôi phục mật khẩu của bạn tại Railflow.',
      content: `
        <p style="margin: 0; font-size: 16px; line-height: 24px;">Chào bạn,</p>
        <p style="margin: 20px 0; font-size: 16px; line-height: 24px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Railflow của bạn. Nhấn vào nút bên dưới để thực hiện thay đổi:</p>
      `,
      buttonText: 'ĐẶT LẠI MẬT KHẨU',
      buttonUrl: url,
      footerText: 'Đường dẫn này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.',
    });

    await this.sendEmail(
      email,
      'Khôi phục mật khẩu - Railflow',
      `Chào bạn, đặt lại mật khẩu tại: ${url}`,
      html
    );
  }

  async sendForgotPinEmail(email: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4000';
    const url = `${frontendUrl}/wallet/reset-pin?token=${token}`;
    
    const html = this.getHtmlTemplate({
      title: 'Khôi phục mã PIN ví',
      previewText: 'Yêu cầu khôi phục mã PIN ví điện tử Railflow của bạn.',
      content: `
        <p style="margin: 0; font-size: 16px; line-height: 24px;">Chào bạn,</p>
        <p style="margin: 20px 0; font-size: 16px; line-height: 24px;">Bạn đã yêu cầu đặt lại mã PIN cho ví điện tử Railflow. Vui lòng nhấn vào nút bên dưới để thiết lập mã PIN mới:</p>
      `,
      buttonText: 'ĐẶT LẠI MÃ PIN',
      buttonUrl: url,
      footerText: 'Đường dẫn này sẽ hết hạn sau 1 giờ. Vì lý do bảo mật, tuyệt đối không chia sẻ email này.',
    });

    await this.sendEmail(
      email,
      'Khôi phục mã PIN ví - Railflow',
      `Chào bạn, đặt lại mã PIN ví tại: ${url}`,
      html
    );
  }

  async sendBookingReceipt(email: string, booking: any, pdfBuffer?: Buffer) {
    const { code, totalPrice, trip, tickets } = booking;
    const trainName = trip?.train?.name || 'Tàu Railflow';
    const routeName = trip?.route?.name || '';
    const departureTime = trip?.departureTime 
      ? new Date(trip.departureTime).toLocaleString('vi-VN') 
      : 'Đang cập nhật';

    const ticketRows = tickets.map((t: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #F4F4F5;">
          <div style="font-weight: 700; color: #18181B; font-size: 14px;">${t.passengerName}</div>
          <div style="font-size: 12px; color: #71717A;">Ghế ${t.seat?.name || 'N/A'} - Toa ${t.seat?.coach?.name || 'N/A'}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #F4F4F5; text-align: right; font-weight: 700; color: #18181B;">
          ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.price)}
        </td>
      </tr>
    `).join('');

    const html = this.getHtmlTemplate({
      title: 'Xác nhận đặt vé thành công',
      previewText: `Mã đặt vé: ${code}. Hành trình: ${routeName}.`,
      content: `
        <div style="background-color: #F8FAFC; border-radius: 20px; padding: 25px; margin-bottom: 30px; border: 1px dashed #CBD5E1;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <span style="color: #64748B; font-size: 12px; font-weight: 700; uppercase tracking-wider;">Mã đặt chỗ:</span>
            <span style="color: #1E293B; font-weight: 900; font-size: 14px;">${code}</span>
          </div>
          <div style="margin-bottom: 10px;">
            <div style="color: #64748B; font-size: 12px; font-weight: 700;">Chuyến tàu:</div>
            <div style="color: #1E293B; font-weight: 700; font-size: 16px;">${trainName} - ${routeName}</div>
          </div>
          <div>
            <div style="color: #64748B; font-size: 12px; font-weight: 700;">Khởi hành:</div>
            <div style="color: #1E293B; font-weight: 700; font-size: 14px;">${departureTime}</div>
          </div>
        </div>

        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 800; color: #18181B;">Chi tiết vé</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          ${ticketRows}
          <tr>
            <td style="padding: 20px 0 0 0; font-size: 16px; font-weight: 800; color: #18181B;">TỔNG CỘNG</td>
            <td style="padding: 20px 0 0 0; text-align: right; font-size: 18px; font-weight: 900; color: #802222;">
              ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
            </td>
          </tr>
        </table>
      `,
      buttonText: 'XEM CHI TIẾT ĐƠN HÀNG',
      buttonUrl: `${this.configService.get('FRONTEND_URL') || 'http://localhost:4000'}/dashboard/history/${code}`,
      footerText: 'Vui lòng mang theo CCCH/CMND khi ra ga để làm thủ tục lên tàu. Chúc bạn có một hành trình tốt đẹp!',
    });

    const attachments = pdfBuffer ? [{
      filename: `Railflow_Tickets_${code}.pdf`,
      content: pdfBuffer,
    }] : [];

    await this.sendEmail(
      email,
      `Xác nhận hành trình ${code} - Railflow`,
      `Đơn hàng ${code} đã được thanh toán thành công.`,
      html,
      attachments
    );
  }

  private async sendEmail(to: string, subject: string, text: string, html?: string, attachments: any[] = []) {
    try {
      const from = this.configService.get('MAIL_FROM') || 'Railflow <onboarding@resend.dev>';
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        text,
        html,
        attachments,
      });

      if (error) {
        this.logger.error(`Resend error sending email to ${to}:`, error);
        return;
      }
      this.logger.log(`Email sent successfully to ${to}. ID: ${data?.id}`);
    } catch (error) {
      this.logger.error(`Critical error sending email to ${to}:`, error);
    }
  }

  private getHtmlTemplate(options: {
    title: string;
    previewText: string;
    content: string;
    buttonText: string;
    buttonUrl: string;
    footerText: string;
  }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>${options.title}</title>
        <style>
          body, p, div, a { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
          @media only screen and (min-width: 0) {
            body, p, div, a { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
          }
          body { -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.5; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #F6F6F6; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: 900; color: #18181B; text-transform: uppercase; font-style: italic; letter-spacing: -1.5px; }
          .blog-dot { color: #802222; }
          .content-box { background: #FFFFFF; border-radius: 40px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #E4E4E7; }
          .hero-section { background-color: #802222; background: linear-gradient(135deg, #802222 0%, #4D1515 100%); padding: 50px 20px; text-align: center; color: #FFFFFF; }
          .body-content { padding: 40px; color: #3F3F46; }
          .footer { text-align: center; padding: 30px 20px; color: #71717A; font-size: 12px; }
          .button { display: inline-block; background-color: #802222; color: #FFFFFF !important; text-decoration: none; padding: 20px 45px; border-radius: 20px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 20px rgba(128, 34, 34, 0.2); text-transform: uppercase; letter-spacing: 0.5px; }
          .preview-text { display: none; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; }
        </style>
      </head>
      <body>
        <span class="preview-text">${options.previewText}</span>
        <div class="container">
          <div class="header">
            <div class="logo">Railflow<span class="blog-dot">.</span></div>
          </div>
          <div class="content-box">
            <div class="hero-section">
               <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${options.title}</h1>
            </div>
            <div class="body-content">
              ${options.content}
              <div style="margin: 40px 0; text-align: center;">
                <a href="${options.buttonUrl}" class="button">${options.buttonText}</a>
              </div>
              <p style="margin: 0; font-size: 13px; color: #71717A; border-top: 1px solid #F4F4F5; padding-top: 30px;">
                ${options.footerText}
              </p>
            </div>
          </div>
          <div class="footer">
            <p style="margin-bottom: 10px;">&copy; ${new Date().getFullYear()} Railflow Booking System. All rights reserved.</p>
            <p>Hanoi, Vietnam</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
