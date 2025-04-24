#!/bin/bash

# handle SIGTERM
cleanup() {
    echo "Stopping container..."
    pkill -TERM -P $$  # Send SIGTERM to all child processes
    sleep 10   # Wait for all child processes to exit
    echo "Shutdown complete."
    exit 0
}

# Trap SIGTERM signal
trap cleanup SIGTERM

# Execute pre-start script if it exists
if [ -f /pre_start.sh ]; then
    echo "Executing pre-start script"
    bash /pre_start.sh || true
fi

if [ "$DEV" ]; then
    echo "Running in development mode"
    echo "Starting ssh server"
    /sbin/sshd -f /etc/ssh/sshd_config &

    # Keep the script running and listen for signals
    echo "entering while loop"
    while true; do 
        sleep 1
    done
else
    nginx -g "daemon off;" &
    echo "Running in production mode"
    echo "Starting webwatcher"
    cd /webwatcher
    python3 -m webw_serv
fi
