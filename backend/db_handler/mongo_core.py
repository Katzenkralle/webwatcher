import pymongo

class MongoDbHandler:
    def __init__(self, mongo_con_string):
        self.__db = self.__establish_connection(mongo_con_string)

    def __establish_connection(self, mongo_con_string) -> pymongo.MongoClient:
        client = pymongo.MongoClient(mongo_con_string)["webwatcher_data"]
        return client
    
    def check_or_create_collection(db, collection_name):
        if collection_name not in db.list_collection_names():
            db.create_collection(collection_name)
        return db[collection_name]
    