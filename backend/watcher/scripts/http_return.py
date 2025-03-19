from backend.watcher.base import Watcher
import aiohttp
from http.client import responses

class ScriptMain(Watcher):
    def __init__(self, config: dict[str, any]):
        if "url" not in config:
            raise ValueError("Config must contain a 'url' key")
        self.url = config["url"]

    async def run(self):
        async with aiohttp.ClientSession() as session:
            async with session.get(self.url) as response:
                return {
                    "url": self.url,
                    "status_code": response.status,
                    "description": responses.get(response.status, "Unknown Status")}


    def get_config_schema(self) -> dict[str, str] | None:
        return {"url":"str"}

    def get_return_schema(self) -> dict[str, str] | None:
        return {
            "url": "str",
            "status_code": "int",
            "description": "str"}