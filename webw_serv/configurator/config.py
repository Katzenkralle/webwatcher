from dataclasses import fields, dataclass
from webw_serv.utility import DEFAULT_LOGGER as logger
import os

@dataclass
class App:
    host: str = "0.0.0.0"
    port: int = 7000
    dev_mode: bool = False
    log_level: str = "info"
    default_admin_username: str = ""
    default_admin_hash: str = ""
    disable_script_upload: bool = False   

@dataclass
class SqlConnection:
    host: str = "maria"
    port: int = 3306
    user: str = "root"
    password: str = "webwatcher"
    database: str = "webwatcher"
    
@dataclass
class MongoConnection:
    connection_string: str = "mongodb://root:webwatcher@mongo:27017"

@dataclass
class Crypto:
    secret_key: str = None
    algorithm: str = None

class Config:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Config, cls).__new__(cls)
            cls._instance.load_settings()
        # Singoltons in python call __init__ everytime time they are called
        # so we use another method to initialize the class
        return cls._instance

    def __load_entry(self, dataclass) -> dict:
        result = {}
        for field in fields(dataclass):
            value = os.environ.get(f"{dataclass.__name__.upper()}_{field.name.upper()}", "")
            if value == "":
                logger.warning(f"Setting [{dataclass.__name__}]: '{field.name}' not found, using default")
                value = getattr(dataclass, field.name)
                if value is None:
                    logger.error(f"Default values are forbidden for '{dataclass.__name__}.{field.name}'")
                    raise ValueError(f"Default value for '{dataclass.__name__}.{field.name}' not found")
            try:
                result[field.name] = field.type(value)
            except ValueError as e:
                logger.error(f"Failed to convert '{dataclass.__name__}.{field.name}' to {field.type}")
                raise e
        return result
    
    def load_settings(self):
        self.mongo = MongoConnection(**self.__load_entry(MongoConnection))
        self.maria = SqlConnection(**self.__load_entry(SqlConnection))
        self.crypto = Crypto(**self.__load_entry(Crypto))
        self.app = App(**self.__load_entry(App))
