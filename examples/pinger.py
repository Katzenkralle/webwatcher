from pythonping import ping

from webw_serv import Watcher
from typing_extensions import Any, Type



class ScriptMain(Watcher):
    """
    A simple ping watcher that checks the latency to a given host.

    NOTE: This watcher requires the conteinaer to have 'CAP_NET_RAW' capabilities
    """
    supports_static_schema = True

    def __init__(self, config: dict[str, Any]):
        if "host" not in config:
            raise ValueError("Config must contain a 'host' key")

        self.count = config.get("tries", 1)
        self.timeout = config.get("timeout", 2)
        self.host = config["host"]

    def run(self):
        response = ping(self.host, count=1, timeout=2)
        if response.success():
            latency = response.rtt_avg_ms
            max_latency = response.rtt_max_ms
            min_latency = response.rtt_min_ms
            loss = response.packet_loss
        else:
            raise ConnectionError(f"{self.host} konnte nicht erreicht werden.")
        data = {
            "host": self.host,
            "avg_latency": latency
        }
        return data

    def get_return_schema(self) -> dict[str, Type[str | int | bool]] | None:
        data_schema = {
            "host": str,
            "avg_latency": float,
            "max_latency": float,
            "min_latency": float,
            "loss": float
        }
        return data_schema

    @staticmethod
    def get_config_schema() -> dict[str, Type[str | int | bool]] | None:
        return {
            "host": str,
            "tries": int,
            "timeout": int
            }
