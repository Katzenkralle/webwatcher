from typing_extensions import Any

from webw_serv import Watcher

import requests
import time
import datetime


#  gets wehather n hours from now
HOURLT_QUERY_PART = '&forecast_days=16&timeformat=unixtime&hourly=temperature_2m,precipitation,weather_code,visibility,relative_humidity_2m,precipitation_probability,wind_speed_10m'
#  gets wehather n days from now
DAYLY_QUERY_PART = '&forecast_days=16&timeformat=unixtime&daily=weather_code,sunrise,sunset,precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min'
CURRENT_QUERY_PART = '&timeformat=unixtime&current=temperature_2m,relative_humidity_2m,is_day,wind_speed_10m,wind_direction_10m,precipitation,weather_code,cloud_cover'


class ScriptMain(Watcher):
    supports_static_schema = False

    def __init__(self, config: dict[str, Any]):
        self.options = config

    @staticmethod
    async def __get_weather(query_url):
        response = requests.get(query_url)
        if response.status_code == 200:
            return response.json()
        else:
            raise ValueError(f"Error fetching weather data: {response.status_code}")

    @staticmethod
    def __base_quety_constructor(lat, lon, timezone, api_key):
        timezone = timezone.replace(" ", "%20").replace("/", "%2F")
        query = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&timezone={timezone}"
        if api_key:
            query += f"&apikey={api_key}"
        return query

    @staticmethod 
    def __get_dict_for_time(time, data):
        valuable_data = {}
        if isinstance(data["time"], list):
            closest_index = data["time"].index(sorted(data["time"], key=lambda x: abs(x - time))[0])
        for key, value in data.items():
            if isinstance(value, list):
                valuable_data[key] = value[closest_index]
            else:
                valuable_data[key] = value
            if key == "time":
                valuable_data[key] = datetime.datetime.fromtimestamp(valuable_data[key]).strftime('%Y-%m-%d %H:%M:%S')
        return valuable_data



    async def run(self) -> dict[str, Any]:
        options = self.options
        if not options:
            options = {} 
        if options.get("custom_query"):
            query_url = options["custom_query"]
            return self.get_weather(query_url)
        else:
            future = options.get("future", 1)
            query_url = self.base_quety_constructor(
                options.get("lat", 52.52),
                options.get("lon", 13.41),
                options.get("timezone", '&timezone=Europe/Berlin'),
                options.get("api_key", None))
            match options.get("mode", "current"):
                case "hourly":
                    query_url += HOURLT_QUERY_PART
                    data = self.get_weather(query_url)['hourly']
                    future *= 3600
                case "daily":
                    query_url += DAYLY_QUERY_PART
                    data = self.get_weather(query_url)['daily']
                    future *= 86400
                case "current":
                    query_url += CURRENT_QUERY_PART
                    data = self.get_weather(query_url)['current']
                case _:
                    raise ValueError(f"Invalid mode: {options['mode']}")
            return self.get_dict_for_time(
                int(time.time()+future),
                data
            )

    def get_return_schema(self) -> dict[str, str] | None:
        return None


    @staticmethod
    def get_config_schema() -> dict[str, str] | None:
        """
        lat: "float" # Latitude of the location, default is Berlin
        lon: "float" # Longitude of the location, default is Berlin
        timezone: "str" # Timezone of the location, default is Europe/Berlin
        mode: 'str' # Mode of the query, can be "hourly", "daily" or "current", default is "current"
        future: int # Future time, unit depends on the mode, either hours or days, default is 1

        api_key: "str" # API key for the Open Meteo API, default is None
        custom_query: "str" # Allows to use a custom query string, see: https://open-meteo.com/en/docs

        """
        return {
        "custom_query": "str",
        "lat": "float",
        "lon": "float",
        "timezone": "str",
        "mode": 'str',
        "future": 'int',
        "api_key": "str",
        "past_range": "int"
    }





