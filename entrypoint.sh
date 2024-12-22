#!/bin/bash

# Consider using "supervisor"
service mongodb start
service mysql start

if [ "$DEV" = 'true' ]; then
    echo "Development mode, installing additional packages and reposetorys"
    echo "The forntend will NOT served automatically NOR will the backend start"

    curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | tee /etc/apt/trusted.gpg.d/mongodb.asc
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/6.0 main" | \
            tee /etc/apt/sources.list.d/mongodb-org-6.0.list

    apt-get update
    apt-get install build-essential git mongocli mariadb-client libmariadb-dev -y
else
    echo "Production mode, not implemented"
fi

echo "Running endless loop to keep container running"
while true; do
    sleep 1000
done