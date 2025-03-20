# Webwatcher

### Running in development mode:
1. Clone/Pull this repo
2. Run `docker compose --profile dev up`
3. Done

- To stop the stack: `docker compose --profile stop`
- To remove the stack and all its containers: `docker compose --profile dev down`
- To force-rebuild all used images: `docker compose --profile up --build`

### Note:
- Internal databases should never be exposed to the outside world. It is recommended to bundle this app in a Docker Compose file, alongside separate containers for the databases.
