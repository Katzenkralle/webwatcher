import pymongo
from webw_serv.utility import DEFAULT_LOGGER as logger
import logging
from enum import Enum

class MongoDbHandler:
    def __init__(self, mongo_config):
        logger.debug("MONGO: Initializing MongoDbHandler")
        logging.getLogger("pymongo.topology").setLevel(logging.INFO) # Suppressing pymongo hartbeat logs
        self.__db = self.__establish_connection(mongo_config.connection_string)
        self.check_or_create_collection("job_data")
        self.check_or_create_collection("job_regestry")

    def __establish_connection(self, mongo_con_string) -> pymongo.MongoClient:
        client = pymongo.MongoClient(mongo_con_string)["webwatcher_data"]
        return client
    
    def check_or_create_collection(self, collection_name):
        if collection_name not in self.__db.list_collection_names():
            logger.warning(f"MONGO: Collection {collection_name} not found, creating it")
            self.__db.create_collection(collection_name)
        return
    
    async def check_if_job_exists(self, jobId: int) -> bool:
        """
        Check if a job exists in the database
        """
        job = self.__db.job_regestry.find_one({"jobId": jobId})
        if job:
            return True
        else:
            return False

    async def register_job(self, jobId: int):
        """
        Register a job in the database
        """
        # Check if the jobId already exists
        if await self.check_if_job_exists(jobId):
            raise ValueError(f"Job {jobId} already exists")

        # Create the job
        logger.debug(f"MONGO: Creating job {jobId}")
        self.__db.job_regestry.insert_one({"jobId": jobId})
        return
    
    async def delete_job(self, jobId: int):
        """
        Delete a job from the database
        """
        # Check if the jobId exists
        if not await self.check_if_job_exists(jobId):
            raise ValueError(f"Job {jobId} not registered")

        # Delete the job
        logger.debug(f"MONGO: Deleting job {jobId}")
        self.__db.job_data.delete_many({"jobId": jobId})
        self.__db.job_regestry.delete_one({"jobId": jobId})
        return
        
    @staticmethod
    def phrase_data(data: dict) -> dict:
        if data.get("result", None) and isinstance(data["result"], Enum):
            data["result"] = data["result"].value
        return data
    
    async def create_or_modify_job_entry(self, jobId: int, entryId:  int|None, data: dict):
        """
        Note: We need to use a structure like this
        {
            "jobId": "job1",
            "entryId": "entry42",
            "data": { ... }
        }
        for ideal performanc, mongodb has a maximum of 16MB per document,
        so each entry should be a single document
        """
        data = self.phrase_data(data)
        # Check if the jobId exists
        if not self.check_if_job_exists(jobId):
            raise ValueError(f"Job {jobId} not registered")

        entry = self.__db.job_data.find_one({"jobId": jobId, "entryId": entryId})

        if entryId is None:
            # Generate a new entryId
            entryId = self.__db.job_data.count_documents({"jobId": jobId}) + 1
        elif not entry:
            raise ValueError(f"Tried to update inexistent entry {entryId} in job {jobId}")

        if entry:
            # Update the entry
            logger.debug(f"MONGO: Updating entry {entryId} in job {jobId}")
            self.__db.job_data.update_one({"jobId": jobId, "entryId": entryId}, {"$set": data})
        else:
            # Create the entry
            logger.debug(f"MONGO: Creating entry {entryId} in job {jobId}")
            self.__db.job_data.insert_one({"jobId": jobId, "entryId": entryId, **data})
        return {"call_id": entryId, **data}

    async def delete_job_entry(self, jobId: int, entryIds: list[int]):
        """
        Delete multiple job entries from the database.
        """
        # Check if the jobId exists
        if not await self.check_if_job_exists(jobId):
            raise ValueError(f"Job {jobId} not registered")

        # Delete the entries
        logger.debug(f"MONGO: Deleting entries {entryIds} in job {jobId}")
        result = self.__db.job_data.delete_many({
            "jobId": jobId,
            "entryId": {"$in": entryIds}
        })
        return result.deleted_count
    
    def close(self):
        self.__db.client.close()
        logger.debug("MONGO: Closed connection")
        return