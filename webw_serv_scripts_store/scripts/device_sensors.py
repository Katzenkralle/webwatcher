from typing_extensions import Any

from webw_serv import Watcher

import sensors

class ScriptMain(Watcher):
    def __init__(self, config: dict[str, Any]):
        self.ignore_chips = config.get("ignore_chips", "").split(",")
        self.ignore_sensors = config.get("ignore_sensors", "").split(",")
        sensors.init()
        

    async def run(self) -> dict[str, Any]:
        found_sensors = {}
        for chip in sensors.iter_detected_chips():
            if chip.name in self.ignore_chips:
                continue
            for sensor in chip.iter_sensors():
                if sensor.name in self.ignore_sensors:
                    continue
                found_sensors[sensor.name] = sensor.get_value()
        return found_sensors 


    @staticmethod
    def get_config_schema() -> dict[str, str] | None:
        return {{
            "ignore_chips": "str",
            "ignore_sensors": "str"
            }}

    def get_return_schema(self) -> dict[str, str] | None:
        return None
