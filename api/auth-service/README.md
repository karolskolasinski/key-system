# auth-service

auth-service is a microservice of the key system.

## dependencies:

- Node.js (v23.10.0)
- Docker (docker version 26.1.3, build 26.1.3-0ubuntu1~22.04.1)
- Docker Compose plugin for Docker [(Docker Compose version v2.34.0)](https://docs.docker.com/compose/install/linux/)

All of the above dependencies must be installed on your local machine.

- PostgreSQL (will be installed in a Docker container)

## how to run:

1. Provide a `.env` file with the following variables:

```dotenv
VERSION=

EXPRESS_PORT=

POSTGRES_HOST=
POSTGRES_PORT=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=

PGADMIN_PORT=
PGADMIN_DEFAULT_EMAIL=
PGADMIN_DEFAULT_PASSWORD=
```

`VERSION` must be either `dev` or `prod`.

2. Install dependencies:

```bash
npm i
```

3. Start the service:

```bash
npm start
```

4. Any code changes will automatically restart the server using `nodemon`.
