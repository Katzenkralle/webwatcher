import mariadb
import asyncio

from webw_serv.db_handler.misc import libroot, read_sql_blocks
from webw_serv.db_handler.maria_schemas import DbUser, DbScriptInfo

from webw_serv.utility import DEFAULT_LOGGER as logger
from webw_serv.configurator import Config




class MariaDbHandler:
    SQL_DIR = f"{libroot}/sql/"
    EXPECTED_TABLES = ['cron_list', 'job_input_settings', 'job_list', 'script_input_info', 'script_list', 'web_users']

    def __init__(self, maria_config, app_config):
        logger.debug("MARIA: Initializing MariaDbHandler")
        [self.__conn, self.__cursor] = self.__establish_connection(
            maria_config.host,
            maria_config.port,
            maria_config.user,
            maria_config.password,
            maria_config.database
        )
        self.check_and_build_schema()
        # We currently dont react to the return, so no need to await
        
        try_create_user = self.__try_create_default_user(
                app_config.default_admin_username,
                app_config.default_admin_hash)
        asyncio.run(try_create_user)
        
    
    async def __try_create_default_user(self, username, hash):
        if username and hash:
            if await self.get_user(username):
                logger.warning("Default admin user already exists! Skipping creation..")
            else:
                logger.info("Creating default admin user")
                return await self.create_user(username, hash, True)
        else:
            logger.info("No default admin user provided, skipping creation..")
        return None


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

    async def get_script_info(self, name: str) -> DbScriptInfo | None:
        self.__cursor.execute("""
            SELECT fs_path, name, description
            FROM script_list
            WHERE name = ?
        """, (name,))
        script_list_data = self.__cursor.fetchone()

        if not script_list_data:
            return None

        self.__cursor.execute("""
            SELECT excpected_return_schema, input_schema
            FROM script_input_info
            WHERE name = ?
        """, (name,))
        script_input_info_data = self.__cursor.fetchall()

        if not script_input_info_data:
            return None

        excpected_return_schema = {}
        input_schema = {}

        for row in script_input_info_data:
            excpected_return_schema.update(row[0])
            input_schema.update(row[1])

        return DbScriptInfo(
            fs_path=script_list_data[0],
            name=script_list_data[1],
            description=script_list_data[2],
            excpected_return_schema=excpected_return_schema,
            input_schema=input_schema
        )
        
    def close(self):
        self.__cursor.close()
        self.__conn.close()
        logger.debug("MARIA: Closed MariaDbHandler")
        return