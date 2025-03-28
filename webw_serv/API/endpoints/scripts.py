import strawberry

from typing_extensions import Optional

from webw_serv.watcher.script_checker import script_checker
from webw_serv.utility.file_to_b64 import file_to_b64, b64_to_file
from webw_serv import CONFIG

from ..gql_base_types import PaginationInput, ResultType, JsonStr
from ..endpoints.auth import admin_guard, user_guard
from ..gql_base_types import ScriptValidationResult, Parameter, Message, B64Str
from ..gql_types import script_content_result, jobs_metadata_result, jobs_settings_result, jobs_entry_result, \
    user_job_config_result, job_metadata_result, job_full_info_result, job_entry_result


@strawberry.type
class Mutation:
    @strawberry.mutation
    @admin_guard(use_http_exception=True)
    async def preupload_script(self, info: strawberry.Info, file: B64Str) -> ScriptValidationResult:
        # TODO: mach mal
        path = CONFIG.SCRIPTS_TEMP_PATH + info.context["user"].username + CONFIG.SCRIPTS_TEMP_SUFFIX
        b64_to_file(file, path)
        module_path = CONFIG.MODULE_TEMP_PREFIX + info.context["user"].username + CONFIG.MODULE_TEMP_SUFFIX
        script_check_result = script_checker(module_path)

        if isinstance(script_check_result, tuple):
            script_msg = script_check_result[0]
            was_valid = True
            if script_check_result[2] is not None:
                static_supported = True
                parameters_list = [Parameter(key=k, value=script_check_result[2][k].__name__) for k in script_check_result[2].keys()]
            else:
                parameters_list = []
                static_supported = False
        else:
            script_msg = script_check_result
            was_valid = False
            parameters_list = []
            static_supported = False

        return ScriptValidationResult(valid=was_valid,  available_parameters=parameters_list, supports_static_schema=static_supported, validation_msg=script_msg)

    @strawberry.mutation
    @admin_guard()
    async def upload_script_data(self, name: str, create_new: bool, description: Optional[str]) -> job_metadata_result:
        pass

    @strawberry.mutation
    @admin_guard()
    async def delete_script(self, name: str) -> job_metadata_result:
        pass

    @strawberry.mutation
    @admin_guard()
    async def create_or_modify_job(self, script: Optional[str],
                             execute_timer: Optional[str], # CRON
                             paramerter_kv: Optional[JsonStr],
                             forbid_dynamic_schema: bool = False,
                             description: str = "",
                             id_: int = strawberry.argument(name="id")) -> job_full_info_result:
        pass

    @strawberry.mutation
    @admin_guard()
    async def add_or_edit_entry_in_job(self, data: Optional[JsonStr], id_: int = strawberry.argument(name="id")) -> job_entry_result:
        pass

    @strawberry.mutation
    @admin_guard()
    async def delete_entry_in_job(self, id_: int = strawberry.argument(name="id")) -> job_entry_result:
        pass

    @strawberry.mutation
    @admin_guard()
    async def user_job_display_config(self, group: JsonStr, filter_: Optional[JsonStr] = strawberry.argument(name="filter")) -> Message:
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
                   id_: int = strawberry.argument(name="id")) -> jobs_entry_result:
        pass

    @strawberry.field
    @user_guard()
    async def user_job_config(self, info: strawberry.Info, id_: int = strawberry.argument(name="id")) -> user_job_config_result:
        pass


    