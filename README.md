# Webwatcher

### Running in development mode:
1. Clone/Pull this repo
2. Run: `docker build -t someone/webwatcher:latest .` from the projects root
3. Launch the container with `docker run -d --network=host -e DEV=true someone/webwatcher:latest`
   (Note: `--network=host` is optional but recomendet for development)

### Note:
- Internal databases should never be exposed to the outside world. It is recommended to bundle this app in a Docker Compose file, alongside separate containers for the databases.


### Dev and Maintainance: 
- Connect to mariadb via cli: `mysql -u root -S /data/mariadb/maria_sockert.sock webwatcher`
- Connect to mongodb via cli: `mongosh "mongodb://localhost:27017"`