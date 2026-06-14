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

  async sendSeatReplacementEmail(email: string, data: {
    link: string;
    oldSeatName?: string | null;
    oldCoachName?: string | number | null;
    proposedSeatName?: string | null;
    proposedCoachName?: string | number | null;
    tokenExpires?: Date | null;
  }) {
    const expiresAt = data.tokenExpires
      ? new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(data.tokenExpires)
      : '48 gi&#7901;';

    const html = this.getHtmlTemplate({
      title: 'Th&#244;ng b&#225;o &#273;&#7893;i gh&#7871;',
      previewText: 'Gh&#7871; c&#7911;a b&#7841;n c&#7847;n &#273;&#432;&#7907;c thay th&#7871;. Vui l&#242;ng x&#225;c nh&#7853;n gh&#7871; m&#7899;i.',
      content: `
        <p style="margin: 0; font-size: 16px; line-height: 24px;">Ch&#224;o b&#7841;n,</p>
        <p style="margin: 20px 0; font-size: 16px; line-height: 24px;">Gh&#7871; hi&#7879;n t&#7841;i c&#7911;a b&#7841;n c&#7847;n b&#7843;o tr&#236;. Railflow &#273;&#227; t&#236;m gh&#7871; thay th&#7871; ph&#249; h&#7907;p v&#224; c&#7847;n b&#7841;n x&#225;c nh&#7853;n.</p>
        <div style="background-color: #F8FAFC; border-radius: 16px; padding: 16px; border: 1px solid #E2E8F0;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Gh&#7871; c&#361;:</strong> Toa ${data.oldCoachName || 'N/A'} - Gh&#7871; ${data.oldSeatName || 'N/A'}</p>
          <p style="margin: 0; font-size: 14px;"><strong>Gh&#7871; &#273;&#7873; xu&#7845;t:</strong> Toa ${data.proposedCoachName || 'N/A'} - Gh&#7871; ${data.proposedSeatName || 'N/A'}</p>
        </div>
        <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 22px;">Li&#234;n k&#7871;t n&#224;y h&#7871;t h&#7841;n l&#250;c: <strong>${expiresAt}</strong>.</p>
      `,
      buttonText: 'X&#193;C NH&#7852;N &#272;&#7892;I GH&#7870;',
      buttonUrl: data.link,
      footerText: 'N&#7871;u b&#7841;n kh&#244;ng x&#225;c nh&#7853;n trong th&#7901;i gian hi&#7879;u l&#7921;c, h&#7879; th&#7889;ng c&#243; th&#7875; t&#7921; &#273;&#7897;ng ch&#7885;n gh&#7871; &#273;&#7873; xu&#7845;t &#273;&#7847;u ti&#234;n theo quy tr&#236;nh h&#7895; tr&#7907; s&#7921; c&#7889;.',
    });

    await this.sendEmail(
      email,
      'Railflow - Xác nhận đổi ghế',
      `Ghế của bạn cần được thay thế. Vui lòng xác nhận tại: ${data.link}`,
      html
    );
  }

  async sendSeatReplacementSuccessEmail(email: string, data: {
    newSeatName?: string | null;
    newCoachName?: string | number | null;
  }) {
    const html = this.getHtmlTemplate({
      title: '&#272;&#7893;i gh&#7871; th&#224;nh c&#244;ng',
      previewText: 'V&#233; c&#7911;a b&#7841;n &#273;&#227; &#273;&#432;&#7907;c c&#7853;p nh&#7853;t sang gh&#7871; m&#7899;i.',
      content: `
        <p style="margin: 0; font-size: 16px; line-height: 24px;">Ch&#224;o b&#7841;n,</p>
        <p style="margin: 20px 0; font-size: 16px; line-height: 24px;">V&#233; c&#7911;a b&#7841;n &#273;&#227; &#273;&#432;&#7907;c c&#7853;p nh&#7853;t sang gh&#7871; m&#7899;i.</p>
        <div style="background-color: #F0FDF4; border-radius: 16px; padding: 16px; border: 1px solid #BBF7D0;">
          <p style="margin: 0; font-size: 14px;"><strong>Gh&#7871; m&#7899;i:</strong> Toa ${data.newCoachName || 'N/A'} - Gh&#7871; ${data.newSeatName || 'N/A'}</p>
        </div>
      `,
      buttonText: 'XEM L&#7882;CH S&#7916; &#272;&#7862;T V&#201;',
      buttonUrl: `${this.configService.get('FRONTEND_URL') || 'http://localhost:4000'}/dashboard/history`,
      footerText: 'C&#7843;m &#417;n b&#7841;n &#273;&#227; ph&#7889;i h&#7907;p v&#7899;i Railflow trong qu&#225; tr&#236;nh x&#7917; l&#253; s&#7921; c&#7889; gh&#7871;.',
    });

    await this.sendEmail(
      email,
      'Railflow - Đổi ghế thành công',
      `Vé của bạn đã được cập nhật sang ghế mới: Toa ${data.newCoachName || 'N/A'} - Ghế ${data.newSeatName || 'N/A'}.`,
      html
    );
  }

  async sendSeatIssueRefundEmail(email: string, data: {
    refundAmount: number;
    bookingCode?: string | null;
  }) {
    const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.refundAmount);
    const html = this.getHtmlTemplate({
      title: 'Ho&#224;n ti&#7873;n s&#7921; c&#7889; gh&#7871;',
      previewText: 'V&#233; b&#7883; &#7843;nh h&#432;&#7903;ng b&#7903;i s&#7921; c&#7889; gh&#7871; &#273;&#227; &#273;&#432;&#7907;c ho&#224;n ti&#7873;n.',
      content: `
        <p style="margin: 0; font-size: 16px; line-height: 24px;">Ch&#224;o b&#7841;n,</p>
        <p style="margin: 20px 0; font-size: 16px; line-height: 24px;">Railflow kh&#244;ng t&#236;m &#273;&#432;&#7907;c gh&#7871; thay th&#7871; ph&#249; h&#7907;p cho v&#233; b&#7883; &#7843;nh h&#432;&#7903;ng. H&#7879; th&#7889;ng &#273;&#227; ho&#224;n 100% gi&#225; tr&#7883; v&#233; v&#224;o v&#237; c&#7911;a b&#7841;n.</p>
        <div style="background-color: #FFF7ED; border-radius: 16px; padding: 16px; border: 1px solid #FED7AA;">
          <p style="margin: 0; font-size: 14px;"><strong>S&#7889; ti&#7873;n ho&#224;n:</strong> ${amount}</p>
          <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>M&#227; &#273;&#417;n:</strong> ${data.bookingCode || 'N/A'}</p>
        </div>
      `,
      buttonText: 'XEM V&#205; C&#7910;A T&#212;I',
      buttonUrl: `${this.configService.get('FRONTEND_URL') || 'http://localhost:4000'}/dashboard/wallet`,
      footerText: 'N&#7871;u c&#7847;n h&#7895; tr&#7907; th&#234;m, vui l&#242;ng li&#234;n h&#7879; b&#7897; ph&#7853;n ch&#259;m s&#243;c kh&#225;ch h&#224;ng Railflow.',
    });

    await this.sendEmail(
      email,
      'Railflow - Hoàn tiền sự cố ghế',
      `Railflow đã hoàn tiền ${amount} cho vé bị ảnh hưởng bởi sự cố ghế.`,
      html
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
