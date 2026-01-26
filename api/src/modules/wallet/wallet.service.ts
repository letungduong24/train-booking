import { BadRequestException, Injectable, Inject, forwardRef, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SetupPinDto } from './dto/setup-pin.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { PayBookingWalletDto } from './dto/pay-booking-wallet.dto';
import { BookingService } from '../booking/booking.service';
import { TransactionType, TransactionStatus } from '../../generated/client';

@Injectable()
export class WalletService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => BookingService))
        private readonly bookingService: BookingService,
    ) { }

    async setupPin(userId: string, dto: SetupPinDto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        if (user.walletPin) {
            throw new BadRequestException('PIN already set. Use change-pin to update.');
        }

        const hashedPin = await bcrypt.hash(dto.pin, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { walletPin: hashedPin }
        });

        return { message: 'PIN setup successful' };
    }

    async getWalletInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true, walletPin: true }
        });

        const transactions = await this.prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return {
            balance: user?.balance || 0,
            hasPin: !!user?.walletPin,
            transactions
        };
    }

    async requestWithdraw(userId: string, dto: WithdrawRequestDto) {
        const { amount, bankName, bankAccount, accountName } = dto;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        if (user.balance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        // Atomic transaction: Deduct balance & Create Transaction
        await this.prisma.$transaction(async (tx) => {
            // 1. Deduct balance
            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: amount } }
            });

            // 2. Create Transaction Record
            await tx.transaction.create({
                data: {
                    userId,
                    amount: -amount, // Negative for withdraw
                    type: 'WITHDRAW',
                    status: 'PENDING',
                    bankName,
                    bankAccount,
                    accountName,
                    description: `Rút tiền về ${bankName} - ${bankAccount}`
                }
            });
        });

        return { message: 'Withdraw request submitted' };
    }

    async payBooking(userId: string, dto: PayBookingWalletDto) {
        const { bookingCode, pin } = dto;

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        if (!user.walletPin) {
            throw new BadRequestException('Wallet PIN not set');
        }

        const isPinValid = await bcrypt.compare(pin, user.walletPin);
        if (!isPinValid) {
            throw new UnauthorizedException('Mã PIN không chính xác');
        }

        // Fetch Booking
        const booking = await this.prisma.booking.findUnique({ where: { code: bookingCode } });
        if (!booking) throw new BadRequestException('Booking not found');
        if (booking.status !== 'PENDING') throw new BadRequestException('Booking is not pending');
        if (booking.userId !== userId) throw new BadRequestException('Booking does not belong to user');

        const amount = booking.totalPrice;
        if (user.balance < amount) {
            throw new BadRequestException('Insufficient wallet balance');
        }

        // PROCESS PAYMENT & BOOKING CONFIRMATION
        // We need to be careful with Race Condition here too.
        // We will call BookingService.confirmBooking, but we need to inject the logic to deduct money.
        // Or we deduct money first, then try confirm. If confirm fails, refund.

        try {
            // 1. Deduct money first (Pessimistic style)
            await this.prisma.$transaction(async (tx) => {
                await tx.user.update({
                    where: { id: userId },
                    data: { balance: { decrement: amount } }
                });

                await tx.transaction.create({
                    data: {
                        userId,
                        amount: -amount,
                        type: 'PAYMENT',
                        status: 'COMPLETED',
                        referenceId: bookingCode,
                        description: `Thanh toán vé tàu ${bookingCode}`
                    }
                });
            });

            // 2. Confirm Booking (Create Tickets)
            // If this fails (Race condition), we MUST catch and Refund.
            try {
                // IMPORTANT: We need a way to tell confirmBooking "I already paid".
                // Currently confirmBooking just sets status to PAID.
                // We reuse the logic.
                await this.bookingService.confirmBooking(bookingCode);
            } catch (error) {
                // 3. Rollback/Refund if booking confirmation failed
                console.error('Wallet Payment failed at Ticket Creation. Refunding...', error);

                await this.refundToWallet(userId, amount, bookingCode, 'Hoàn tiền do lỗi xuất vé (Hết ghế)');
                throw new BadRequestException('Giao dịch thất bại do ghế đã hết. Tiền đã được hoàn về ví.');
            }

        } catch (error) {
            throw error;
        }

        return { message: 'Payment successful', bookingCode };
    }

    async refundToWallet(userId: string, amount: number, bookingCode: string, reason: string = 'Hoàn tiền') {
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } }
            });

            await tx.transaction.create({
                data: {
                    userId,
                    amount: amount,
                    type: 'REFUND',
                    status: 'COMPLETED',
                    referenceId: bookingCode,
                    description: reason
                }
            });
        });
    }

    // Admin Method
    async approveWithdraw(transactionId: string) {
        const transaction = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!transaction) throw new BadRequestException('Transaction not found');
        if (transaction.type !== 'WITHDRAW') throw new BadRequestException('Not a withdraw transaction');
        if (transaction.status !== 'PENDING') throw new BadRequestException('Transaction already processed');

        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'COMPLETED' }
        });

        return { message: 'Withdraw approved' };
    }

    async rejectWithdraw(transactionId: string) {
        const transaction = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!transaction) throw new BadRequestException('Transaction not found');
        if (transaction.type !== 'WITHDRAW' || transaction.status !== 'PENDING') throw new BadRequestException('Invalid transaction');

        // Refund balance
        await this.prisma.$transaction(async (tx) => {
            // Revert balance
            await tx.user.update({
                where: { id: transaction.userId },
                data: { balance: { increment: Math.abs(transaction.amount) } }
            });

            await tx.transaction.update({
                where: { id: transactionId },
                data: { status: 'FAILED', description: transaction.description + ' (Rejected)' }
            });
        });

        return { message: 'Withdraw rejected' };
    }
    async getPendingWithdrawals() {
        return this.prisma.transaction.findMany({
            where: {
                type: 'WITHDRAW',
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async createDeposit(userId: string, amount: number) {
        // Create Transaction
        const transaction = await this.prisma.transaction.create({
            data: {
                userId,
                amount,
                type: 'DEPOSIT',
                status: 'PENDING',
                description: `Nạp tiền vào ví`
            }
        });
        return transaction;
    }

    async processDeposit(transactionId: string) {
        const transaction = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!transaction) return;
        if (transaction.status === 'COMPLETED') return; // Already processed

        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: transaction.userId },
                data: { balance: { increment: transaction.amount } }
            });

            await tx.transaction.update({
                where: { id: transactionId },
                data: { status: 'COMPLETED' }
            });
        });
    }
}
