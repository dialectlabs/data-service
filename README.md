# Wallet-address-registry-service service

This datastore is an "address book" for securely & privately storing a wallet user's associated addresses (email, sms, telegram, etc) off-chain.
When implemented, user's who subscribe to receive web2 notifications from dapps would have their address information stored in the database.
Dialect [Terms of Service](https://www.dialect.to/tos)
Dialect [Privacy Policy](https://www.dialect.to/privacy)

## Development

### Prerequisites

- Git
- Yarn (<2)
- Nodejs (>=16.10.0 <17)
- Docker

### Getting started with monitor development in this repo

#### Install dependencies

**npm:**

```shell
npm install
```

**yarn:**

```shell
yarn
```

#### Start database and apply migrations

```shell
docker compose up -d
./prisma/migrate-db-dev-local.sh
```

#### Run service

```shell
yarn start:dev
```

### Containerization

#### Build image (macOS)

```shell
brew install jq
./docker-build.sh
```

#### Publish image

```shell
brew install jq
docker login
./docker-publish.sh
```
