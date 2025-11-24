import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Headers,
  UnauthorizedException,
  StreamableFile,
} from "@nestjs/common";
import { WeatherService } from "./weather.service";
import { CreateWeatherLogDto } from "./dto/create-weather-log.dto";

const INTERNAL_HEADER = "x-internal-api-key";

@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post("logs")
  async create(
    @Body() dto: CreateWeatherLogDto,
    @Headers(INTERNAL_HEADER) apiKey: string
  ) {
    if (
      process.env.INTERNAL_API_KEY &&
      apiKey !== process.env.INTERNAL_API_KEY
    ) {
      throw new UnauthorizedException("Invalid internal API key");
    }
    return this.weatherService.create(dto);
  }

  @Get("logs")
  async findAll(@Query() query: Record<string, any>) {
    return this.weatherService.findAll(query);
  }

  @Get("export.csv")
  async exportCsv(): Promise<StreamableFile> {
    return this.weatherService.exportCsv();
  }

  @Get("export.xlsx")
  async exportXlsx(): Promise<StreamableFile> {
    return this.weatherService.exportXlsx();
  }
}
