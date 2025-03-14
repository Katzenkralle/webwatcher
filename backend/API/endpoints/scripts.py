import strawberry

from strawberry.file_uploads import Upload

from backend.API.endpoints.auth import admin_guard

from backend.API.gql_types import ScriptValidationResult, Parameter


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