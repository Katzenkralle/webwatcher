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

from webw_serv.configurator.config import Config as Configurator


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


async def watch_runner(script_name: str, fs_path: str, config: dict, job_id: int):
    """
    Run the script in a separate thread and return the result.
    :param script_name: Name of the script to run.
    :param fs_path: File system path of the script.
    :param config: Configuration for the script.
    :param job_id: Job ID for the script.
    """
    unix_timestamps = Configurator().app.unixtime_for_timestamps
    dont_pass_none = Configurator().app.dont_pass_none_to_script

    match = re.search(CONFIG.PY_MODULE_FROM_UNIX_PATH, fs_path)
    if match:
        base_module_name = match.group(1)
    else:
        # Fall back to just using the provided module name
        base_module_name = script_name

    if dont_pass_none:
        # Remove None values from the config
        config = {k: v for k, v in config.items() if v is not None}

    # Run the main thread
    start_time = datetime.datetime.now()
    script_thread = ScriptThread(base_module_name, config)
    script_thread.start()
    script_thread.join()
    end_time = datetime.datetime.now()
    context = script_thread.result

    result = {
        "timestamp": str(datetime.datetime.now()) if not unix_timestamps else int(datetime.datetime.now().timestamp()),
        "runtime": (end_time - start_time).total_seconds(),
        "error_msg": "",
        "script_failure": False,
    }

    if not isinstance(context, dict):
        # Handle the exception
        try:
            result["error_msg"] = str(context)
        except Exception as e:
            result["error_msg"] = str("Error! An unexpected object was returned by the script!")
        result["script_failure"] = True
    else:
        # Handle the result
        result["context"] = context
     # Establish database connections
    mongo, maria = establish_db_connections()
    await maria.set_cron_timestamp(job_id=job_id, timestamp=datetime.datetime.now().timestamp())
    await mongo.create_or_modify_job_entry(job_id=job_id, entry_id=None, data=result)
    # Clean up
    delete_script(base_module_name)

def watch_runner_warper(*args, **kwargs):
    """
    Wrapper function to run the watch_runner function in an asyncio event loop.
    :param args: Positional arguments for the watch_runner function.
    :param kwargs: Keyword arguments for the watch_runner function.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(watch_runner(*args, **kwargs))
    loop.close()