FROM debian:stable-slim
ENV DEBIAN_FRONTEND=noninteractive
# Install sys utils
RUN apt-get update
RUN apt upgrade
RUN apt-get install -y curl gnupg 

# Add repository
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor
RUN echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main"\
    | tee /etc/apt/sources.list.d/mongodb-org-8.0.list


# Install dependencies
RUN apt-get update
RUN apt-get install -y mongodb-org mariadb-server \
    nginx npm \
    python3 python3-pip

RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/*

# Copy files
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh


RUN mkdir /webwatcher
COPY . /webwatcher

# ToDo: Add sql/mongodb config
RUN rm -rf /etc/mongod.conf /etc/nginx/nginx.conf /etc/mysql/my.cnf
RUN ln /webwatcher/conf/mongod.conf /etc/mongod.conf
RUN ln /webwatcher/conf/nginx.conf /etc/nginx/nginx.conf
RUN ln /webwatcher/conf/my.cnf /etc/mysql/my.cnf

# Install app dependencies
RUN pip3 install -r /webwatcher/backend/requirements.txt --break-system-packages
RUN npm install --prefix /webwatcher/frontend

# Building
# || true to allow failiure
RUN npm run build --prefix /webwatcher/frontend || true

# Run entrypoint
CMD ["bash", "/entrypoint.sh"]
