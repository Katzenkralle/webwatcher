FROM debian:trixie-slim AS base
ENV DEBIAN_FRONTEND=noninteractive

# Install sys utils, dependencies and nginx
RUN apt-get update && \
    apt-get install -yq curl gnupg nginx npm python3 python3-pip libmariadb-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy files
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir /webwatcher
COPY . /webwatcher

# Install app dependencies
RUN pip3 install -r /webwatcher/backend/requirements.txt --break-system-packages
RUN npm install --prefix /webwatcher/frontend

# Building
# || true to allow failure
RUN npm run build --prefix /webwatcher/frontend || true

# Setup database and nginx
RUN rm /etc/nginx/nginx.conf
RUN ln -s /webwatcher/conf/nginx.conf /etc/nginx/nginx.conf



# Production stage
FROM base AS production
# Run entrypoint
CMD ["bash", "/entrypoint.sh"]



# Dev stage
FROM base AS dev
ENV PIP_BREAK_SYSTEM_PACKAGES=1
ENV DEV=true

# MongoDB and additional dependencies for dev
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | tee /etc/apt/trusted.gpg.d/mongodb.asc && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian buster/mongodb-org/6.0 main" | \
    tee /etc/apt/sources.list.d/mongodb-org-6.0.list && \
    apt-get update && \
    apt-get install -y build-essential git mongocli openssh-server

# SSH configuration
RUN passwd -d root && \
    echo "PermitRootLogin yes" >> /etc/ssh/sshd_config && \
    echo "ListenAddress localhost" >> /etc/ssh/sshd_config && \
    echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config && \
    echo "PermitEmptyPasswords yes" >> /etc/ssh/sshd_config && \
    echo "Subsystem sftp /usr/lib/ssh/sftp-server" >> /etc/ssh/sshd_config

RUN ssh-keygen -A && \
    echo "sshd: ALL" > /etc/hosts.deny && \
    echo "sshd: localhost" > /etc/hosts.allow

# Run entrypoint for dev
CMD ["bash", "/entrypoint.sh"]
