# Auth
Dev Authorisation header for user: someone, password: someone
`{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ7XCJ1c2VyXCI6IFwic29tZW9uZVwiLCBcInNlc3Npb25cIjogXCIzODU3NDAzMjU3MTk2MjczNTgwODAwMDc4NDgxNDEyODY2MDA1OTg1MTg4ODY1OTY1MTUxODIwOTQ5ODQ4NzgzNjYyOTAzMTU2NDQzMDc5NjE2MTI4Nzc0MjM1OTc5MTEwMTMyNTUzNjYxNzgyMjM2OTAyMTQ4NjA1NzI1MjE0NTk1NjQyNTM0ODc5OTgxODY2MTE4MDI0NzcwNjkyMzA2MjI5NDc4NTIyNDcwMDg3NTE3NjU0NDkyNjQzNjgzMTA4OTQ3ODQ0Njk0NjI3MTY4OTc5Nzc2MzYzNDg0MzI3OTc5MzEzNjk4NzQ2Mjk4NzA2MTQxMTA0OTY1MTQyNDFcIn0ifQ.VbJqGC52Wz48YoCXgK3pKqtosOVTDAiBS1epb2K3OSY"}`

Hash of 'someone': `$2b$12$3cV0JOP3f8LbR8VXtbbpDOIf1gUhPf7bk1DMtUCmdIA/d.uCePomC`

- Currently, I have implemented an _or_none() Auth API, which forwards requests with incorrect or unavailable authorization tokens to the handler. In such cases, the user is simply set to None. This approach allows for more granular control over authorization per request but is slightly more inefficient and might be more vulnerable to security risks.