import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccidentsController } from './accidents.controller';
import { AccidentsService } from './accidents.service';
import { Accident, AccidentSchema } from './schemas/accident.schema';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Accident.name, schema: AccidentSchema },
    ]),
    AnalyticsModule, //
  ],
  controllers: [AccidentsController],
  providers: [AccidentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}
