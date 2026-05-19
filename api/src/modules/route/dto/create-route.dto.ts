import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class RouteStationInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class CreateRouteDto {
  @IsOptional()
  @IsString()
  networkId?: string;

  @IsNotEmpty({ message: 'Mã tuyến không được để trống' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Tên tuyến không được để trống' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsInt()
  @Min(1, { message: 'Thời gian chạy phải lớn hơn 0' })
  durationMinutes: number;

  @IsInt()
  @Min(0, { message: 'Thời gian nghỉ không được âm' })
  turnaroundMinutes: number;

  @IsNumber()
  @Min(1, { message: 'Giá cơ bản phải lớn hơn 0' })
  basePricePerKm: number;

  @IsNumber()
  @Min(0, { message: 'Phí bến không được âm' })
  stationFee: number;

  @IsNumber()
  @Min(0.1, { message: 'Quãng đường phải lớn hơn 0' })
  totalDistanceKm: number;

  @IsNotEmpty({ message: 'Danh sách ga dừng không được để trống' })
  @ArrayMinSize(2, { message: 'Tuyến đường phải có ít nhất 2 ga dừng' })
  @ValidateNested({ each: true })
  @Type(() => RouteStationInput)
  stations: RouteStationInput[];

  @IsOptional()
  pathCoordinates?: any;
}
