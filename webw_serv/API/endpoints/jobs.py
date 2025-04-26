import json

import strawberry

from typing import Optional
from dataclasses import asdict
from random import choice

from webw_serv import CONFIG
from webw_serv.db_handler import MariaDbHandler, MongoDbHandler
from ..endpoints.auth import admin_guard, user_guard
from ..gql_base_types import JobEntyInput, Message, MessageType, JobEntry, PaginationInput, JsonStr, JobFullInfo, \
    Parameter
from ..gql_types import job_entry_result, job_entrys_result, JobEntryList, JobsMetaDataList, JobFullInfoList, job_full_info_list_result, JobMetaData

from webw_serv.db_handler.mongo_core import JobEntrySearchModeOptionsNewest, JobEntrySearchModeOptionsRange, JobEntrySearchModeOptionsSpecific
from webw_serv.watcher.script_checker import run_once_get_schema
from webw_serv.watcher.errors import ScriptFormatException, ScriptException

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
        if description is None:
            description = choice(CONFIG.DEFAULT_JOB_DESCRIPTIONS)

        if id_ is None:
            try:
                id_ = await maria.add_job_list(script_name=script, job_name=name, description=description, dynamic_schema=not forbid_dynamic_schema)
                await mongo.register_job(id_)
            except Exception as e:
                return Message(
                    message=f"Failed to add job: {str(e)}",
                    status=MessageType.DANGER,
                )


        json_data = None
        if paramerter_kv is not None:
            try:
                json_data = json.loads(paramerter_kv)
                if json_data is not None:
                    await maria.set_job_input_settings(job_id=id_, settings=json_data)
            except Exception as e:
                return Message(
                    message=f"Failed to set job input settings: {str(e)}",
                    status=MessageType.DANGER,
                )
        if not json_data:
            json_data = {}


        try:
            # script must be resolved first
            script_check_result = (await maria.get_script_info(script, True))
            classedReturnSchema = run_once_get_schema(script_check_result[0].fs_path, json_data)
            return_schema = None
            if classedReturnSchema:
                return_schema = []
                for key, value in classedReturnSchema.items():
                    return_schema.append(Parameter(key=key, value=getattr(value, "__name__", None)))
        except Exception as e:
            return Message(
                message=f"Failed to get return schema: {str(e)}",
                status=MessageType.DANGER,
            )



        # We need to ron edit even on a new job, because we need to
        # save the expected schema
        try:
            await maria.edit_job_list(script_name=script, job_name=name, description=description, dynamic_schema=not forbid_dynamic_schema, job_id=id_, expected_schema=return_schema)
        except Exception as e:
            return Message(
                message=f"Failed to edit job: {str(e)}",
                status=MessageType.DANGER,
            )



        if execute_timer is not None:
            try:
                await maria.delete_cron_job(job_id=id_)
                await maria.add_cron_job(job_id=id_, cron_time=execute_timer, enabled=enabled)
                # TODO: register cron job
            except Exception as e:
                return Message(
                    message=f"Failed to add cron job: {str(e)}",
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
            return JobEntryList(
                jobs=[JobEntry(**entry) for entry in data],
            )

        except Exception as e:
            return Message(
                message=f"Failed to get job entries: {str(e)}",
                status=MessageType.DANGER,
            )