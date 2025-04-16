PACKAGE_NAME: str = 'webw_serv'  # Used for importing scripts
MODULE_PREFIX: str = ".scripts."
SCRIPTS_PATH: str = "./webw_serv/scripts/"
MODULE_TEMP_PREFIX: str = ".scripts_temp."
SCRIPTS_TEMP_PATH: str = "./webw_serv/scripts_temp/"
MODULE_TEMP_SUFFIX: str = "_latest_script"
SCRIPTS_TEMP_SUFFIX: str = "_latest_script.py"
ILLEGAL_KEYS: list[str] = ["id", "timestamp", "runtime", "result", "scriptFailure"]