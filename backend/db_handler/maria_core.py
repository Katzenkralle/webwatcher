import mariadb

from .misc import libroot
from .misc import read_sql_blocks
from .maria_schemas import DbUser

from utility import DEFAULT_LOGGER as logger




class MariaDbHandler:
    SQL_DIR = f"{libroot}/sql/"
    EXPECTED_TABLES = ['cron_list', 'job_input_settings', 'job_list', 'script_input_info', 'script_list', 'web_users']

    def __init__(self, maria_config):
        logger.debug("MARIA: Initializing MariaDbHandler")
        [self.__conn, self.__cursor] = self.__establish_connection(
            maria_config.host,
            maria_config.port,
            maria_config.user,
            maria_config.password,
            maria_config.database
        )
        self.check_and_build_schema()
    
            

    def check_and_build_schema(self):
        self.__cursor.execute("SHOW TABLES")
        existing_tables = list(map(lambda x: x[0], self.__cursor.fetchall()))
        missing_tables = list(filter(lambda x: x not in existing_tables, self.EXPECTED_TABLES))
        if len(missing_tables) == 0:
            return
        logger.warning(f"MARIA: Missing tables: {missing_tables}, creating them")
        for block in read_sql_blocks(f"{self.SQL_DIR}/create.sql"):
                self.__cursor.execute(block)
        self.__conn.commit()
        

    def __establish_connection(self, host, port, user, password, db):
        conn = mariadb.connect(
            host=host,
            user=user,
            port=port,
            password=password,
            database=db if db != "" and None else None
        )
        cursor = conn.cursor()
        if not conn.database: 
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db}")
            cursor.execute(f"USE {db}")
        return [conn, cursor]
    
    async def create_user(self, username: str, password: str, is_admin: bool):
        self.__cursor.execute("INSERT INTO web_users (username, password, is_admin) VALUES (?, ?, ?)", (username, password, is_admin))
        self.__conn.commit()
        return DbUser(username, password, is_admin)
    
    async def get_user(self, username: str) -> DbUser | None:
        self.__cursor.execute("SELECT * FROM web_users WHERE username = ?", (username,))
        try:
            user = self.__cursor.fetchone()
            return DbUser(*user)
        except Exception as e:
            return None