from typing_extensions import Any, Type

from webw_serv import Watcher
import aiohttp
from http.client import responses

class ScriptMain(Watcher):
    def __init__(self, config: dict[str, Any]):
        if "url" not in config:
            raise ValueError("Config must contain a 'url' key")
        self.url = config["url"]

    async def run(self):
        async with aiohttp.ClientSession() as session:
            async with session.get(self.url) as response:
                return {
                    "url": self.url,
                    "status_code": response.status,
                    "description": responses.get(response.status, "Unknown Status")
                }

    @staticmethod
    def get_config_schema() -> dict[str, Type[str | int | bool]] | None:
        return {"url": str}

    @staticmethod
    def get_return_schema() -> dict[str, Type[str | int | bool]] | None:
        return {
            "url": str,
            "status_code": int,
            "description": str
        }
