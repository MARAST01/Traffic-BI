import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { AnalyticsFilterDto } from '../analytics/dto/analytics-filter.dto';
import { ExportAccidentsDto } from './dto/export-accidents.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('accidents')
@UseGuards(JwtAuthGuard)
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Get()
  async getAccidents(
    @Query() filters: AnalyticsFilterDto,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('sort') sort = 'Start_Time,desc',
  ) {
    return this.accidentsService.findPaginated(filters, +page, +limit, sort);
  }

  @Post('export')
  async exportAccidents(
    @Body() body: ExportAccidentsDto,
    @Res() res: Response,
  ) {
    const { format, ...filters } = body;
    return this.accidentsService.exportData(filters, format, res);
  }
}
