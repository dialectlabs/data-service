# Wallet-address-registry-service service

## Development

### Prerequisites

- Git
- Yarn (<2)
- Nodejs (>=16.10.0 <17)
- Docker
- Brew

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