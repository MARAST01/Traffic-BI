import { IsIn } from 'class-validator';
import { AnalyticsFilterDto } from '../../analytics/dto/analytics-filter.dto';

export class ExportAccidentsDto extends AnalyticsFilterDto {
  @IsIn(['xlsx', 'pdf'])
  format: 'xlsx' | 'pdf';
}
