import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Accident, AccidentSchema } from '../accidents/schemas/accident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Accident.name, schema: AccidentSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
