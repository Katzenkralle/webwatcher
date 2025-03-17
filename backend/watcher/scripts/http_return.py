
import aiohttp
from http.client import responses
from ..base import Watcher, JobEntry, ResultType
import time

class HTTPStatusReturn(Watcher):
    def __init__(self, config: dict[str, any]):
        if "url" not in config:
            raise ValueError("Config must contain a 'url' key")
        self.url = config["url"]

    async def run(self)  -> JobEntry:
        start = time.time()
        async with aiohttp.ClientSession() as session:
            async with session.get(self.url) as response:
                end = time.time()
                return {
                    "timestamp": start,
                    "script_runtime": end - start,
                    "result": ResultType.OK,
                    "script_failure": False,
                    "context": {
                        "url": self.url,
                        "status_code": response.status,
                        "description": responses.get(response.status, "Unknown Status")
                        }
                    }


    def get_config_schema() -> dict[str, str] | None:
        return {"url":"str"}
    
    def get_return_schema() -> dict[str, str] | None:
        return {
            "url": "str",
            "status_code": "int",
            "description": "str"}
    