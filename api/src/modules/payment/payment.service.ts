import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto } from './dto/create-payment.dto';
import * as querystring from 'qs';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { BookingService } from '../booking/booking.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => BookingService))
        private readonly bookingService: BookingService,
    ) { }

    createPaymentUrl(dto: CreatePaymentDto): string {
        const tmnCode = this.configService.get<string>('VNP_TMN_CODE') ?? '';
        const secretKey = this.configService.get<string>('VNP_HASH_SECRET') ?? '';
        let vnpUrl = this.configService.get<string>('VNP_URL') ?? '';
        const returnUrl = this.configService.get<string>('VNP_RETURN_URL') ?? '';

        if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
            this.logger.error('Thiếu cấu hình VNPAY');
            throw new Error('Cấu hình thanh toán bị thiếu');
        }

        const date = new Date();
        const createDate = dayjs(date).format('YYYYMMDDHHmmss');
        const orderId = dto.orderId;

        let vnp_Params: any = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = dto.language || 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = dto.orderInfo;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = dto.amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = dto.ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;

        if (dto.bankCode) {
            vnp_Params['vnp_BankCode'] = dto.bankCode;
        }

        vnp_Params = this.sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        return vnpUrl;
    }

    verifyReturnUrl(vnp_Params: any): { isSuccess: boolean; orderId: string; responseCode: string } {
        const secureHash = vnp_Params['vnp_SecureHash'];
        const orderId = vnp_Params['vnp_TxnRef'];
        const rspCode = vnp_Params['vnp_ResponseCode'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = this.sortObject(vnp_Params);

        const secretKey = this.configService.get<string>('VNP_HASH_SECRET') ?? '';
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            // Kiểm tra trạng thái đơn hàng trong DB nếu cần
            // Tạm thời trả về trạng thái hợp lệ
            return {
                isSuccess: rspCode === '00',
                orderId,
                responseCode: rspCode
            };
        } else {
            return {
                isSuccess: false,
                orderId,
                responseCode: '97' // Checksum failed
            };
        }
    }

    handleIpn(vnp_Params: any) {
        const secureHash = vnp_Params['vnp_SecureHash'];
        const orderId = vnp_Params['vnp_TxnRef'];
        const rspCode = vnp_Params['vnp_ResponseCode'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = this.sortObject(vnp_Params);

        const secretKey = this.configService.get<string>('VNP_HASH_SECRET') ?? '';
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            // TODO: Cập nhật trạng thái đơn hàng trong database
            // Việc này yêu cầu inject BookingService hoặc Repository
            // Tạm thời trả về response thành công theo format VNPAY
            if (rspCode === '00') {
                this.logger.log(`Thanh toán thành công cho đơn hàng ${orderId}`);
                return { RspCode: '00', Message: 'Success' };
            } else {
                this.logger.warn(`Thanh toán thất bại cho đơn hàng ${orderId} với mã lỗi ${rspCode}`);
                return { RspCode: '00', Message: 'Success' }; // VNPAY expects 00 if process ran correctly, even if payment failed
            }
        } else {
            return { RspCode: '97', Message: 'Checksum failed' };
        }
    }

    async payBooking(bookingCode: string, userId: string, amount: number) {
        // Tạo Transaction cho thanh toán VNPAY
        await this.prisma.transaction.create({
            data: {
                userId,
                amount: -amount,
                type: 'PAYMENT',
                paymentMethod: 'VNPAY',
                status: 'COMPLETED',
                referenceId: bookingCode,
                description: `Thanh toán vé tàu ${bookingCode} qua VNPAY`
            }
        });

        // Xác nhận booking (tạo vé, cập nhật trạng thái)
        await this.bookingService.confirmBooking(bookingCode);
    }

    private sortObject(obj: any): any {
        const sorted: any = {};
        const str: string[] = [];
        let key;
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
        }
        return sorted;
    }
}
