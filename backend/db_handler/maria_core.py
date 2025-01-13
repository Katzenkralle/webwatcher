import mariadb

class MariaDbHandler:
    def __init__(self, host, user, password, db):
        [self.__conn, self.__cursor] = self.__establish_connection(host, user, password, db)
    

    def check_schema(self):
        self.__cursor.execute("SHOW TABLES")
        print(self.__cursor.fetchall())

    def __establish_connection(self, host, user, password, db):
        conn = mariadb.connect(
            host=host,
            user=user,
            password=password,
            database=db if db != "" and None else None
        )
        cursor = conn.cursor()
        if not conn.database: 
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db}")
            cursor.execute(f"USE {db}")
        return [conn, cursor]
    