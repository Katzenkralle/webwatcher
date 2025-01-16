# Auth
Dev Authorisation header for user: someone, password: someone
`{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ7XCJ1c2VyXCI6IFwic29tZW9uZVwiLCBcImhhc2hcIjogXCIkMmIkMTIkNGE4L2l3TUJxOUU2SnAxNTF4QUdpT2RpNGdFR3QvZXBkSHJQMFQ3QUs4blBXZ0tCLm9ja0tcIn0ifQ.ycPAfhefiqCDwzuB_iTGl7ThtEN6_TlrNtPqtS6cvO8"}`

Hash of 'someone': `$2b$12$3cV0JOP3f8LbR8VXtbbpDOIf1gUhPf7bk1DMtUCmdIA/d.uCePomC`

- Currently, I have implemented an _or_none() Auth API, which forwards requests with incorrect or unavailable authorization tokens to the handler. In such cases, the user is simply set to None. This approach allows for more granular control over authorization per request but is slightly more inefficient and might be more vulnerable to security risks.