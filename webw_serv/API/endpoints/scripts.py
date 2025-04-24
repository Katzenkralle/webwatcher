import strawberry

from typing_extensions import Optional, Any
from uuid import uuid4

from webw_serv.db_handler import MariaDbHandler
from webw_serv.db_handler.maria_schemas import DbScriptInfo
from webw_serv.watcher.script_checker import script_checker
from webw_serv.utility.file_to_b64 import b64_to_file
from webw_serv import CONFIG

from ..gql_base_types import PaginationInput, JsonStr, MessageType, Message
from ..endpoints.auth import admin_guard, user_guard
from ..gql_base_types import ScriptValidationResult, Parameter, B64Str
from ..gql_types import script_content_result, jobs_metadata_result, jobs_settings_result, job_entrys_result, \
    user_job_config_result, job_metadata_result, job_full_info_result, job_entry_result, ScriptContentList
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
            new_script_input_data = script_check_result[1]
            if len(old_script_config_data) != 0 and new_script_input_data is not None:
                if not all([(param.key in new_script_input_data and 
                            param.value == getattr(new_script_input_data[param.key], "__name__", None))
                            for param in old_script_config_data[0].input_schema]):
                #old_script_config_data[0] != new_script_input_data:
                    return ScriptValidationResult(valid=False, available_parameters=[], supports_static_schema=False,
                                                  validation_msg="The new script must support the input parameters of the old.", id="")

        jsonize_type_list = lambda x: [Parameter(key=k, value=script_check_result[1][k].__name__) for k in x]

        if isinstance(script_check_result, tuple):
            script_msg = str(script_check_result[0])
            was_valid = True
            static_supported = script_check_result[2]
            try:
                await maria.add_temp_script(fs_path=path, name=uuid, expected_input=script_check_result[1], supports_static_schema=static_supported)
            except Exception as e:
                return ScriptValidationResult(valid=False, available_parameters=[], supports_static_schema=False,
                                              validation_msg=f"Failed to upload script; {e}", id="")
            
            input_parameters = []
            if script_check_result[1] is not None:
                input_parameters =  jsonize_type_list(script_check_result[1].keys())

        else:
            script_msg = str(script_check_result)
            was_valid = False
            input_parameters = []
            static_supported = False

        return ScriptValidationResult(valid=was_valid,  available_parameters=input_parameters, supports_static_schema=static_supported, validation_msg=script_msg, id=uuid)

    @strawberry.mutation
    @admin_guard()
    async def upload_script_data(self, info: strawberry.Info, name: str, description: Optional[str], id_: str | None = None) -> script_content_result:
        maria: MariaDbHandler = info.context["request"].state.maria
        if id_:
            try:
                await maria.transfer_script(id_=id_, name=name, description=description)
            except Exception as e:
                return Message(message=f"Failed to upload script; {e}", status=MessageType.DANGER)
        else:
            try:
                await maria.edit_script_description(name=name, description=description)
            except Exception as e:
                return Message(message=f"Failed to update script description; {e}", status=MessageType.DANGER)
        scripts_info = await maria.get_script_info(name)
        return ScriptContentList(scripts=scripts_info)

    @strawberry.mutation
    @admin_guard()
    async def delete_script(self, info: strawberry.Info, name: str) -> Message:
        maria: MariaDbHandler = info.context["request"].state.maria
        try:
            await maria.delete_script(name)
            return Message(message="Script deleted successfully", status=MessageType.SUCCESS)
        except Exception as e:
            return Message(message=f"Failed to delete script; {e}", status=MessageType.DANGER)



@strawberry.type
class Query:
    @strawberry.field
    @user_guard()
    async def scripts_metadata(self, info: strawberry.Info, name: str|None = None) -> script_content_result:
        maria: MariaDbHandler = info.context["request"].state.maria
        scripts_info = await maria.get_script_info(name, exclude_temp=True)
        return ScriptContentList(scripts=scripts_info)