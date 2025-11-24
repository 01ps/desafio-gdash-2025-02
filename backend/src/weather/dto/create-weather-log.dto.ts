import { IsNumber, IsOptional, IsString, IsDateString } from "class-validator";

export class CreateWeatherLogDto {
  @IsString()
  city: string;
  @IsNumber()
  lat: number;
  @IsNumber()
  lon: number;
  @IsNumber()
  temperature: number;
  @IsNumber()
  humidity: number;
  @IsNumber()
  wind_speed: number;
  @IsString()
  condition: string;
  @IsOptional()
  @IsNumber()
  precipitation_probability?: number;
  @IsString()
  source: string;
  @IsOptional()
  @IsDateString()
  collected_at?: string;
}
