# Idea for watcher call
import importlib
import re
import threading

import datetime
import sys
import asyncio

from typing_extensions import Dict, Any, Optional

from .errors import ScriptException
from webw_serv import CONFIG
from webw_serv.main_establish_dbs import establish_db_connections


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


class ScriptThread(threading.Thread):
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


def watch_runner(script_name: str, fs_path: str, config: dict, job_id: int) -> Any:
    """
    Run the script in a separate thread and return the result.
    :param script_name: Name of the script to run.
    :param fs_path: File system path of the script.
    :param config: Configuration for the script.
    :param job_id: Job ID for the script.
    :return: Result of the script execution.
    """
    # Establish database connections
    mongo, maria = establish_db_connections()
    maria.set_cron_timestamp(job_id=job_id, timestamp=datetime.datetime.now())

    match = re.search(r'/([^/]+?)\.py$', script_name)
    if match:
        base_module_name = match.group(1)
    else:
        # Fall back to just using the provided module name
        base_module_name = script_name

    # Run the main thread
    script_thread = ScriptThread(base_module_name, config)
    script_thread.start()
    script_thread.join()
    result = script_thread.result

    mongo.create_or_modify_job_entry(job_id=job_id, entry_id=None, data=result)
    # Clean up
    delete_script(script_name)

    return result