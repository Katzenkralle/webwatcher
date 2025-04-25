from webw_serv.db_handler import MongoDbHandler, MariaDbHandler
from webw_serv.configurator import Config
from webw_serv.utility import DEFAULT_LOGGER

import asyncio


def establish_db_connections():
    # Setup everything
    mongo = MongoDbHandler(Config().mongo)
    maria = MariaDbHandler(Config().maria, Config().app)

    async def registerSession():
        jobs = await maria.get_job_metadata()
        await mongo.register_all_sql_jobs([job.id for job in jobs])

    try:
        asyncio.run(registerSession())
    except Exception as e:
        DEFAULT_LOGGER.error(f"Failed to register SQL jobs: {e}")

    return [mongo, maria]