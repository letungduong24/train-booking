import { IsInt, Min } from 'class-validator';

export class SetDelayDto {
    @IsInt()
    @Min(0)
    minutes: number;
}
