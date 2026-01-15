import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainDto } from './create-train.dto';

export class UpdateTrainDto extends PartialType(CreateTrainDto) {}
