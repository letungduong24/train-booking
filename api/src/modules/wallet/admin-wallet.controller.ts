import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ApproveWithdrawDto } from './dto/approve-withdraw.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from 'src/lib/decorators/roles.decorator';

import { Role } from 'src/lib/enums/roles.enum';

@Controller('admin/wallet')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.Admin)
export class AdminWalletController {
    constructor(private readonly walletService: WalletService) { }

    @Post('approve-withdraw')
    async approveWithdraw(@Body() dto: ApproveWithdrawDto) {
        return this.walletService.approveWithdraw(dto.transactionId);
    }

    @Post('reject-withdraw')
    async rejectWithdraw(@Body() dto: ApproveWithdrawDto) {
        return this.walletService.rejectWithdraw(dto.transactionId);
    }

    @Get('withdrawals')
    async getWithdrawals() {
        return this.walletService.getPendingWithdrawals();
    }
}
