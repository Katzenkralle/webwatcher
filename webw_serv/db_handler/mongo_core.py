import pymongo
from webw_serv.utility import DEFAULT_LOGGER as logger
import logging
import json
from enum import Enum
from dataclasses import dataclass
from typing import Union


@dataclass
class JobEntrySearchModeOptionsNewest:
    newest: int

@dataclass
class JobEntrySearchModeOptionsRange:
    start: int
    n_elements: int
    newest_first: bool

@dataclass
class JobEntrySearchModeOptionsSpecific:
    specific: list[int]

job_entry_search_mode_options = Union[
    JobEntrySearchModeOptionsNewest,
    JobEntrySearchModeOptionsRange,
    JobEntrySearchModeOptionsSpecific,
    None
]


class MongoDbHandler:
    @staticmethod
    def reformat_data(data: dict) -> dict:
        if data.get("context", None) and isinstance(data["context"], str):
            # If the data has a context, we need to convert it to a string
            # This is because pymongo does not support the context object
            data["context"] = json.loads(data["context"])
        return data

    def __init__(self, mongo_config):
        logger.debug("MONGO: Initializing MongoDbHandler")
        logging.getLogger("pymongo.topology").setLevel(logging.INFO) # Suppressing pymongo hartbeat logs
        self.__db = self.__establish_connection(mongo_config.connection_string)
        self.check_or_create_collection("job_data")
        self.check_or_create_collection("job_regestry")

        self.__search_dispatcher = {
            JobEntrySearchModeOptionsNewest: self.__get_job_entries_newest,
            JobEntrySearchModeOptionsRange: self.__get_job_entries_range,
            JobEntrySearchModeOptionsSpecific: self.__get_job_entries_specific,
        }

    def __establish_connection(self, mongo_con_string) -> pymongo.MongoClient:
        retries = 3
        while retries > 0:
            try:
                client = pymongo.MongoClient(mongo_con_string, connect=True)
                client.server_info()  # Force connection on a request
                break
            except pymongo.errors.ServerSelectionTimeoutError as err:
                logger.warning(f"MONGO: Connection failed: {err} - {retries} retries left...")
                retries -= 1
                client = None
        if client is None:
            logger.error("MONGO: Connection failed, exiting")
            exit(1)
        logger.info("MONGO: Connected to MongoDB")
        return client["webwatcher_data"]

    def check_or_create_collection(self, collection_name):
        if collection_name not in self.__db.list_collection_names():
            logger.warning(f"MONGO: Collection {collection_name} not found, creating it")
            self.__db.create_collection(collection_name)
        return
    
    async def register_all_sql_jobs(self, jobs: list[int]):
        """
        Register all SQL jobs in the database
        """
        # Get all registered jobs
        registered_jobs = list(self.__db.job_regestry.find({}, {"job_id": 1, "_id": 0}))
        for reg_job in registered_jobs:
            # Remove zombie jobs from mongo
            try:
                if reg_job['job_id'] not in jobs:
                    # Delete the job if it is not in the list
                    logger.debug(f"MONGO: Deleting job {reg_job} from registry")
                    self.__db.job_data.delete_many({"job_id": reg_job})
                    self.__db.job_regestry.delete_one({"job_id": reg_job})
            except Exception as e:
                logger.error(f"MONGO: Error deleting zombie job {reg_job} from mongo registry: {e}")
                continue

        for job in jobs:
            # Register unregistered jobs in mongo
            try:
                await self.register_job(job)
            except ValueError as e:
                logger.info(f"MONGO: Job {job} already registered, skipping")
                continue
        return
    
    async def check_if_job_exists(self, job_id: int) -> bool:
        """
        Check if a job exists in the database
        """
        job = self.__db.job_regestry.find_one({"job_id": job_id})
        if job:
            return True
        else:
            return False

    async def register_job(self, job_id: int):
        """
        Register a job in the database
        """
        # Check if the jobId already exists
        if await self.check_if_job_exists(job_id):
            raise ValueError(f"Job {job_id} already exists")

        # Create the job
        logger.debug(f"MONGO: Creating job {job_id}")
        self.__db.job_regestry.insert_one({"job_id": job_id})
        return

    async def delete_job(self, job_id: int):
        """
        Delete a job from the database
        """
        # Check if the jobId exists
        if not await self.check_if_job_exists(job_id):
            raise ValueError(f"Job {job_id} not registered")

        # Delete the job
        logger.debug(f"MONGO: Deleting job {job_id}")
        self.__db.job_data.delete_many({"job_id": job_id})
        self.__db.job_regestry.delete_one({"job_id": job_id})
        return


    async def create_or_modify_job_entry(self, job_id: int, entry_id:  int|None, data: dict) -> dict:
        """
        Note: We need to use a structure like this
        {
            "job_id": "job1",
            "call_id": "entry42",
            "data": { ... }
        }
        for ideal performanc, mongodb has a maximum of 16MB per document,
        so each entry should be a single document
        """
        # Check if the jobId exists
        data = self.reformat_data(data)
        if not await self.check_if_job_exists(job_id):
            raise ValueError(f"Job {job_id} not registered")

        entry = self.__db.job_data.find_one({"job_id": job_id, "call_id": entry_id})

        if entry_id is None:
            # Generate a new entryId
            try:
                entry_id = self.__db.job_data.find({"job_id": job_id}).sort({"call_id": -1}).limit(1)[0]["call_id"] + 1
            except IndexError:
                entry_id = 0
        elif not entry:
            raise ValueError(f"Tried to update inexistent entry {entry_id} in job {job_id}")

        if entry:
            # Update the entry
            logger.debug(f"MONGO: Updating entry {entry_id} in job {job_id}")
            self.__db.job_data.update_one({"job_id": job_id, "call_id": entry_id}, {"$set": data})
        else:
            # Create the entry
            logger.debug(f"MONGO: Creating entry {entry_id} in job {job_id}")
            self.__db.job_data.insert_one({"job_id": job_id, "call_id": entry_id, **data})
        return {"call_id": entry_id, **data}

    async def delete_job_entry(self, job_id: int, entry_ids: list[int]):
        """
        Delete multiple job entries from the database.
        """
        # Check if the jobId exists
        if not await self.check_if_job_exists(job_id):
            raise ValueError(f"Job {job_id} not registered")

        # Delete the entries
        logger.debug(f"MONGO: Deleting entries {entry_ids} in job {job_id}")
        result = self.__db.job_data.delete_many({
            "job_id": job_id,
            "call_id": {"$in": entry_ids}
        })
        return result.deleted_count

    async def __get_job_entries_specific(self, job_id: int, options: JobEntrySearchModeOptionsSpecific):
        # Get the job entries
        entrys = self.__db.job_data.find({"job_id": job_id, "call_id": {"$in": options.specific}}, {"_id": 0, "job_id": 0})
        return list(entrys)

    async def __get_job_entries_range(self, job_id: int, options: JobEntrySearchModeOptionsRange):
        # Get the job entries
        if options.newest_first:
            entrys = self.__db.job_data.find({"job_id": job_id}, {"_id": 0, "job_id": 0}).sort("call_id", pymongo.DESCENDING).skip(options.start).limit(options.n_elements)
        else:
            entrys = self.__db.job_data.find({"job_id": job_id}, {"_id": 0, "job_id": 0}).skip(options.start).limit(options.n_elements)
        return list(entrys)

    async def __get_job_entries_newest(self, job_id: int, options: JobEntrySearchModeOptionsNewest):
        # Get the job entries
        entrys = self.__db.job_data.find({"job_id": job_id}, {"_id": 0, "job_id": 0}).sort("call_id", pymongo.DESCENDING).limit(options.newest)
        return list(entrys)

    async def get_job_entries(self, job_id: int, options: job_entry_search_mode_options = None) -> list[dict]:
        """
        Get job entries from the database.
        """
        # Check if the jobId exists
        if not await self.check_if_job_exists(job_id):
            raise ValueError(f"Job {job_id} not registered")

        if options is None:
            # Return all entries if no options are provided

            data = list(self.__db.job_data.find({"job_id": job_id}, {"_id": 0, "job_id": 0}))
            return data

        # Use the dispatcher to call the appropriate method
        option_type = type(options)
        if option_type in self.__search_dispatcher:
            return await self.__search_dispatcher[option_type](job_id, options)
        else:
            raise ValueError(f"Invalid options type: {option_type}")


    def close(self):
        self.__db.client.close()
        logger.debug("MONGO: Closed connection")
        return
