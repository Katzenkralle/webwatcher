import shutil
from typing import Tuple, Any, Type

from webw_serv import CONFIG
import logging
from webw_serv.db_handler.maria_schemas import DbParameter

def db_parameter_to_dict(params: list[DbParameter]|dict) -> dict[str, Any]:
    values = {}
    if not isinstance(params, dict):
        for param in params:
            values[param.key] = param.value
    else:
        values = params
    return values

def dict_to_db_parameter(params: dict[str, Any]) -> list[DbParameter]:
    db_params = []
    for key, value in params.items():
        db_param = DbParameter(name=key, value=value)
        db_params.append(db_param)
    return db_params

def enforce_types(params: dict[str, str] | list[DbParameter], 
                  expected_types: dict[str, Type[str | int | bool]] |  list[DbParameter],
                  strict: bool = False) -> DbParameter | dict[str, Any]:
    if len(params) == 0:
        return []
    values = db_parameter_to_dict(params)
    types = db_parameter_to_dict(expected_types)
    
    result_dict = {}
    for key, value in values.items():
        if strict and key not in types:
            raise ValueError(f"Key '{key}' not found in expected types.")
        expected_type = types.get(key, type(value))

        # Normalize expected_type to a string
        if isinstance(expected_type, type):
            expected_type_name = expected_type.__name__
        elif isinstance(expected_type, str):
            expected_type_name = expected_type.lower()
        else:
            expected_type_name = str(expected_type).lower()

        match expected_type_name:
            case "str":
                result_dict[key] = str(value)
            case "int":
                result_dict[key] = int(value)
            case "bool":
                if isinstance(value, str):
                    match value.lower():
                        case "true" | "1":
                            result_dict[key] = True
                        case "false" | "0":
                            result_dict[key] = False
                        case _:
                            raise ValueError(f"Invalid boolean value: {value}")
                else:
                    result_dict[key] = bool(value)
            case "float":
                result_dict[key] = float(value)
            case _:
                result_dict[key] = str(value)

    if isinstance(params, DbParameter):
        return dict_to_db_parameter(result_dict)
    return result_dict


       

def move_script_file(script_path: str) -> Tuple[bool, str | None]:
    """
    Moves a script file from its current location to a predefined scripts folder.
    The destination folder is specified in the application configuration.

    :param script_path: The full path to the script file to be moved.
    :type script_path: str
    :return: A boolean indicating whether the move operation was successful.
    :rtype: bool
    """
    try:
        dest = f"{CONFIG.SCRIPTS_PATH}{script_path[script_path.rfind("/") + 1:]}"
        shutil.move(
            script_path,
            dest
        )
        return True, dest
    except Exception as e:
        logging.error(f"Error moving script file {script_path}: {e}")
        return False, None