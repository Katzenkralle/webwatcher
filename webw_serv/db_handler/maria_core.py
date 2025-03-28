import mariadb
import asyncio

import random
import string
import time

from webw_serv.db_handler.misc import libroot, read_sql_blocks
from webw_serv.db_handler.maria_schemas import DbUser, DbSession

from webw_serv.utility import DEFAULT_LOGGER as logger
from webw_serv.configurator import Config
from datetime import datetime




class MariaDbHandler:
    SQL_DIR = f"{libroot}/sql/"
    EXPECTED_TABLES = [ 'cron_list',
                        'job_input_settings',
                        'job_list',
                        'script_input_info',
                        'script_list',
                        'web_users',
                        'web_user_sessions']

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
    
    async def get_user(self, username: str|None = None, session: str|None = None) -> DbUser | None:
        if not username and not session:
            return None
        try:
            if session:
                self.__cursor.execute(
                    """SELECT * FROM web_user_sessions
                    WHERE session_id = ?""",
                    (session,))
                db_session = self.__cursor.fetchone()
                username = db_session[0]
                
            self.__cursor.execute("SELECT * FROM web_users WHERE username = ?", (username,))
            user = self.__cursor.fetchone()
            return DbUser(*user)
        except Exception as e:
            return None
        
    async def register_session(self, username: str, name: str|None = None) -> DbSession:       
        new_id = None
        while new_id is None:
            new_id = "".join(random.choices(string.digits, k=255))
            self.__cursor.execute("SELECT * FROM web_user_sessions WHERE session_id = ?", (new_id,))
            if self.__cursor.fetchone() is not None:
                new_id = None
        if not name:
            name = f"oauth2_{new_id[:8]}"
        else:
            if self.__cursor.execute("SELECT * FROM web_user_sessions WHERE name = ?", (name,)):
                raise ValueError("Session name already in use")

        # Get current time in MariaDB TIMESTAMP format
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        new_session = DbSession(username, new_id, name, current_time)

        self.__cursor.execute("INSERT INTO web_user_sessions (session_id, username, name, created) VALUES (?, ?, ?, ?)",
                                (new_session.session_id, new_session.username, new_session.name, new_session.created))
        self.__conn.commit()
        return new_session
    
    async def get_sessions_for_user(self, username: str) -> list[DbSession]:
        self.__cursor.execute("SELECT * FROM web_user_sessions WHERE username = ?", (username,))
        db_sessions = self.__cursor.fetchall()
        return [DbSession(*session) for session in db_sessions]

    async def logout_session(self, session_id: str|None = None, username:str|None = None, session_name: str|None = None ) -> bool:
        if not session_id and (not username or not session_name):
            raise ValueError("No session identifier provided")

        if not session_id:
            self.__cursor.execute("DELETE FROM web_user_sessions WHERE username = ? AND name = ?", (username, session_name))
        else:
            self.__cursor.execute("DELETE FROM web_user_sessions WHERE session_id = ?", (session_id, ))
        self.__conn.commit()
        return True
    
    async def change_password(self, username: str, new_password: str) -> bool:
        self.__cursor.execute("UPDATE web_users SET password = ? WHERE username = ?", (new_password, username))
        self.__conn.commit()
        return True

    def close(self):
        self.__cursor.close()
        self.__conn.close()
        logger.debug("MARIA: Closed MariaDbHandler")
        return