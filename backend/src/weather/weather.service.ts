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

  async findAll(query: Record<string, any>) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model
        .find()
        .sort({ collected_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(),
    ]);
    return { items, total, page, limit };
  }
}
