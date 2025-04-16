# Configuration

The following configurations can be set using environment variables for the Webwatcher container. Some variables **must** be provided; otherwise, the web server will refuse to start.

## Crypto

Ensures that no malicious third party can alter the content of a web token:
- `CRYPTO_ALGORITHM=<STRING>` The algorithm that should be used to sign the JWT. Defaults to `HS256`.
- `CRYPTO_SECRET_KEY=<STRING>` The secret key used for signing all JWTs. **Must be provided and kept secret.**  
  **Recommendation:** A string at least 6 characters long, containing both numbers and letters.

## App/API

- `APP_DEFAULT_ADMIN_USERNAME=<STRING>` The name of the user created at server start.
- `APP_DEFAULT_ADMIN_HASH=<STRING>` The hashed value of the password, in accordance with the selected `CRYPTO_ALGORITHM`, for the user.
- `APP_HOST=<IPv4>` The IPv4 address the web API should listen to. Defaults to `0.0.0.0` (all interfaces).
- `APP_PORT=<0-49151>` The port the web API should listen to. Defaults to `7000`.
- `APP_DEV_MODE=<True|False>` Whether the web app should be started in dev mode, enabling HTML sites at `/docs` and `/gql`.
- `APP_LOG_LEVEL=<debug|info|warning|error|critical|None>` The log level of the web API.

## MongoDB Connection

- `MONGO_CONNECTION_CONNECTION_STRING` The connection string used to connect with MongoDB. Defaults to `mongodb://root:webwatcher@mongo:27017`.

## MariaDB Connection

- `SQL_CONNECTION_HOST` The host IP of the SQL database. Defaults to `maria`.
- `SQL_CONNECTION_PORT` The port of the SQL database. Defaults to `3306`.
- `SQL_CONNECTION_USER` The user used for the connection. Defaults to `root`.
- `SQL_CONNECTION_PASSWORD` The password for the user. Defaults to `webwatcher`.
- `SQL_CONNECTION_DATABASE` The name of the database used by the web API. Defaults to `webwatcher`.