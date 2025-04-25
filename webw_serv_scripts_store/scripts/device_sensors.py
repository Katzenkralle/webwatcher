from typing_extensions import Any

from webw_serv import Watcher

import sensors

class ScriptMain(Watcher):
    supports_static_schema = False

    def __init__(self, config: dict[str, Any]):
        chips_cfg = config.get("ignore_chips", "") 
        chips_cfg = chips_cfg if type(chips_cfg) == "str" else ""
        sensor_cfg = config.get("ignore_sensors", "")
        sensor_cfg = sensor_cfg if type(sensor_cfg) == "str" else ""

        self.ignore_chips = chips_cfg.split(",")
        self.ignore_sensors = sensor_cfg.split(",")
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

    def get_return_schema(self) -> dict[str, str] | None:
        return None

    @staticmethod
    def get_config_schema() -> dict[str, str] | None:
        return {{
            "ignore_chips": "str",
            "ignore_sensors": "str"
            }}
