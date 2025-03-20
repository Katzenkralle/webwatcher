#!/bin/bash
nginx -g "daemon off;" &
if [ "$DEV" ]; then
    echo "Running in development mode"
    echo "Starting ssh server"
    /sbin/sshd -f /etc/ssh/sshd_config

    while true; do
        sleep 10
    done
else
    echo "Running in production mode"
    echo "Starting webwatcher"
    cd /webwatcher/backend
    python3 main.py
fi
