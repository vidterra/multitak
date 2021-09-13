# multitak

A simple TAK server written in Javascript that relays messages between networks and servers

## About

MultiTAK is designed to connect TAK users on various networks together with minimal configuration. It automatically relays TAK messages (COT and proto formats) between multicast, remote TAK servers and it's own hosted TAK server.

*MultiTAK is an incomplete implementation of a TAK server, expect issues and report any messages that do not work* 

## Installation

MultiTAK is designed to be used with Docker. Docker images can be found at https://hub.docker.com/r/vidterra/multitak. Images are available for x86, arm64 and arm/v7 (Pi).

### Docker

Basic command 

`docker run -it --rm --net=host vidterra/multitak`

Advanced command

`docker run -it --rm --net=host --env MULTITAK_API_PORT=9090 --env REMOTE_TCP_SERVER=tcp://your.takserver.com:8087 vidterra/multitak`

*You must run in host mode for multicast to work*

### Docker Compose

Create a `docker-compose.yml` file like this 

```
version: '3.8'

services:
  multitak:
    image: vidterra/multitak
    #env_file: /home/pi/.env
    network_mode: host
    restart: always
    logging:
      options:
        max-file: "3"
        max-size: "50m"
```

run `docker-compose up -d`

### Node.js

```
git clone git@github.com:vidterra/multitak.git
npm install
node app/index.js
```
*MultiTAK is designed for Node.js 14.x LTS*

## Design

MultiTAK is opinionated and designed to work without any user configuration. By default it will listen for TAK messages on all physical network interfaces and repeat what it receives to every interface. It also hosts a simple TAK server and can be a client to a remote TAK server.  

MultiTAK can receive TAK proto messages, but will always translate to COT XML for storage and output. Proto to COT translation is incomplete, and some message types may not work correctly yet. MultiTAK relies on https://github.com/vidterra/tak.js for message conversion.

A simple REST JSON API is provided to get information about MultiTAK's message history. MultiTAK is ephemeral and does not save messages between restarts.

## Configuration

MultiTAK can be configured using environment variables in 3 ways
- docker command-line `--env` or `--env-file` when starting a container
- docker-compose `docker-compose.yml` files with a `environment:` or a `env_file:` block
- a `.env` in the base folder when running directly using `node`

### Environment Variables

`REMOTE_TCP_SERVER=tcp://yourserver:8087` 
- MultiTAK will connect to a remote TAK server via TCP 
- When disconnected, reconnection attempts occur every 5 sec.
- `Default` is off if not defined

`REMOTE_SSL_SERVER=ssl://yourserver:8089`
- MultiTAK will connect to a remote TAK server via SSL
- Reconnections are not attempted
- `Default` is off if not defined

`REMOTE_SSL_SERVER_CERTIFICATE=<path to file>`
- SSL certificate in PEM format with no password
- `Required` when using `REMOTE_SSL_SERVER`

`REMOTE_SSL_SERVER_KEY=<path to file>`
- SSL certificate key in PEM format with no password
- `Required` when using `REMOTE_SSL_SERVER`

`MULTITAK_API_ADDRESS=0.0.0.0`
- IP address for the web API server to listen on
- `Default` is `0.0.0.0`

`MULTITAK_API_PORT=8080`
- Port for the web API server to listen on
- `Default` is `8080`

`INTERFACE_BLACKLIST_SEND=eth0,eth1`
- Comma separated list of ethernet interfaces to ignore sending multicast
- `Default` is off if not defined

`INTERFACE_BLACKLIST_RECEIVE=eth0,eth1`
- Comma separated list of ethernet interfaces to ignore receiving multicast
- `Default` is off if not defined

`TCP_SERVER_ADDRESS=0.0.0.0`
- IP address for the TAK message server to listen on
- `Default` is `0.0.0.0`

`TCP_SERVER_PORT=8087`
- Port for the TAK message server to listen on
- `Default` is `8087`

`MESSAGE_HISTORY_LIMIT=1000`
- Maximum # of messages to retain in memory
- `Default` is `1000`
- `0` is unlimited

## Web API

`/api/messages`
- return all messages stored in the history (less than `MESSAGE_HISTORY_LIMIT`)

## Contributing

Contributions are welcome
