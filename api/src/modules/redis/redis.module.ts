import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService) => {
                return new Redis(configService.getOrThrow('REDIS_URL'));
            },
            inject: [ConfigService],
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule { }
