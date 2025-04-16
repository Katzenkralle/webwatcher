from webw_serv import Watcher

class ScriptMain(Watcher):
    def __init__(self, config: dict[str, any]):
        pass

    async def run(self):
        pass

    def get_return_schema(self) -> dict[str, str] | None:
        pass


    def get_config_schema(self) -> dict[str, str] | None:
        return None
    

# Fragen
# Welche Daten? oder flexibel?
