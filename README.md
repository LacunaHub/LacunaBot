<div align="center">

<img src="https://github.com/LacunaHub/LacunaDocs/blob/e5945ea2166885e29bf7d94989918e7f3ce80af8/static/img/1920x1080.png?raw=true" alt="Lacuna" style="border-radius: 8px">

# Lacuna

[![Community](https://discord.com/api/guilds/740586549145763960/widget.png)](https://discord.gg/srfhGjbKce)
[![Crowdin](https://badges.crowdin.net/lacuna/localized.svg)](https://crowdin.com/project/lacuna)

</div>

## Requirements

- Node.js 22+
- pnpm 10+
- MongoDB 7+
- Redis 7+
- Docker & Docker Compose (for containerized development)

## Quick start - Local development

### Configure environment

See [`apps/core/.env.example`](apps/core/.env.example)

```bash
cp apps/core/.env.example apps/core/.env
# Edit .env with your configuration
```

### Start infrastructure services

```bash
# Setup MongoDB and Redis
cd docker
docker compose -f docker-compose.dev.yml up -d

# Setup Lavalink
cd lavalink
cp .env.example .env
# Edit .env with your configuration
docker compose up -d
```

### Install dependencies and run

1. Install [`node-gyp`](https://github.com/nodejs/node-gyp?tab=readme-ov-file#installation)
2. Create a [GitHub Personal Access Token](https://github.com/settings/tokens/new) with `read:packages` scope
3. Save your token as an environment variable

```bash
export GITHUB_TOKEN=your_gh_pat
```

4. Then run

```bash
# Install packages and build
pnpm install --frozen-lockfile
pnpm build
# Start core app
pnpm start
# Start web app dev server
pnpm start:web
```

## Deployment

### Prerequisites

- Docker & Docker Compose
- MongoDB and Redis already running and reachable. They can be:
    - Running on the host machine
    - Running on a separate server/VPS
    - Running in another Docker network (in which case add them to the `lacuna` network or expose ports)
- A domain pointed at the server, with a valid SSL certificate/key pair
- Sufficient RAM: at least ~3GB free to cover the configured memory limits (can be edited)

### Directory layout

Set up the project folder on the server like this:

```
lacuna/
├── docker-compose.yml
├── .env
└── nginx/
    ├── nginx.conf
    ├── conf.d/
    │   └── upstreams.conf
    └── sites-available/
        └── api.lacunabot.com.conf
```

See [`docker`](docker) for more info.

### Environment variables

1. Create a [`.env`](apps/core/.env.example) file next to `docker-compose.yml` and fill it
2. Verify MongoDB and Redis are reachable from the Docker host before continuing

### Nginx and SSL

Make sure the SSL certificate files referenced in `docker-compose.yml` actually exist on the host at these exact paths:

```
/etc/ssl/lacunabot.com.pem
/etc/ssl/lacunabot.com.key
```

The `api` service only exposes port `5810` internally, so nginx must proxy to it by service name.

### Pull the images and start

```bash
docker compose pull
docker compose up -d
```

Start order matters slightly: `nginx` depends on `api`, but `broker`, `bot`, and `api` have no explicit dependency on each other in the compose file.

#### Verify it's running

```bash
docker compose ps
docker compose logs -f bot
docker compose logs -f api

# Confirm the API responds behind nginx
curl -I https://your-domain.com
```

# Links

- [Website](https://lacunabot.com)
- [Docs](https://docs.lacunabot.com)
- [Discord](https://discord.gg/srfhGjbKce)
- [Telegram](https://t.me/roviusistaken)
- [GitHub Discussions](https://github.com/orgs/LacunaHub/discussions)
- [Crowdin](https://crowdin.com/project/lacuna)

# License

Copyright (C) 2020 Daniyar Kurmangaliyev

This project is licensed under the GNU Affero General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details.

This license applies to this software and its entire commit history, including versions predating the addition of the LICENSE file, effective as of August 22, 2026.
