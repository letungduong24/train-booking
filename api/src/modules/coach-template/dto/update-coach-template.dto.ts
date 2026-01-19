import { PartialType } from '@nestjs/mapped-types';
import { CreateCoachTemplateDto } from './create-coach-template.dto';

export class UpdateCoachTemplateDto extends PartialType(CreateCoachTemplateDto) {}
