import mariadb
import asyncio

import random
import string
import time
import json
from typing import Optional

from webw_serv.db_handler.misc import libroot, read_sql_blocks
from .maria_schemas import DbUser, DbSession, DbUserDisplayConfig, DbScriptInfo, DbParameter, DbJobMetaData

from webw_serv.utility import DEFAULT_LOGGER as logger
from webw_serv.configurator import Config
from webw_serv.watcher.mover import move_script_file
from datetime import datetime


def unix_to_mariadb_timestamp(unix_time: float|None =None) -> str:
    if unix_time is None:
        unix_time = time.time()
    return datetime.fromtimestamp(unix_time).strftime('%Y-%m-%d %H:%M:%S') 

class MariaDbHandler:
    SQL_DIR = f"{libroot}/sql/"
    EXPECTED_TABLES = [ 'cron_list',
                        'job_input_settings',
                        'job_display_user_config',
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
        retry = 3
        while retry > 0:
            try:
                conn = mariadb.connect(
                    host=host,
                    user=user,
                    port=port,
                    password=password,
                    database=db if db != "" and None else None
                )
                break
            except mariadb.Error as e:
                logger.warning(f"MARIA: Failed to connect to MariaDB: {e} - {retry} retries left")
                time.sleep(30)
                retry -= 1
                conn = None
        if conn is None:
            logger.error("MARIA: Failed to connect to MariaDB, exiting")
            exit(1)

        conn.auto_reconnect = True
        cursor = conn.cursor()
        if not conn.database:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db}")
            cursor.execute(f"USE {db}")
        logger.info("MARIA: Connected to MariaDB")
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
        if "script_list" not in existing_tables or "script_input_info" not in existing_tables:
            logger.warning("MARIA: Registering default script list")
            for block in read_sql_blocks(f"{self.SQL_DIR}/init_scripts.sql"):
                self.__cursor.execute(block)
        if "job_list" not in existing_tables:
            logger.warning("MARIA: Registering default job list")
            for block in read_sql_blocks(f"{self.SQL_DIR}/init_jobs.sql"):
                self.__cursor.execute(block)
        self.__conn.commit()

    async def create_user(self, username: str, password: str, is_admin: bool):
        self.__cursor.execute("INSERT INTO web_users (username, password, is_admin) VALUES (?, ?, ?)", (username, password, is_admin))
        self.__conn.commit()
        return DbUser(username, password, is_admin)

    async def delete_user(self, username: str) -> bool:
        self.__cursor.execute("DELETE FROM web_users WHERE username = ?", (username,))
        self.__conn.commit()
        return True

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
    
    async def get_script_info(self, name: str | None = None) -> list[DbScriptInfo]:
        registered_scripts = []
        if name == None:
            self.__cursor.execute("SELECT * FROM script_list")
            registered_scripts = self.__cursor.fetchall()
        else:
            self.__cursor.execute("SELECT * FROM script_list WHERE name = ?", (name,))
            result = self.__cursor.fetchone()
            if result:
                registered_scripts.append(result)
        found_scripts: list[DbScriptInfo] = []
        for script in registered_scripts:
            self.__cursor.execute("SELECT keyword,datatype FROM script_input_info WHERE script_name = ?", (script[1],))
            db_schema = self.__cursor.fetchall()
            input_schema = []
            for entry in db_schema:
                input_schema.append(DbParameter(*entry))
            found_scripts.append(
                DbScriptInfo(script[0], script[1], script[2], script[3], input_schema, script[4]))
        return found_scripts
          

    async def add_temp_script(self, fs_path: str, name: str, expected_input: dict, supports_static_schema: bool) -> bool:
        self.__cursor.execute("""INSERT INTO script_list (fs_path, name, description, supports_static_schema, temporary) 
        VALUES (?, ?, ?, ?, ?)""",
                              (fs_path, name, None, supports_static_schema, True))
        
        for key, value in expected_input.items():
            if value == str:
                value = "str"
            elif value == int:
                value = "int"
            elif value == bool:
                value = "bool"
            self.__cursor.execute("""INSERT INTO script_input_info (script_name, keyword, datatype) 
            VALUES (?, ?, ?)""",
                (name, key, value))

        self.__conn.commit()
        return True

    async def clear_temp_scripts(self) -> bool:
        self.__cursor.execute("""DELETE FROM script_list WHERE temporary = 1""")
        self.__conn.commit()
        return True

    async def delete_script(self, name: str) -> bool:
        self.__cursor.execute("""DELETE FROM script_list WHERE name = ?""", (name,))
        self.__conn.commit()
        return True

    async def transfer_script(self, id_: str, name: str, description: Optional[str] = None) -> bool:
        self.__cursor.execute("SELECT * FROM script_list WHERE name = ?", (id_,))
        script = self.__cursor.fetchone()
        if not script:
            raise ValueError("Script not found")
        fs_path = script[0]
        mv_result = move_script_file(fs_path)
        if not mv_result[0]:
            raise ValueError("Failed to move script file")
        if description is None:
            description = script[2]
        self.__cursor.execute("""UPDATE script_list SET fs_path = ?, name = ?, description = ?, last_edited = ?, temporary = 0 WHERE name = ?""",
                      (mv_result[1], name, description, unix_to_mariadb_timestamp(), id_))
        self.__conn.commit()
        return True

    async def edit_script_description(self, name: str, description: Optional[str] = None) -> bool:
        self.__cursor.execute("SELECT * FROM script_list WHERE name = ?", (name,))
        script = self.__cursor.fetchone()
        if not script:
            raise ValueError("Script not found")
        if description is None:
            description = script[2]
        self.__cursor.execute("""UPDATE script_list SET description = ?, last_edited = ? WHERE name = ?""",
                              (description, unix_to_mariadb_timestamp(), name))
        self.__conn.commit()
        return True

    async def register_session(self, username: str, name: str|None = None) -> DbSession:
        new_id = None
        while new_id is None:
            new_id = "".join(random.choices(string.digits, k=255))
            self.__cursor.execute("SELECT * FROM web_user_sessions WHERE session_id = ?", (new_id,))
            if self.__cursor.fetchone() is not None:
                new_id = None
        if not name:
            while not name:
                name = f"oauth2_{new_id[:8]}"
                self.__cursor.execute("SELECT * FROM web_user_sessions WHERE username = ? AND name = ?", (username, name,))
                if self.__cursor.fetchone() is not None:
                    name = None
        else:
            self.__cursor.execute("SELECT * FROM web_user_sessions WHERE username = ? AND name = ?", (username, name,))
            if self.__cursor.fetchone() is not None:
                raise ValueError("Session name already in use")

        new_session = DbSession(username, new_id, name, unix_to_mariadb_timestamp())

        self.__cursor.execute("INSERT INTO web_user_sessions (session_id, username, name, created) VALUES (?, ?, ?, ?)",
                                (new_session.session_id, new_session.username, new_session.name, new_session.created))
        self.__conn.commit()
        return new_session

    async def get_job_metadata(self, job_id: int|None = None) -> list[DbJobMetaData]:
        jobs = []
        if job_id is None:
            self.__cursor.execute("SELECT * FROM job_list")
            jobs = self.__cursor.fetchall()
        else:
            self.__cursor.execute("SELECT * FROM job_list WHERE id = ?", (job_id,))
            job = self.__cursor.fetchone()
            if job:
                jobs.append(job)
        
        composed_jobs = []
        for job in jobs:
            self.__cursor.execute("SELECT cron_time,executed_last,enabled FROM cron_list WHERE job_id = ?", (job[1],))    
            db_corn  = self.__cursor.fetchone()

            expected_return_schema = None
            if job[5]:
                try:
                    loaded_schema = json.loads(job[5])
                    expected_return_schema: list[DbParameter] = []
                    for key, val in loaded_schema.items():
                        expected_return_schema.append(DbParameter(key, val))
                except Exception as e:
                    logger.warning(f"MARIA: Failed to parse job schema for {job[2]}: {e}")

            composed_jobs.append(
                DbJobMetaData(
                        id= job[1],
                        name= job[2],
                        script= job[0],
                        description= job[3],
                        enabled= db_corn[2],
                        execute_timer= db_corn[0],
                        executed_last= db_corn[1],
                        forbid_dynamic_schema= not job[4],
                        expected_return_schema= expected_return_schema,
                    ))
        return composed_jobs



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

    async def get_all_users(self) -> list[DbUser]:
        self.__cursor.execute("SELECT * FROM web_users")
        db_users = self.__cursor.fetchall()
        return [DbUser(*user) for user in db_users]

    async def get_user_config_for_job(self, username: str, job: int) -> dict:
        self.__cursor.execute("SELECT * FROM job_display_user_config WHERE username = ? AND job_id = ?", (username, job))
        db_config = self.__cursor.fetchone()
        if db_config is None:
            raise ValueError("No user config found for this job")
        return DbUserDisplayConfig(*db_config)

    async def set_user_config_for_job(self, username: str, job: int,
                                       filter_config: Optional[str], graph_config: Optional[str]) -> bool:
        self.__cursor.execute("SELECT * FROM job_display_user_config WHERE username = ? AND job_id = ?", (username, job))
        db_config = self.__cursor.fetchone()
        if db_config:
            if filter_config is None:
                filter_config = db_config[2]
            if graph_config is None:
                graph_config = db_config[3]
            self.__cursor.execute("UPDATE job_display_user_config SET filter_config = ?, graph_config = ? WHERE username = ? AND job_id = ?",
                                  (filter_config, graph_config, username, job))
        else:
            self.__cursor.execute("INSERT INTO job_display_user_config (username, job_id, filter_config, graph_config) VALUES (?, ?, ?, ?)",
                                  (username, job, filter_config, graph_config))
        self.__conn.commit()

    def close(self):
        self.__cursor.close()
        self.__conn.close()
        logger.debug("MARIA: Closed MariaDbHandler")
        return
