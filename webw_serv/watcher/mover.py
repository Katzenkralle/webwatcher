import shutil
from typing import Tuple

from webw_serv import CONFIG
import logging

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