PACKAGE_NAME: str = 'webw_serv'  # Used for importing scripts
MODULE_PREFIX: str = "webw_serv_scripts_store.scripts."
SCRIPTS_PATH: str = "./webw_serv_scripts_store/scripts/"
STORE_PATH: str = "./webw_serv_scripts_store/"
MODULE_TEMP_PREFIX: str = "webw_serv_scripts_store.temp_scripts."
SCRIPTS_TEMP_PATH: str = "./webw_serv_scripts_store/temp_scripts/"
MODULE_TEMP_SUFFIX: str = ""
SCRIPTS_TEMP_SUFFIX: str = ".py"
ILLEGAL_KEYS: list[str] = ["id",  "call_id", "timestamp", "runtime", "error_msg", "scriptFailure"]
PY_MODULE_FROM_UNIX_PATH: str = r'/([^/]+?)\.py$'
DEFAULT_JOB_DESCRIPTIONS: list[str] = [
    "Here could be your job description",
    "This is a job description",
    "Here could be a False Advertisement",
    "There is no job description",
    "Please write a job description",
    ]
