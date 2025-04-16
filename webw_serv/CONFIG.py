PACKAGE_NAME: str = 'webw_serv'  # Used for importing scripts
MODULE_PREFIX: str = "scripts."
SCRIPTS_PATH: str = "./webw_serv_scripts_store/scripts"
MODULE_TEMP_PREFIX: str = "scripts_temp."
SCRIPTS_TEMP_PATH: str = "./webw_serv_scripts_store/temp_scripts"
MODULE_TEMP_SUFFIX: str = "_temp"
SCRIPTS_TEMP_SUFFIX: str = "_temp.py"
ILLEGAL_KEYS: list[str] = ["id", "timestamp", "runtime", "result", "scriptFailure"]