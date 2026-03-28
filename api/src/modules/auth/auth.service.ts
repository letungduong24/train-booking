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
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) { }

  async register(registerDto: RegisterDto, res: Response) {
    const { email, password, name } = registerDto;

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate verification token
      const verificationToken = randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          verificationToken,
          verificationTokenExpires,
        },
      });

      // Send verification email
      await this.mailService.sendVerificationEmail(email, verificationToken);

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Set cookies
      this.setTokenCookies(res, tokens);

      const { password: _password, ...rest } = user;

      return rest;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Email này đã được sử dụng');
        }
      }
      throw e;
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      // Don't leak if email exists or if it's a social account
      return { message: 'Nếu email tồn tại, một liên kết khôi phục đã được gửi.' };
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetTokenExpires: expires,
      },
    });

    await this.mailService.sendForgotPasswordEmail(email, token);
    return { message: 'Nếu email tồn tại, một liên kết khôi phục đã được gửi.' };
  }

  async resetPassword(dto: { token: string; password: string }) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetTokenExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Mã khôi phục không hợp lệ hoặc đã hết hạn');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpires: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async verifyEmail(token: string) {
    console.log('[DEBUG] Verifying token:', token);
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      console.log('[DEBUG] No user found for token:', token);
      throw new BadRequestException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    console.log('[DEBUG] Found user:', user.email, 'Verification status:', user.isEmailVerified);
    console.log('[DEBUG] Token expires at:', user.verificationTokenExpires, 'Now:', new Date());

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      console.log('[DEBUG] Token expired');
      throw new BadRequestException('Mã xác thực đã hết hạn');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    console.log('[DEBUG] Verification success for:', user.email);
    return { message: 'Xác thực email thành công' };
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.isEmailVerified) {
      throw new BadRequestException('Người dùng không tồn tại hoặc đã xác thực');
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpires: expires,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, token);
    return { message: 'Mã xác thực mới đã được gửi vào email của bạn' };
  }

  private setTokenCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      // user.password is null for Google OAuth accounts
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

  /**
   * Alias public để controller Google OAuth có thể gọi.
   */
  async generateTokensPublic(userId: string, email: string) {
    return this.generateTokens(userId, email);
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const jwtSecret = this.configService.get<string>('JWT_SECRET') || '';
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || '';
    const jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const jwtRefreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

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

    if (!user || !user.password) {
      // user.password is null for Google OAuth accounts
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }
    const { password: _password, ...rest } = user;
    return rest;
  }

  async findOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name?: string;
    profilePic?: string;
  }) {
    const { googleId, email, name, profilePic } = googleUser;

    // Try to find existing user by googleId first
    let user = await this.prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      // Try to find existing user by email (to link accounts)
      user = await this.prisma.user.findUnique({ where: { email } });

      if (user) {
        // Link Google account to existing email-based account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { 
            googleId, 
            profilePic: profilePic ?? user.profilePic,
            isEmailVerified: true,
          },
        });
      } else {
        // Create a new user
        user = await this.prisma.user.create({
          data: {
            email,
            name,
            googleId,
            profilePic,
            password: null,
            isEmailVerified: true,
          },
        });
      }
    }

    const { password: _password, ...rest } = user;
    return rest;
  }

  async updateProfile(
    userId: string,
    dto: { name?: string; password?: string },
  ) {
    const data: any = {};
    if (dto.name) {
      data.name = dto.name;
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    const { password: _password, ...rest } = user;
    return rest;
  }

  /**
   * Lấy userId từ request (optional) — đọc accessToken cookie, không throw lỗi.
   * Trả về userId nếu token hợp lệ, null nếu không có hoặc hết hạn.
   */
  async getUserIdFromRequest(req: Request): Promise<string | null> {
    try {
      const token = req.cookies?.accessToken;
      if (!token) return null;
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as { sub: string };
      return payload?.sub ?? null;
    } catch {
      return null;
    }
  }
}
