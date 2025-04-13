import strawberry

from typing import Optional
from dataclasses import asdict

from ..endpoints.auth import admin_guard, user_guard
from ..gql_base_types import JobEntyInput, Message, MessageType
from ..gql_types import job_entry_result

@strawberry.type
class Mutation:
    @strawberry.mutation
    @user_guard()
    async def addOrEditEntryInJob(
        self,
        info: strawberry.Info,
        data: JobEntyInput,
        jobId: int,
    ) -> job_entry_result:
        
        mongo_data = asdict(data)
        entry_id = mongo_data.pop('call_id', None)

        info.context["request"].state.mongo.create_or_modify_job_entry(jobId,entry_id, mongo_data)
        return job_entry_result(
            message=Message(
                message="Entry added/edited successfully",
                status=MessageType.SUCCESS,
            ))