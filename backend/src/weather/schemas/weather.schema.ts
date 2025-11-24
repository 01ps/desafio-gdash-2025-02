import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Weather extends Document {
  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lon: number;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true })
  wind_speed: number;

  @Prop({ required: true })
  condition: string;

  @Prop({ required: false, default: null })
  precipitation_probability?: number | null;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  collected_at: Date;
}
export const WeatherSchema = SchemaFactory.createForClass(Weather);
