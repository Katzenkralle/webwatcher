#!/bin/bash

# Consider using "supervisor"

# Function to check if a service is running and start it if not
check_and_start_service() {
    local start_command="$1"
    local app_name="$2"
    local additional_cmd="$3"
    local i=0
    if ! ps -e | grep -q "$app_name"; then
        echo "$app_name is not running, starting it"
        [ -n "$additional_cmd" ] && eval "$additional_cmd"
        eval "$start_command" &
        i=0
        while ! ps -e | grep -q "$app_name"; do
            sleep 1
            i=$((i + 1))
            if [ $i -gt 10 ] && [ "$DEV" != 'true' ]; then
                echo "$app_name failed to start"
                exit 1
            fi
        done
    else
        echo "$app_name is already running"
    fi
}

# MariaDB/MySQL
check_and_start_service "mariadbd" "mariadbd" "rm /data/mariadb/data/aria_log_control"

# MongoDB
check_and_start_service "su mongo_starter -c 'mongod --config /webwatcher/conf/mongod.conf'" "mongod"

# Nginx
check_and_start_service "nginx" "nginx"

while ! mysqladmin ping -u root --socket=/data/mariadb/maria_sockert.sock --silent; do
    echo "Waiting for MariaDB"
    sleep 1
done
echo "MariaDB is ready, ensuring root password is set"
mysql -u root --socket=/data/mariadb/maria_sockert.sock -e 'SET PASSWORD FOR "root"@"localhost" = PASSWORD("webwatcher");'

if [ "$DEV" = 'true' ]; then
    if [ -f /devsetup ]; then
        echo "Development mode, already setup"
    else
        echo "Development mode, installing additional packages and reposetorys"
        echo "The forntend will NOT served automatically NOR will the backend start"

        curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | tee /etc/apt/trusted.gpg.d/mongodb.asc
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/6.0 main" | \
                tee /etc/apt/sources.list.d/mongodb-org-6.0.list

        apt-get update
        apt-get install build-essential git mongocli -y
        touch /devsetup
    fi
else
    echo "Production mode, not implemented"
    exit 1
fi

echo "Running endless loop to keep container running"
while true; do
    sleep 1000
done