import strawberry

from strawberry.file_uploads import Upload
from typing_extensions import Optional


from backend.API.endpoints.auth import admin_guard
from backend.API.gql_types import ScriptValidationResult, Parameter, Message


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
    def upload_script_data(self, name: str, createNew: bool, description: Optional[str]) -> JobMetaDataResult:
        pass

    @strawberry.mutation
    @admin_guard
    def delete_script(self, name: str) -> Message:
        pass

    