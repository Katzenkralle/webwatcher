# Auth
Dev Authorisation header for user: someone, password: someone
`{"Authorization":"bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ7XCJ1c2VyXCI6IFwic29tZW9uZVwiLCBcInNlc3Npb25cIjogXCIwNjIwOTYyNjU3MTQ2MDgxMTYzNDc1MDAyMTMyOTMzNzgyOTQwNzQxODQ1MTgxNjY0NjEzMjgwODQ0MjU4Njk2MTY0MTg3NTY4NzA2NzEwNjgzMzI2NTAwNjgxMzgxNjU5NTIzOTE5ODA2Mzg1MzIzMjI5NTExOTAyNTE0MzIxMTcxNjY4ODMxODI5OTc2NzkxNTA5NTU5NzE1ODkyOTEyMDA0Mzg4MTI0ODE2MzYzNzA3MzAxODY2MDQxNDQ2MDI3MDEzODY0MTAzMjQwNjQxOTg5NzYwNTQwNzY0NDE0NTQyNTQ0ODY5Njg2NTA5NjQwMDcxMTA2NDUwNjY4NjBcIiwgXCJuYW1lXCI6IFwiZ2VsXCJ9In0.JA1e0OlJmuJ5oU2Niy3HI_YlsgeaZ5XRHfNafaTvMys"}`

Hash of 'someone': `$2b$12$3cV0JOP3f8LbR8VXtbbpDOIf1gUhPf7bk1DMtUCmdIA/d.uCePomC`

- Currently, I have implemented an _or_none() Auth API, which forwards requests with incorrect or unavailable authorization tokens to the handler. In such cases, the user is simply set to None. This approach allows for more granular control over authorization per request but is slightly more inefficient and might be more vulnerable to security risks.