import pymongo
from utility import DEFAULT_LOGGER as logger
import logging

class MongoDbHandler:
    def __init__(self, mongo_config):
        logger.debug("MONGO: Initializing MongoDbHandler")
        logging.getLogger("pymongo.topology").setLevel(logging.INFO) # Suppressing pymongo hartbeat logs
        self.__db = self.__establish_connection(mongo_config.connection_string)
        self.check_or_create_collection("webwatcher_data")

    def __establish_connection(self, mongo_con_string) -> pymongo.MongoClient:
        client = pymongo.MongoClient(mongo_con_string)["webwatcher_data"]
        return client
    
    def check_or_create_collection(self, collection_name):
        if collection_name not in self.__db.list_collection_names():
            logger.warning(f"MONGO: Collection {collection_name} not found, creating it")
            self.__db.create_collection(collection_name)
            self.__db = self.__db[collection_name]
        return
    