import strawberry

from typing import Optional
from dataclasses import asdict

from ..endpoints.auth import admin_guard, user_guard
from ..gql_base_types import JobEntyInput, Message, MessageType, JobEntry, PaginationInput
from ..gql_types import job_entry_result, job_entrys_result, JobEntryList

from webw_serv.db_handler.mongo_core import JobEntrySearchModeOptionsNewest, JobEntrySearchModeOptionsRange, JobEntrySearchModeOptionsSpecific

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

        try: 
            result = await info.context["request"].state.mongo.create_or_modify_job_entry(jobId,entry_id, mongo_data)
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
    async def deleteEntryInJob(
        self,
        info: strawberry.Info,
        jobId: int,
        entryIds: list[int],
    ) -> Message:
        try:
            anount_deleted = await info.context["request"].state.mongo.delete_job_entry(jobId, entryIds)
            if anount_deleted == len(entryIds):
                return Message(
                    message=f"Entrys deleted successfully",
                    status=MessageType.SUCCESS,
                )
            else:
                return Message(
                    message=f"Could not delete {len(entryIds) - anount_deleted} of the reequested {len(entryIds)} entries", 
                    status=MessageType.WARN,
                )
        except Exception as e:
            return Message(
                message=f"Failed to delete entry: {str(e)}",
                status=MessageType.DANGER,
            )
        
@strawberry.type
class Query:
    @strawberry.field
    @user_guard()
    async def getJobEntries(
        self,
        info: strawberry.Info,
        jobId: int,
        range: Optional[PaginationInput] = None,
        specificRows: Optional[list[int]] = None,
        newestN: Optional[int] = None,
    ) -> job_entrys_result:
        try:
            if range is not None:
                options = JobEntrySearchModeOptionsRange(
                    start=range.start_element,
                    n_elements=range.max,
                )
            elif specificRows is not None:
                options = JobEntrySearchModeOptionsSpecific(
                    specific=specificRows,
                )
            elif newestN is not None:
                options = JobEntrySearchModeOptionsNewest(
                    newest=newestN,
                )
            else:
                options = None
            
            data = await info.context["request"].state.mongo.get_job_entries(jobId, options)
            return JobEntryList(
                jobs=[JobEntry(**entry) for entry in data],
            )

        except Exception as e:
            return Message(
                message=f"Failed to get job entries: {str(e)}",
                status=MessageType.DANGER,
            )