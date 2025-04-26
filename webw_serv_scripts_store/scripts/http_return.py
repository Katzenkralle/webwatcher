from typing_extensions import Any, Type

from webw_serv import Watcher
import requests
from http import HTTPStatus

class ScriptMain(Watcher):
    supports_static_schema = True

    def __init__(self, config: dict[str, Any]):
        if "url" not in config:
            raise ValueError("Config must contain a 'url' key")
        self.url = config["url"]

    def run(self):
        response = requests.get(self.url)
        return {
            "url": self.url,
            "http_version": response.raw.version,
            "encoding": response.encoding,
            "status_code": response.status_code,
            "description": HTTPStatus(response.status_code).phrase if response.status_code in HTTPStatus._value2member_map_ else "Unknown Status"
        }

    def get_return_schema(self) -> dict[str, Type[str | int | bool]] | None:
        return {
            "url": str,
            "http_version": int,
            "encoding": str,
            "status_code": int,
            "description": str
        }

    @staticmethod
    def get_config_schema() -> dict[str, Type[str | int | bool]] | None:
        return {"url": str}
