import { Injectable, StreamableFile } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Weather } from "./schemas/weather.schema";
import { CreateWeatherLogDto } from "./dto/create-weather-log.dto";
import { PassThrough } from "stream";
import * as fastCsv from "fast-csv";
import { Workbook } from "exceljs";

@Injectable()
export class WeatherService {
  async exportXlsx(): Promise<StreamableFile> {
    const wb = new Workbook();
    const sheet = wb.addWorksheet("Weather");
    sheet.columns = [
      { header: "City", key: "city" },
      { header: "Lat", key: "lat" },
      { header: "Lon", key: "lon" },
      { header: "Temperature", key: "temperature" },
      { header: "Humidity", key: "humidity" },
      { header: "Wind Speed", key: "wind_speed" },
      { header: "Condition", key: "condition" },
      { header: "Precip Prob", key: "precipitation_probability" },
      { header: "Source", key: "source" },
      { header: "Collected At", key: "collected_at" },
    ];
    const docs = await this.model.find().sort({ collected_at: -1 }).lean();
    sheet.addRows(docs);
    const buf = await wb.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buf), {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      disposition: 'attachment; filename="weather_logs.xlsx"',
    });
  }

  async exportCsv(): Promise<StreamableFile> {
    const cursor = this.model.find().sort({ collected_at: -1 }).cursor();
    const stream = new PassThrough();
    const csv = fastCsv.format({ headers: true });
    csv.pipe(stream);
    (async () => {
      for await (const doc of cursor) {
        const { _id, __v, ...rest } = doc.toObject();
        csv.write(rest);
      }
      csv.end();
    })();
    return new StreamableFile(stream, {
      type: "text/csv",
      disposition: 'attachment; filename="weather_logs.csv"',
    });
  }

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
