import importlib

from typing_extensions import Type

from webw_serv import Watcher, CONFIG
from webw_serv.watcher.errors import ScriptFormatException, ScriptException
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
    match = re.search(r'/([^/]+?)\.py$', module_name)
    if match:
        base_module_name = match.group(1)
    else:
        # Fall back to just using the provided module name
        base_module_name = module_name
    base_module_name = CONFIG.MODULE_PREFIX + base_module_name
    try:
        module = importlib.import_module(base_module_name, CONFIG.PACKAGE_NAME)
        # We checked subclasses when uploading the script
        instance = module.ScriptMain(config=config)

        return_schema = instance.get_return_schema()
        if return_schema and any(key in CONFIG.ILLEGAL_KEYS for key in return_schema.keys()):
            return ScriptFormatException(f"Config schema contains illegal keys: {CONFIG.ILLEGAL_KEYS}")
        return return_schema
    except Exception as e:
        return ScriptException(e)


def value_to_type(value: str | int | bool | float) -> Type[str | int | bool | float]:
    """
    Convert a value to its type.

    :param value: The value to convert.
    :type value: str | int | bool | float
    :return: The type of the value.
    :rtype: Type[str | int | bool | float]
    """
    if isinstance(value, str):
        return str
    elif isinstance(value, int):
        return int
    elif isinstance(value, bool):
        return bool
    elif isinstance(value, float):
        return float
    else:
        raise ValueError(f"Unsupported type: {type(value)}")


def abc_implemented(cls) -> bool:
    return not bool(cls.__abstractmethods__)

def are_keys_legal(data: dict[str, Type[str | int | bool]]) -> bool:
    """
    Check if the keys in the data dictionary are legal according to the CONFIG.ILLEGAL_KEYS.

    :param data: The dictionary to check.
    :type data: dict[str, Type[str | int | bool]]
    :return: True if all keys are legal, False otherwise.
    :rtype: bool
    """
    return not any(key in CONFIG.ILLEGAL_KEYS for key in data.keys())
