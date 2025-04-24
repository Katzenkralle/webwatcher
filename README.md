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
1. Clone this repository and change into the project’s root:
   - `git clone https://github.com/Katzenkralle/webwatcher.git && cd webwatcher`
2. Optional, but **highly recommended**: Change the default `CRYPTO_SECRET_KEY` environment variable of the Webwatcher container in the Compose file to a newly chosen one.
3. Build and pull the containers, and set up the environment:
   - `docker compose up`
4. Done! The web server should now be accessible on port `80` with the default credentials:  
   Username: `admin`  
   Password: `webwatcher`.

Let me know if you'd like this as part of a full setup guide or README!

### Configuration  
Although the provided Docker Compose file offers a functional setup, you may want to change the behavior of the webserver in some way. Please reference [this document](./docs/backend_conf.md) that describes possible configuration options.
For configuration of other containers, please refer to their respective documentation.

### Maintenance  
- To stop the stack: `docker compose stop`  
- To start the stack: `docker compose start`  
- To remove the stack and all its containers: `docker compose down`  
- To force-rebuild all used images: `docker compose up --build --force-recreate`

## Creating Your Own Watchers

For information on how to write your own watchers, please refer to the help page under `/scripts` on your running instance of WebWatcher.  
Basically, you only need to implement the interface described in [](./webw_serv/watcher/base.py).

If you need to install additional dependencies, you can bind `/pre_start.sh` to a Bash script on the host, as shown in [this document](./docs/backend_conf.md).

## Running in Development Mode  
1. Clone or pull this repo  
2. Choose whether you need SSH or not:
   - With SSH: `ROOT_PASSWD=<SOME_PASSWD> docker compose --profile dev up`
   - Without SSH: `docker compose --profile dev up`
3. Done!


_(If run without SSH, the root password will be empty. Note that SSH logins with empty passwords are disabled.)_

### Getting Started with Development  
For the frontend, refer to [this guide](./docs/frontend_dev_README.md).

## Note  
- Internal databases should **never** be exposed to the outside world! By default, both databases have weak, publicly accessible passwords. **Do not expose them without changing credentials first.**  
