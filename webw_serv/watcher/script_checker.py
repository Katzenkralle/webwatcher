import importlib

from typing_extensions import Type

from webw_serv.configurator.config import Config as Configurator
from webw_serv import Watcher, CONFIG
from webw_serv.watcher.errors import ScriptFormatException, ScriptException
from  webw_serv.CONFIG import PY_MODULE_FROM_UNIX_PATH
import re

def script_checker(module_name: str)  -> tuple[str, dict[str, Type[str | int | bool]] | None, bool] | ScriptFormatException | ScriptException:
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
            if not hasattr(instance, "supports_static_schema"):
                return ScriptFormatException(f"ScriptMain must have a 'supports_static_schema' class attribute")
            return_schema_static = instance.supports_static_schema
        except Exception as e:
            return ScriptException(f"Exception while getting return schema static support: {e}")

        return "Success", config_schema, return_schema_static
    except Exception as e:
        return ScriptFormatException(e)

def run_once_get_schema(module_name: str, config: dict[str, str]) ->  dict[str, Type[str | int | bool | float]] | ScriptFormatException | ScriptException:
    match = re.search(PY_MODULE_FROM_UNIX_PATH, module_name)
    if match:
        base_module_name = match.group(1)
    else:
        # Fall back to just using the provided module name
        base_module_name = module_name
    base_module_name = CONFIG.MODULE_PREFIX + base_module_name
    try:
        if Configurator().app.dont_pass_none_to_script:
            # Remove None values from the config
            config = {k: v for k, v in config.items() if v is not None}
        module = importlib.import_module(base_module_name, CONFIG.PACKAGE_NAME)
        # We checked subclasses when uploading the script
        instance = module.ScriptMain(config=config)

        return_schema = instance.get_return_schema()
        if return_schema and any(key in CONFIG.ILLEGAL_KEYS for key in return_schema.keys()):
            return ScriptFormatException(f"Config schema contains illegal keys: {CONFIG.ILLEGAL_KEYS}")
        return return_schema
    except Exception as e:
        return ScriptException(e)



def abc_implemented(cls) -> bool:
    return not bool(cls.__abstractmethods__)
