import strawberry
from webw_serv.API.gql_base_types import Message, User, ScriptContent, JobMetaData, JobSettings, JobEntry, JobFullInfo, \
    UserJobDisplayConfig

user_result = User | Message

@strawberry.type
class ScriptContentList:
    scripts: list[ScriptContent]

script_content_result = ScriptContentList | Message

@strawberry.type
class JobsMetaDataList:
    jobs: list[JobMetaData]

jobs_metadata_result = JobsMetaDataList | Message
job_metadata_result = JobMetaData | Message
jobs_settings_result = JobSettings | Message

@strawberry.type
class JobsEntryList:
    jobs: list[JobEntry]

jobs_entry_result = JobsEntryList | Message
job_entry_result = JobEntry | Message
job_full_info_result = JobFullInfo | Message
user_job_config_result = UserJobDisplayConfig | Message

