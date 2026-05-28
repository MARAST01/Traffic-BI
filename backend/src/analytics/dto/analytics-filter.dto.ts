import { IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AnalyticsFilterDto {
  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj.ubicacion)
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value, obj }) => value ?? obj.clima)
  weather?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  severity?: number;

  @IsOptional()
  @IsDateString()
  @Transform(({ value, obj }) => value ?? obj.fechaInicio)
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ value, obj }) => value ?? obj.fechaFin)
  endDate?: string;

  /** Alias en español (mapeado a startDate) */
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  /** Alias en español (mapeado a endDate) */
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  /** Alias en español (mapeado a state) */
  @IsOptional()
  @IsString()
  ubicacion?: string;

  /** Alias en español (mapeado a weather) */
  @IsOptional()
  @IsString()
  clima?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  sort?: string;
}
