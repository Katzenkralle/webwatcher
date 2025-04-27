# Webwatcher  
_Flexible API Monitoring Service with Reactive Web UI_

This project aims to enable users to collect data—from APIs or any other source—using watchers (small Python scripts). The data may be in any structure.  
Through a GraphQL API, the webserver can be controlled: adding new watchers, configuring jobs (the periodic execution of watchers), and retrieving previously collected data.  
For authorization, the webserver supports multiple users with different permission levels. Through an OAuth2 API, new sessions can be easily created to enable authorized access to the API for client-side scripts that want to use the data.  
For a user-friendly way of interacting with the webserver, managing users, and everything mentioned above, the reactive frontend should be used.  
There, you can also analyze, filter, download, and search the collected data presented in tables, as well as view and create graphs representing your data.

## Setup for Production  
For the most tested experience, we recommend running the webserver in Docker using the provided [Compose file](./compose.yaml).  
This configuration already includes both required databases (MongoDB and MariaDB), as well as correctly exposed ports to access the API from outside the container.  
The compose file also creates volumes to ensure no data is lost when recreating containers.

### Setup Process  
_(Assuming you are on a Linux host)_  
#### One Command install
1. Create a `compose.yaml` file with the following content:
```yaml
services:
  mongo:
    image: mongodb/mongodb-community-server:latest
    environment:
      - MONGODB_INITDB_ROOT_USERNAME=root
      - MONGODB_INITDB_ROOT_PASSWORD=webwatcher
    volumes:
      - mongo_data:/data/db
    networks:
      - internal

  maria:
    image: mariadb:latest
    environment:
      - MARIADB_USER=root
      - MARIADB_ROOT_PASSWORD=webwatcher
    volumes:
      - maria_data:/var/lib/mysql
    networks:
      - internal

  webwatcher:
    build:
      context: https://github.com/Katzenkralle/webwatcher.git
      dockerfile: conf/Dockerfile
      target: production
      
    image: katzenkralle/webwatcher:latest 
    pull_policy: build   # only build locally—never try to pull
    environment:
       # Note: use $$ to escape $ used for environment variables.
       # Refer to: https://docs.docker.com/reference/compose-file/interpolation/
       - APP_DEFAULT_ADMIN_USERNAME=Admin
       - APP_DEFAULT_ADMIN_HASH=$$2b$$12$$LjyvJ6DZyBTQIGhX3VSvM.CZUNh4U24IGuLB.L5Rm8crZNVqeylDa
       - CRYPTO_SECRET_KEY=YOUR_RANDOM_CRYPTO_KEY
    networks:
      - internal
      - global
    volumes:
      - webwatcher_data:/webwatcher/webw_serv_scripts_store
      - /etc/timezone:/etc/timezone:ro # to get the correct timezone
      - /etc/localtime:/etc/localtime:ro

networks:
  internal:
    driver: bridge
    internal: true
  global:
    name: nginx-proxy_default
    external: false

volumes:
  mongo_data:
    driver: local
  maria_data:
    driver: local
  webwatcher_data:
    driver: local

```
2. Change `CRYPTO_SECRET_KEY` to something random
3. Run `docker compose up` from the folder where your `compose.yaml` is located
4. Done! The web server should now be accessible on port `80` with the default credentials:
   Username: `Admin`
   Password: `Webwatcher`.
   (Remember to change your Password once logged in!)

#### Using Local Repository
1. Clone this repository and change into the project's root:
   - `git clone https://github.com/Katzenkralle/webwatcher.git && cd webwatcher`
2. Optional, but **highly recommended**: Change the default `CRYPTO_SECRET_KEY` environment variable of the Webwatcher container in the Compose file to a newly chosen one.
3. Build and pull the containers, and set up the environment:
   - `docker compose up`
4. Done! The web server should now be accessible on port `80` with the default credentials:
   Username: `Admin`
   Password: `Webwatcher`.
   (Remember to change your Password once logged in!)

Let me know if you'd like this as part of a full setup guide or README!

### Configuration  
Although the provided Docker Compose file offers a functional setup, you may want to change the behavior of the webserver in some way. Please reference [this document](./docs/backend_conf.md) that describes possible configuration options.
For configuration of other containers, please refer to their respective documentation.
For configuration of nginx (which runs inside the webwatcher container), refer to the [`conf/nginx.conf`](conf/nginx.conf) which will be linked to `/etc/nginx/nginx.conf` at container creation. 

### Maintenance  
- To stop the stack: `docker compose stop`  
- To start the stack: `docker compose start`  
- To remove the stack and all its containers: `docker compose down`  
- To force-rebuild all used images: `docker compose up --build --force-recreate`

## Creating Your Own Watchers

For information on how to write your own watchers, please refer to the help page under `/scripts` on your running instance of WebWatcher.  
Basically, you only need to implement the interface described in [`./webw_serv/watcher/base.py`](./webw_serv/watcher/base.py).

If you need to install additional dependencies, you can bind `/pre_start.sh` to a Bash script on the host, as shown in [this document](./docs/backend_conf.md).

## Running in Development Mode  
1. Clone or pull this repo  
2. Choose whether you need SSH or not:
   - With SSH: `ROOT_PASSWD=<SOME_PASSWD> docker compose -f conf/compose.dev.yaml up`
   - Without SSH: `docker compose -f conf/compose.dev.yaml up`
3. Done!


_(If run without SSH, the root password will be empty. Note that SSH logins with empty passwords are disabled.)_

### Getting Started with Development  
For the frontend, refer to [this guide](./docs/frontend_dev_README.md).
For the backend, start the API with `APP_DEV_MODE=True` and visit `/gql` and `/redoc` to get familiar with the endpoints and used data structures.  

## Note  
- Internal databases should **never** be exposed to the outside world! By default, both maria and mongo have weak, publicly accessible passwords. **Do not expose them without changing credentials first.**  
