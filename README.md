# Webwatcher

### Running in development mode:
1. Clone/Pull this repo
2. Choose whether you need SSH or not
   - With SSH: `ROOT_PASSWD=<SOME_PASSWD> docker compose --profile dev up`
   - Without SSH: `docker compose --profile dev up`
3. Done

- To stop the stack: `docker compose --profile stop`
- To start the stack: `docker compose --profile start`
- To remove the stack and all its containers: `docker compose --profile dev down`
- To force-rebuild all used images: `docker compose --profile dev up --build --force-recreate`

### Note:
- Internal databases should never be exposed to the outside world. It is recommended to bundle this app in a Docker Compose file, alongside separate containers for the databases.
- If run without SSH, the root password will be none; empty passwords for SSH are disabled.