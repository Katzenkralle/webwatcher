import strawberry

from typing_extensions import Optional
from uuid import uuid4

from db_handler import MariaDbHandler
from webw_serv.watcher.script_checker import script_checker
from webw_serv.utility.file_to_b64 import b64_to_file
from webw_serv import CONFIG

from ..gql_base_types import PaginationInput, ResultType, JsonStr, MessageType, Message
from ..endpoints.auth import admin_guard, user_guard
from ..gql_base_types import ScriptValidationResult, Parameter, B64Str
from ..gql_types import script_content_result, jobs_metadata_result, jobs_settings_result, job_entrys_result, \
    user_job_config_result, job_metadata_result, job_full_info_result, job_entry_result
from webw_serv.configurator.config import Config


@strawberry.type
class Mutation:
    @strawberry.mutation
    @admin_guard(use_http_exception=True)
    async def preupload_script(self, info: strawberry.Info, file: B64Str, name: Optional[str]) -> ScriptValidationResult:
        if Config().app.disable_script_upload:
            return ScriptValidationResult(valid=False, available_parameters=[], supports_static_schema=False, validation_msg="Script upload is disabled")
        maria: MariaDbHandler = info.context["request"].state.maria
        uuid = uuid4().hex
        path = CONFIG.SCRIPTS_TEMP_PATH + info.context["user"].username + uuid + CONFIG.SCRIPTS_TEMP_SUFFIX
        b64_to_file(file, path)
        module_path = CONFIG.MODULE_TEMP_PREFIX + info.context["user"].username + uuid + CONFIG.MODULE_TEMP_SUFFIX
        script_check_result = script_checker(module_path)
        if isinstance(script_check_result, tuple) and name is not None:
            try:
                old_script_config_data = await maria.get_script_info(name)
            except Exception as e:
                return ScriptValidationResult(valid=False, available_parameters=[], supports_static_schema=False,
                                              validation_msg=f"Failed to get script info; {e}", id="")
            new_script_config_data = script_check_result[1]
            if old_script_config_data is not None and new_script_config_data is not None:
                if old_script_config_data != new_script_config_data:
                    return ScriptValidationResult(valid=False, available_parameters=[], supports_static_schema=False,
                                                  validation_msg="The script doesn't match the scheme", id="")

        if isinstance(script_check_result, tuple):
            script_msg = str(script_check_result[0])
            was_valid = True
            if script_check_result[2] is not None:
                static_supported = True
                parameters_list = [Parameter(key=k, value=script_check_result[2][k].__name__) for k in script_check_result[2].keys()]
            else:
                parameters_list = []
                static_supported = False
            try:
                await maria.add_temp_script(fs_path=path, name=uuid, excpected_return_schema=script_check_result[2])
            except Exception as e:
                return ScriptValidationResult(valid=False, available_parameters=[], supports_static_schema=False,
                                              validation_msg=f"Failed to upload script; {e}", id="")
        else:
            script_msg = str(script_check_result)
            was_valid = False
            parameters_list = []
            static_supported = False

        return ScriptValidationResult(valid=was_valid,  available_parameters=parameters_list, supports_static_schema=static_supported, validation_msg=script_msg, id=uuid)

    @strawberry.mutation
    @admin_guard()
    async def upload_script_data(self, info: strawberry.Info, name: str, description: Optional[str], temporary: bool, id_: Optional[str] = strawberry.argument(name="id")) -> script_content_result:
        maria: MariaDbHandler = info.context["request"].state.maria
        if temporary:
            try:
                await maria.transfer_script(id_=id_, name=name, description=description)
            except Exception as e:
                return Message(message=f"Failed to upload script; {e}", status=MessageType.DANGER)
            return Message(message="Script uploaded successfully", status=MessageType.SUCCESS)
        else:
            try:
                await maria.edit_script_description(name=name, description=description)
            except Exception as e:
                return Message(message=f"Failed to update script description; {e}", status=MessageType.DANGER)
            return Message(message="Script description updated successfully", status=MessageType.SUCCESS)

    @strawberry.mutation
    @admin_guard()
    async def delete_script(self, info: strawberry.Info, name: str) -> Message:
        maria: MariaDbHandler = info.context["request"].state.maria
        try:
            await maria.delete_script(name)
            return Message(message="Script deleted successfully", status=MessageType.SUCCESS)
        except Exception as e:
            return Message(message=f"Failed to delete script; {e}", status=MessageType.DANGER)

    @strawberry.mutation
    @admin_guard()
    async def create_or_modify_job(self, info: strawberry.Info, script: Optional[str],
                             execute_timer: Optional[str], # CRON
                             paramerter_kv: Optional[JsonStr],
                             forbid_dynamic_schema: bool = False,
                             description: str = "",
                             id_: int = strawberry.argument(name="id")) -> job_full_info_result:
        pass

    @strawberry.mutation
    @admin_guard()
    async def add_or_edit_entry_in_job(self, info: strawberry.Info, data: Optional[JsonStr], id_: int = strawberry.argument(name="id")) -> job_entry_result:
        pass

    @strawberry.mutation
    @admin_guard()
    async def delete_entry_in_job(self, info: strawberry.Info, id_: int = strawberry.argument(name="id")) -> job_entry_result:
        pass


@strawberry.type
class Query:
    @strawberry.field
    @user_guard()
    async def scripts_metadata(self, info: strawberry.Info, supports_static_schema: Optional[bool] = strawberry.UNSET) -> script_content_result:
        pass

    @strawberry.field
    @user_guard()
    async def jobs_metadata(self, info: strawberry.Info, name_filter: Optional[str] = strawberry.UNSET) -> jobs_metadata_result:
        pass

    @strawberry.field
    @user_guard()
    async def job_settings(self, info: strawberry.Info, id_: int = strawberry.argument(name="id")) -> jobs_settings_result:
        pass

    @strawberry.field
    @user_guard()
    async def jobs_entry(self, info: strawberry.Info, nth_element: PaginationInput,
                   time_filter: Optional[list[int]] = strawberry.UNSET,
                   result: Optional[ResultType] = strawberry.UNSET,
                   runtime: Optional[int] = strawberry.UNSET,
                   script_failure: Optional[bool] = strawberry.UNSET,
                   id_: int = strawberry.argument(name="id")) -> job_entrys_result:
        pass

    