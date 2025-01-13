#!/bin/bash

# Consider using "supervisor"
if ss --tcp -4 | grep -q ":27017 "; then
    echo "MongoDB is already running"
else
    echo "MongoDB is not running, starting it"
    mongod --config /etc/mongod.conf &
fi

if ss --tcp -4 | grep -qE ":3306 |mysql"; then
    echo "MariaDB/MySQL is already running"
else
    echo "MariaDB/MySQL is not running, starting it"
    mariadbd &
fi

if ss --tcp -4 | grep -q ":80 "; then
    echo "Nginx is already running"
else
    echo "Nginx is not running, starting it"
    nginx &
fi

mysql -u root --socket=/data/mariadb/maria_sockert.sock -e 'SET PASSWORD FOR "root"@"localhost" = PASSWORD("webwatcher");' > /dev/null 2>&1

if [ "$DEV" = 'true' ]; then
    echo "Development mode, installing additional packages and reposetorys"
    echo "The forntend will NOT served automatically NOR will the backend start"

    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | tee /etc/apt/trusted.gpg.d/mongodb.asc
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/6.0 main" | \
            tee /etc/apt/sources.list.d/mongodb-org-6.0.list

    apt-get update
    apt-get install build-essential git mongocli -y
else
    echo "Production mode, not implemented"
fi

echo "Running endless loop to keep container running"
while true; do
    sleep 1000
done