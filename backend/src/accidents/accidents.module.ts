import { Module } from '@nestjs/common';
import { AccidentsService } from './accidents/accidents.service';
import { AccidentsController } from './accidents/accidents.controller';

@Module({
  providers: [AccidentsService],
  controllers: [AccidentsController]
})
export class AccidentsModule {}
