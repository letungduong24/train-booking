import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Prisma } from '../../generated/client';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: RegisterDto, res: Response) {
        const { email, password, name } = registerDto;

        try {
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
            });

            // Generate tokens
            const tokens = await this.generateTokens(user.id, user.email);

            // Set access token as httpOnly cookie
            res.cookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: this.configService.get('NODE_ENV') === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000, // 15 minutes
            });

            // Set refresh token as httpOnly cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: this.configService.get('NODE_ENV') === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            const { password: _password, ...rest } = user;

            return rest;
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                // P2002: Unique constraint violation
                if (e.code === 'P2002') {
                    throw new ConflictException('Email này đã được sử dụng');
                }
            }
            throw e;
        }
    }

    async login(loginDto: LoginDto, res: Response) {
        const { email, password } = loginDto;

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email);

        // Set access token as httpOnly cookie
        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Set refresh token as httpOnly cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const { password: _password, ...rest } = user;

        return rest;
    }

    async refreshTokens(req: Request, res: Response) {
        // Get refresh token from cookie
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw new BadRequestException('Yêu cầu refresh token');
        }

        // Verify refresh token
        let payload: any;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch (error) {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }

        // Check if refresh token exists in database
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken) {
            throw new UnauthorizedException('Không tìm thấy refresh token');
        }

        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            // Delete expired token
            await this.prisma.refreshToken.delete({
                where: { id: storedToken.id },
            });
            throw new UnauthorizedException('Refresh token đã hết hạn');
        }

        // Delete old refresh token (rotation)
        await this.prisma.refreshToken.delete({
            where: { id: storedToken.id },
        });

        // Generate new tokens
        const tokens = await this.generateTokens(
            storedToken.user.id,
            storedToken.user.email,
        );

        // Set new access token as httpOnly cookie
        res.cookie('accessToken', tokens.accessToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        // Set new refresh token as httpOnly cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const { password: _password, ...rest } = storedToken.user;

        return rest;
    }

    async revokeRefreshToken(req: Request, res: Response) {
        // Get refresh token from cookie
        const refreshToken = req.cookies?.refreshToken;

        // Clear both cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        if (!refreshToken) {
            return { message: 'Không có token để thu hồi' };
        }

        try {
            await this.prisma.refreshToken.delete({
                where: { token: refreshToken },
            });
            return { message: 'Đăng xuất thành công' };
        } catch (error) {
            // Token doesn't exist, which is fine
            return { message: 'Đăng xuất thành công' };
        }
    }

    private async generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const jwtSecret = this.configService.get<string>('JWT_SECRET') || '';
        const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || '';
        const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
        const jwtRefreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

        // Generate access token
        const accessToken = this.jwtService.sign(payload, {
            secret: jwtSecret,
            expiresIn: jwtExpiresIn,
        } as any);

        // Generate refresh token
        const refreshToken = this.jwtService.sign(payload, {
            secret: jwtRefreshSecret,
            expiresIn: jwtRefreshExpiresIn,
        } as any);

        // Store refresh token in database
        const expiresAt = new Date();

        // Parse expiration time (simple parser for common formats like "7d", "24h")
        const match = jwtRefreshExpiresIn.match(/^(\d+)([dhms])$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];

            switch (unit) {
                case 'd':
                    expiresAt.setDate(expiresAt.getDate() + value);
                    break;
                case 'h':
                    expiresAt.setHours(expiresAt.getHours() + value);
                    break;
                case 'm':
                    expiresAt.setMinutes(expiresAt.getMinutes() + value);
                    break;
                case 's':
                    expiresAt.setSeconds(expiresAt.getSeconds() + value);
                    break;
            }
        } else {
            // Default to 7 days if parsing fails
            expiresAt.setDate(expiresAt.getDate() + 7);
        }

        await this.prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId,
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
        };
    }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }
        const { password: _password, ...rest } = user;
        return rest
    }

}
