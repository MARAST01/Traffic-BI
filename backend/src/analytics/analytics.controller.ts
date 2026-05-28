import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto/analytics-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('filters/locations')
  async getLocations() {
    return this.analyticsService.getLocations();
  }

  @Get('filters/weather')
  async getWeather() {
    return this.analyticsService.getWeatherConditions();
  }

  @Get('filters/date-range')
  async getDateRange() {
    return this.analyticsService.getDateRange();
  }

  @Get('kpis')
  async getKpis(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getKpis(filters);
  }

  @Get('charts/trend')
  async getTrend(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getTrend(filters);
  }

  @Get('charts/severity-distribution')
  async getSeverity(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getSeverityDistribution(filters);
  }

  @Get('charts/time-of-day')
  async getTimeOfDay(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getTimeOfDay(filters);
  }

  @Get('charts/poi-impact')
  async getPoiImpact(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getPoiImpact(filters);
  }

  @Get('map/heatmap')
  async getHeatmap(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getHeatmap(filters);
  }

  @Get('charts/state-ranking')
  async getStateRanking(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getStateRanking(filters);
  }

  @Get('charts/weather-distribution')
  async getWeatherDistribution(@Query() filters: AnalyticsFilterDto) {
    return this.analyticsService.getWeatherDistribution(filters);
  }
}
