import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WeatherModule } from "./weather.module";

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || "mongodb://localhost:27017/gdash"
    ),
    WeatherModule,
  ],
})
export class AppModule {}
