import importlib

from typing_extensions import Type

from webw_serv import Watcher, CONFIG
from webw_serv.watcher.errors import ScriptFormatException, ScriptException


def script_checker(module_name: str)  -> tuple[str, dict[str, Type[str | int | bool]] | None, dict[str, Type[str | int | bool]] | None] | ScriptFormatException | ScriptException:
    try:
        module = importlib.import_module(module_name, CONFIG.PACKAGE_NAME)
        if not hasattr(module, "ScriptMain"):
            return ScriptFormatException(f"ScriptMain not found in {module_name}")
        instance = module.ScriptMain
        if not issubclass(instance, Watcher):
            return ScriptFormatException(f"ScriptMain must be a subclass of Watcher")
        if not abc_implemented(instance):
            return ScriptFormatException(f"ScriptMain must implement all abstract methods")

        try:
            config_schema = instance.get_config_schema()
            if any(key in CONFIG.ILLEGAL_KEYS for key in config_schema.keys()):
                return ScriptFormatException(f"Config schema contains illegal keys: {CONFIG.ILLEGAL_KEYS}")
        except Exception as e:
            return ScriptException(f"Exception while getting config schema: {e}")

        try:
            return_schema = instance.get_return_schema()
            if any(key in CONFIG.ILLEGAL_KEYS for key in return_schema.keys()):
                return ScriptFormatException(f"Return schema contains illegal keys: {CONFIG.ILLEGAL_KEYS}")
        except Exception as e:
            return ScriptException(f"Exception while getting return schema: {e}")

        return "Success", config_schema, return_schema
    except Exception as e:
        return ScriptFormatException(e)


def abc_implemented(cls) -> bool:
    return not bool(cls.__abstractmethods__)