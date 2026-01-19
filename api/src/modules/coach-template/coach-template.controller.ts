import { Controller, Get } from '@nestjs/common';
import { CoachTemplateService } from './coach-template.service';

@Controller('coach-template')
export class CoachTemplateController {
  constructor(private readonly coachTemplateService: CoachTemplateService) { }

  @Get()
  findAll() {
    return this.coachTemplateService.findAll();
  }
}
