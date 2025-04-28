import json

import strawberry

from typing import Optional
from dataclasses import asdict, fields
from random import choice

from webw_serv import CONFIG
from webw_serv.db_handler import MariaDbHandler, MongoDbHandler
from ..endpoints.auth import admin_guard, user_guard
from ..gql_base_types import JobEntyInput, Message, MessageType, JobEntry, PaginationInput, JsonStr, JobFullInfo, \
    Parameter
from ..gql_types import job_entry_result, job_entrys_result, DEFAULT_JOB_ENTRY, JobEntryList, JobsMetaDataList, JobFullInfoList, job_full_info_list_result, JobMetaData

from webw_serv.db_handler.mongo_core import JobEntrySearchModeOptionsNewest, JobEntrySearchModeOptionsRange, JobEntrySearchModeOptionsSpecific
from webw_serv.watcher.script_checker import run_once_get_schema
from webw_serv.watcher.utils import enforce_types   
from webw_serv.watcher.errors import ScriptFormatException, ScriptException

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.base import JobLookupError
from apscheduler.triggers.cron import CronTrigger
from webw_serv.watcher.manager import watch_runner_warper


@strawberry.type
class Mutation:
    @strawberry.mutation
    @user_guard()
    async def add_or_edit_entry_in_job(
        self,
        info: strawberry.Info,
        data: JobEntyInput,
        job_id: int,
    ) -> job_entry_result:
        mongo: MongoDbHandler = info.context["request"].state.mongo
        mongo_data = asdict(data)
        entry_id = mongo_data.pop('call_id', None)

        try: 
            result = await mongo.create_or_modify_job_entry(job_id,entry_id, mongo_data)
            return JobEntry(
                **result,
            )
        except Exception as e:
            return Message(
                message=f"Failed to add/edit entry: {str(e)}",
                status=MessageType.DANGER,
            )

    @strawberry.mutation
    @user_guard()
    async def delete_entry_in_job(
        self,
        info: strawberry.Info,
        job_id: int,
        entry_ids: list[int],
    ) -> Message:
        mongo: MongoDbHandler = info.context["request"].state.mongo
        try:
            amount_deleted = await mongo.delete_job_entry(job_id, entry_ids)
            if amount_deleted == len(entry_ids):
                return Message(
                    message=f"Entrys deleted successfully",
                    status=MessageType.SUCCESS,
                )
            else:
                return Message(
                    message=f"Could not delete {len(entry_ids) - amount_deleted} of the requested {len(entry_ids)} entries",
                    status=MessageType.WARN,
                )
        except Exception as e:
            return Message(
                message=f"Failed to delete entry: {str(e)}",
                status=MessageType.DANGER,
            )
        
    @strawberry.mutation
    @user_guard()
    async def deleteJob(self, info: strawberry.Info, job_id: int) -> Message:
        maria: MariaDbHandler = info.context["request"].state.maria
        mongo: MongoDbHandler = info.context["request"].state.mongo
        try:
            await maria.delete_job(job_id)
        except Exception as e:
            return Message(
                message=f"Failed to delete job: {str(e)}",
                status=MessageType.DANGER,
            )
        try:
            await mongo.delete_job(job_id)
        except Exception as e:
            pass
        return Message(
            message=f"Job deleted successfully",
            status=MessageType.SUCCESS,
        )


    @strawberry.mutation
    @admin_guard()
    async def create_or_modify_job(self, info: strawberry.Info,
                             name: str,
                             script: str,
                             enabled: bool = True,
                             execute_timer: Optional[str] = None, # CRON
                             paramerter_kv: Optional[JsonStr] = None,
                             forbid_dynamic_schema: bool = False,
                             description: Optional[str] = None,
                             id_: Optional[int] = None) -> job_full_info_list_result:
        """
        When editing, we only want to allow changing the script if the expected schema of the new and old script match
        or when allowing dynamic schema
        """
        maria: MariaDbHandler = info.context["request"].state.maria
        mongo: MongoDbHandler = info.context["request"].state.mongo
        scheduler: BackgroundScheduler = info.context["request"].state.scheduler

        error_msg_prefix = "Failed to add job"
        current_job = None

        if description is None:
            description = choice(CONFIG.DEFAULT_JOB_DESCRIPTIONS)
        
        #  Add job to get id if it does not exist
        try:
            if id_ is None:
                id_ = await maria.add_job_list(script_name=script, job_name=name, description=description, dynamic_schema=not forbid_dynamic_schema)
                await mongo.register_job(id_)
            else:
                current_job = await maria.get_all_job_info(id_)

            # Get job input parameters
            error_msg_prefix = "Failed to get job input parameters"
            json_data = None
            if paramerter_kv is not None:
                json_data = json.loads(paramerter_kv)
            
            if json_data is None:
                json_data = {}

            # run the script to get the expected schema
            error_msg_prefix = "Failed to get expected schema"
        
            script_check_result = (await maria.get_script_info(script, True))
            type_enforced_input = enforce_types(json_data, script_check_result[0].input_schema)   
            classedReturnSchema = run_once_get_schema(script_check_result[0].fs_path, type_enforced_input)
            if isinstance(classedReturnSchema, Exception):
                raise classedReturnSchema
            return_schema = None
            if classedReturnSchema:
                return_schema = []
                for key, value in classedReturnSchema.items():
                    return_schema.append(Parameter(key=key, value=getattr(value, "__name__", None)))
        
        
            # Save the new input parameters
            error_msg_prefix = "Failed to save job input parameters"
            if json_data is not None:
                await maria.set_job_input_settings(job_id=id_, settings=json_data)


            # Edit the job with the now known expected schema
            error_msg_prefix = "Failed to edit job: "
            await maria.edit_job_list(script_name=script, job_name=name, description=description, dynamic_schema=not forbid_dynamic_schema, job_id=id_, expected_schema=return_schema)


            if execute_timer is not None:
                error_msg_prefix = "Failed to add cron job"
                await maria.add_or_update_cron_job(job_id=id_, cron_time=execute_timer, enabled=enabled)
                if enabled:
                    scheduler.add_job(
                        func=watch_runner_warper,
                        trigger=CronTrigger.from_crontab(execute_timer),
                        args=(),
                        kwargs={"config": type_enforced_input, "fs_path": script_check_result[0].fs_path, "script_name": script, "job_id": id_},
                        id=str(id_),
                        name=name,
                        replace_existing=True
                    )
                else:
                    try:
                        scheduler.remove_job(str(id_))
                    except JobLookupError:
                        pass
        except Exception as e:
            if current_job is None:
                await maria.delete_job(id_)
                await mongo.delete_job(id_)
            else:
                [job_metadata, job_settings] = current_job.values()
                job_metadata = job_metadata[0]
                job_settings = job_settings[0]
                await maria.edit_job_list(script_name=job_metadata.script, 
                                            job_name=job_metadata.name, 
                                            description=job_metadata.description, 
                                            dynamic_schema=not job_metadata.forbid_dynamic_schema, 
                                            job_id=id_, 
                                            expected_schema=job_metadata.expected_return_schema)
                params = {param.key: param.value for param in job_settings}
                await maria.set_job_input_settings(job_id=id_, 
                                                   settings=params)
                await maria.add_or_update_cron_job(
                    job_id=id_,
                    cron_time=job_metadata.execute_timer,
                    enabled=job_metadata.enabled)
            return Message(
                message=f"{error_msg_prefix}: {str(e)}",
                status=MessageType.DANGER,
            )

        try:
            _, executed_last, enabled = await maria.get_cron_job(id_)
        except ValueError as e:
            if "No cron job found for this job" in str(e):
                executed_last = None
                enabled = False
            else:
                return Message(
                    message=f"Failed to get cron job: {str(e)}",
                    status=MessageType.DANGER,
                )
        except Exception as e:
            return Message(
                message=f"Failed to get cron job: {str(e)}",
                status=MessageType.DANGER,
            )

        params = [Parameter(key=key, value=value) for key, value in json_data.items()]
        return_data = JobFullInfoList(
            jobs =[JobFullInfo(id=id_, parameters=params, expected_return_schema=return_schema, name=name, script=script, description=description, enabled=enabled, execute_timer=execute_timer, executed_last=executed_last, forbid_dynamic_schema=forbid_dynamic_schema)])
        return return_data

@strawberry.type
class Query:
    @strawberry.field
    @user_guard()
    async def jobs_metadata(self, info: strawberry.Info, name_filter: str | None = None) -> job_full_info_list_result:
        maria: MariaDbHandler = info.context["request"].state.maria
        try:
            data = await maria.get_all_job_info(name_filter)


            jobs_list = []
            for metadata, settings in zip(data["metadata"], data["settings"]):
                parameters = settings if settings and len(settings) > 0 else None
                job_info = JobFullInfo(
                    **{**metadata.__dict__, "parameters": parameters}
                )
                jobs_list.append(job_info)

            return JobFullInfoList(jobs=jobs_list)
        except Exception as e:
            return Message(
                message=f"Failed to get job metadata: {str(e)}",
                status=MessageType.DANGER,
            )

    @strawberry.field
    @user_guard()
    async def get_job_entries(
        self,
        info: strawberry.Info,
        job_id: int,
        range_: Optional[PaginationInput] = None,
        specific_rows: Optional[list[int]] = None,
        newest_n: Optional[int] = None,
    ) -> job_entrys_result:
        mongo: MongoDbHandler = info.context["request"].state.mongo
        try:
            if range_ is not None:
                options = JobEntrySearchModeOptionsRange(
                    start=range_.start_element,
                    n_elements=range_.max,
                    newest_first=range_.newest_first,
                )
            elif specific_rows is not None:
                options = JobEntrySearchModeOptionsSpecific(
                    specific=specific_rows,
                )
            elif newest_n is not None:
                options = JobEntrySearchModeOptionsNewest(
                    newest=newest_n,
                )
            else:
                options = None
            
            data = await mongo.get_job_entries(job_id, options)
            jobs = []
            for entry in data:
                fileds = fields(JobEntry)
                jobs.append(
                    JobEntry(
                        **{
                            field.name: entry.get(field.name, DEFAULT_JOB_ENTRY.__getattribute__(field.name))
                            for field in fileds
                        }
                    )
                )
                
            return JobEntryList(
                jobs=jobs,
            )

        except Exception as e:
            return Message(
                message=f"Failed to get job entries: {str(e)}",
                status=MessageType.DANGER,
            )