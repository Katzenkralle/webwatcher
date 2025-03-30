#!/bin/bash

# handle SIGTERM
cleanup() {
    echo "Stopping container..."
    pkill -TERM -P $$  # Send SIGTERM to all child processes
    timeout 10s wait   # Wait for all child processes to exit
    echo "Shutdown complete."
    exit 0
}

# Trap SIGTERM signal
trap cleanup SIGTERM

nginx -g "daemon off;" &

if [ "$DEV" ]; then
    echo "Running in development mode"
    echo "Starting ssh server"
    /sbin/sshd -f /etc/ssh/sshd_config &

    # Keep the script running and listen for signals
    wait
else
    echo "Running in production mode"
    echo "Starting webwatcher"
    cd /webwatcher/webw_serv
    python3 main.py &

    # Keep the script running and listen for signals
    wait
fi
