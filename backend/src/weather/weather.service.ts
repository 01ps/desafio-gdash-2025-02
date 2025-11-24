import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Weather } from "./schemas/weather.schema";
import { CreateWeatherLogDto } from "./dto/create-weather-log.dto";

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(Weather.name) private readonly model: Model<Weather>
  ) {}

  async create(dto: CreateWeatherLogDto) {
    const doc = new this.model({
      ...dto,
      collected_at: dto.collected_at ? new Date(dto.collected_at) : new Date(),
    });
    return doc.save();
  }
}
