import strawberry
from typing import Union, Annotated
from webw_serv.API.gql_base_types import Message, User, ScriptContent, JobMetaData, JobSettings, JobEntry, JobFullInfo, \
    UserDisplayConfig, UserDisplayConfig

user_result = User | Message

@strawberry.type
class ScriptContentList:
    scripts: list[ScriptContent]

script_content_result = ScriptContentList | Message

@strawberry.type
class JobsMetaDataList:
    jobs: list[JobMetaData]

@strawberry.type
class JobFullInfoList:
    jobs: list[JobFullInfo]

jobs_metadata_result = JobsMetaDataList | Message
job_metadata_result = JobMetaData | Message
jobs_settings_result = JobSettings | Message
job_full_info_result = Annotated[Union[JobFullInfo, Message], strawberry.union("JobFullResult")]
job_full_info_list_result = Annotated[Union[JobFullInfoList, Message], strawberry.union("JobFullResult")]

@strawberry.type
class JobEntryList:
    jobs: list[JobEntry]

job_entrys_result = JobEntryList | Message
job_entry_result = JobEntry | Message
user_job_config_result = UserDisplayConfig | Message
user_display_config_result = UserDisplayConfig | Message