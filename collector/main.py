import json
import logging
import os
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional

import pika
import requests
from dotenv import load_dotenv

load_dotenv()

# Config
RABBIT_URL = os.getenv("RABBIT_URL", "amqp://guest:guest@localhost:5672/")
RABBIT_QUEUE = os.getenv("RABBIT_QUEUE", "weather_readings")
OPEN_WEATHER_API_KEY = os.getenv("OPEN_WEATHER_API_KEY", "")
CITY = os.getenv("CITY", "YourCity")
LAT = float(os.getenv("LAT", "0"))
LON = float(os.getenv("LON", "0"))
PUBLISH_INTERVAL_SECONDS = int(os.getenv("PUBLISH_INTERVAL_SECONDS", "3600"))
SERVICE_NAME = os.getenv("COLLECTOR_SERVICE_NAME", "collector")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("collector")

OPEN_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


@dataclass
class WeatherPayload:
    city: str
    lat: float
    lon: float
    temperature: float
    humidity: float
    wind_speed: float
    condition: str
    precipitation_probability: Optional[float]
    source: str
    collected_at: datetime


def fetch_weather() -> WeatherPayload:
    if not OPEN_WEATHER_API_KEY:
        raise ValueError("OPEN_WEATHER_API_KEY is missing")
    params = {
        "lat": LAT,
        "lon": LON,
        "appid": OPEN_WEATHER_API_KEY,
        "units": "metric",
        "lang": "pt_br",
    }
    resp = requests.get(OPEN_WEATHER_URL, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    main = data.get("main", {})
    wind = data.get("wind", {})
    weather_list = data.get("weather", [])
    weather_item = weather_list[0] if weather_list else {}

    return WeatherPayload(
        city=CITY or data.get("name", "Unknown"),
        lat=LAT,
        lon=LON,
        temperature=main.get("temp"),
        humidity=main.get("humidity"),
        wind_speed=wind.get("speed"),
        condition=str(weather_item.get("description") or weather_item.get("main") or ""),
        precipitation_probability=None,  # current endpoint não traz probabilidade
        source="openweather",
        collected_at=datetime.utcnow(),
    )

def publish_weather(payload: WeatherPayload) -> None:
    conn = pika.BlockingConnection(pika.URLParameters(RABBIT_URL))
    channel = conn.channel()
    channel.queue_declare(queue=RABBIT_QUEUE, durable=True)
    channel.basic_publish(
        exchange="",
        routing_key=RABBIT_QUEUE,
        body=json.dumps(asdict(payload), default=str),
        properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
    )
    logger.info("published weather payload", extra={"queue": RABBIT_QUEUE})
    conn.close()


def main() -> None:
    logger.info("collector started", extra={"service": SERVICE_NAME})
    while True:
        try:
            payload = fetch_weather()
            publish_weather(payload)
            logger.info("cycle ok", extra={"city": payload.city})
        except Exception as exc:  # noqa: BLE001
            logger.exception("collector cycle failed", extra={"error": str(exc)})
            time.sleep(5)
            continue
        time.sleep(PUBLISH_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
