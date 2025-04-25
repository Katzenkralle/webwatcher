# Idea for watcher call
import importlib
import threading
import sys
import asyncio

from typing_extensions import Dict, Any, Optional

from .errors import ScriptException
from webw_serv import CONFIG

# Proposed DB Managert for  to let Watchers add Rows to mongo db
class DbManager:
    def __init__(self, tareget: int, schema: Dict[str, str]):
        self.__schema: Dict[str, str] = schema
        self.__target: int = tareget
        self.__data: Dict[str, Any] = {}
        self.__db = None

    def __check_datatype(self, k, v):
        if k not in self.__schema:
            raise ValueError(f'Key {k} not in schema')
        if self.__schema[k] != type(v):
            raise ValueError(f'Key {k} has wrong datatype')

    @property
    def data(self):
        return self.__data

    @data.setter
    def data(self, row: Dict[str, Any]):
        for k, v in row.items():
            self.__check_datatype(k, v)
        self.__data.update(row)

    def __enter__(self):
        # open connection to db
        pass

    def __exit__(self, exc_type, exc_val, exc_tb):
        # close connection to db, execute transaction
        pass


class MainThread(threading.Thread):
    def __init__(self, module_name, config: Optional[dict[str, Any]] = None):
        threading.Thread.__init__(self)
        self.module_name = CONFIG.MODULE_PREFIX + module_name
        self.result = None
        self.package = CONFIG.PACKAGE_NAME
        self.config = config if config else {}

    def run(self):
        try:
            module = importlib.import_module(self.module_name, self.package)
            main_instance = module.ScriptMain(config=self.config)
            self.result = main_instance.run()
        except Exception as e:
            self.result = ScriptException(e)

def delete_script(module_name):
    if module_name in sys.modules:
        try:
            del sys.modules[module_name]
            print(f"Module {module_name} has been removed from cache.")
        except KeyError:
            print(f"Module {module_name} is not in cache.")

async def run_main_threads(script_name, num_threads):
    threads = []
    for _ in range(num_threads):
        main_thread = MainThread(script_name)
        main_thread.start()
        threads.append(main_thread)

    for thread in threads:
        thread.join()
        print(thread.result)


class WatcherManager: 
    """
    ToDo: Implement.
    Note: This may change in the future

    Calls the watchers, handels the results and sends them to the database.
    Proxie for calls from the API to the watchers (:meth:`.base.WatcherBase.get_return_schema`
    and :meth:`.base.WatcherBase.get_config_schema`).

    Also handels timed execution of watchers, and registers/deleates them by request in the database.
    """
    def __init__(self):
        pass
    async def run(self):
        ...

    @staticmethod
    def get_metadata(module_name):
        ...

def manager_main():
    pass

if __name__ == "__main__":
    manager_main()