import importlib

from webw_serv import Watcher, CONFIG
from webw_serv.watcher.errors import ScriptFormatException


def script_checker(module_name: str)  -> bool | ScriptFormatException:
    module_name = CONFIG.MODULE_PREFIX + module_name
    try:
        module = importlib.import_module(module_name, CONFIG.PACKAGE_NAME)
        if not hasattr(module, "ScriptMain"):
            return ScriptFormatException(f"ScriptMain not found in {module_name}")
        instance = module.ScriptMain
        if not issubclass(instance, Watcher):
            return ScriptFormatException(f"ScriptMain must be a subclass of Watcher")
        if not abc_implemented(instance):
            return ScriptFormatException(f"ScriptMain must implement all abstract methods")
        return True
    except Exception as e:
        return ScriptFormatException(e)


def

def abc_implemented(cls) -> bool:
    return not bool(cls.__abstractmethods__)