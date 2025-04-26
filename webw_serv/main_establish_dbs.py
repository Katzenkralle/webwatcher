from webw_serv.db_handler import MongoDbHandler, MariaDbHandler
from webw_serv.configurator import Config
from webw_serv.utility import DEFAULT_LOGGER
from webw_serv.configurator.config import Config
import asyncio


def establish_db_connections():
    # Setup everything
    mongo = MongoDbHandler(Config().mongo)
    maria = MariaDbHandler(Config().maria, Config().app)

    return [mongo, maria]

async def setup(maria: MariaDbHandler, mongo: MongoDbHandler):
    [jobs, _] = (await maria.get_all_job_info()).values()
    await mongo.register_all_sql_jobs([job.id for job in jobs])

    await maria.try_create_default_user(
        username=Config().app.default_admin_username,
        hash=Config().app.default_admin_hash,
    )