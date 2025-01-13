from strawberry import Schema, type, field

from db_handler import MongoDbHandler, MariaDbHandler
from dotenv import dotenv_values
import os 

if __name__ == "__main__":
    # Setup everything
    dotenv = dotenv_values(".env")
    mongo_con_string = os.environ.get("EXTERNAL_MONGO", dotenv["MONGO_PATH_PORT"]) 
    maria_con_details = [os.environ.get("EXTERNAL_MARIA", "")]
    if maria_con_details[0] == "":
        maria_con_details = [dotenv["MARIA_HOST"], 
                             dotenv["MARIA_USER"], 
                             dotenv["MARIA_PASS"], 
                             dotenv["MARIA_DB"]]
    else:
        maria_con_details.append(os.environ.get("MARIA_USER", ""))
        maria_con_details.append(os.environ.get("MARIA_PASS", ""))
        maria_con_details.append(os.environ.get("MARIA_DB", ""))

    mongo_handler = MongoDbHandler(mongo_con_string)
    maria_handler = MariaDbHandler(*maria_con_details)
    maria_handler.check_schema()