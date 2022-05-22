# data-service

The `data-service` serves as both an off-chain data store and a set of APIs around interacting with that data. This includes, but is not limited to:

- an "address book" for securely & privately storing a dapp subscriber's associated addresses (email, sms, telegram, etc) off-chain. Users who subscribe to receive notifications from dapps would have their address information stored in the database.

Dialect [Terms of Service](https://www.dialect.to/tos)
Dialect [Privacy Policy](https://www.dialect.to/privacy)

## Dialects & messaging

### API

All of these routes are authenticated using a signed message from the user's wallet.

- `GET /dialects` — Get all dialects for a wallet.
- `GET /dialects/:public_key` — Get a dialect by its public key.
- `POST /dialects` — Create a new dialect.
  ```json
  {
    "encrypted": true,
    "members": [
      {
        "publicKey": "<public-key-1>",
        "scopes": [true, true]
      },
      {
        "publicKey": "<public-key-2>",
        "scopes": [false, true]
      }
    ]
  }
  ```
- `POST /dialects/:public_key/messages` — Create a new message in a dialect.
  ```json
  {
    "text": "<text>"
  }
  ```
- `DELETE /dialects/:public_key` — Delete a dialect.

### Data structures

- `wallet` - A public key associated with a keypair.
- `dialect` - A message thread.
- `member` - A member of a thread, many-to-many with `wallet` & `dialect`.
- `message` - A message, many-to-many with `member` & `dialect`.

## Dapp notifications & subscriptions

### API

To fill in.

### Data structures

- `wallet` — A public key associated with a keypair.
- `address` — A generalized notion of an address, e.g. wallet, email, telegram, sms, etc.
- `dapp` — A generalized notion of a dapp that wishes to send notifications to addresses.
- `dapp_address` — A single listing of an address being registered to receive notifications from a dapp. Many-to-many in `dapp`s & `address`es.

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
