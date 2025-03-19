import strawberry

from strawberry.file_uploads import Upload
from typing_extensions import Optional

from API.gql_base_types import PaginationInput, ResultType, JsonStr
from backend.API.endpoints.auth import admin_guard
from backend.API.gql_base_types import ScriptValidationResult, Parameter, Message
from backend.API.gql_types import script_content_result, jobs_metadata_result, jobs_settings_result, jobs_entry_result, \
    user_job_config_result, job_metadata_result, job_full_info_result, job_entry_result


@strawberry.type
class Mutation:
    @strawberry.mutation
    @admin_guard()
    def preupload_script(self, info: strawberry.Info, file: Upload) -> ScriptValidationResult:
        # TODO: mach mal
        ...
        was_valid = ...
        parameters_list = [Parameter(..., ...)]
        static_supported = ...
        return ScriptValidationResult(valid=was_valid,  available_parameters=parameters_list, supports_static_schema=static_supported)

    @strawberry.mutation
    @admin_guard
    def upload_script_data(self, name: str, create_new: bool, description: Optional[str]) -> job_metadata_result:
        pass

    @strawberry.mutation
    @admin_guard
    def delete_script(self, name: str) -> job_metadata_result:
        pass

    @strawberry.mutation
    @admin_guard
    def create_or_modify_job(self, script: Optional[str],
                             execute_timer: Optional[str], # CRON
                             paramerter_kv: Optional[JsonStr],
                             forbid_dynamic_schema: bool = False,
                             description: str = "",
                             id_: int = strawberry.argument(name="id")) -> job_full_info_result:
        pass

    @strawberry.mutation
    @admin_guard
    def add_or_edit_entry_in_job(self, data: Optional[JsonStr], id_: int = strawberry.argument(name="id")) -> job_entry_result:
        pass

    @strawberry.mutation
    @admin_guard
    def delete_entry_in_job(self, id_: int = strawberry.argument(name="id")) -> job_entry_result:
        pass

    @strawberry.mutation
    @admin_guard
    def user_job_display_config(self, group: JsonStr, filter_: Optional[JsonStr] = strawberry.argument(name="filter")) -> Message:
        pass


@strawberry.type
class Query:
    @strawberry.field
    def scripts_metadata(self, supports_static_schema: Optional[bool]) -> script_content_result:
        pass

    @strawberry.field
    def jobs_metadata(self, name_filter: Optional[str]) -> jobs_metadata_result:
        pass

    @strawberry.field
    def job_settings(self, id_: int = strawberry.argument(name="id")) -> jobs_settings_result:
        pass

    @strawberry.field
    def jobs_entry(self, nth_element: PaginationInput,
                   time_filter: Optional[list[int, int]],
                   result: Optional[ResultType],
                   runtime: Optional[int],
                   script_failure: Optional[bool],
                   id_: int = strawberry.argument(name="id")) -> jobs_entry_result:
        pass

    @strawberry.field
    def user_job_config(self, id_: int = strawberry.argument(name="id")) -> user_job_config_result:
        pass


    