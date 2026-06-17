<div align="center">

<img src="https://github.com/LacunaHub/LacunaDocs/blob/e5945ea2166885e29bf7d94989918e7f3ce80af8/static/img/1920x1080.png?raw=true" alt="Lacuna" style="border-radius: 8px">

# Lacuna

[![Community](https://discord.com/api/guilds/740586549145763960/widget.png)](https://discord.gg/srfhGjbKce)
[![Status](https://top.gg/api/widget/status/740585412560420914.svg?noavatar=true)](https://top.gg/bot/740585412560420914)
[![Servers](https://top.gg/api/widget/servers/740585412560420914.svg?noavatar=true)](https://top.gg/bot/740585412560420914)
[![Votes](https://top.gg/api/widget/upvotes/740585412560420914.svg?noavatar=true)](https://top.gg/bot/740585412560420914)
[![Crowdin](https://badges.crowdin.net/lacuna/localized.svg)](https://crowdin.com/project/lacuna)

</div>

## Requirements

- Node.js 22+
- MongoDB 7+
- Redis 7+
- Docker & Docker Compose (for containerized development)

## Quick start

1. Configure environment

    ```bash
    cp .env.example .env
    # Edit .env with your configuration
    ```

2. Start infrastructure services

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

3. Install dependencies and run

    1. Install [`node-gyp`](https://github.com/nodejs/node-gyp?tab=readme-ov-file#installation)

    2. Create a [GitHub Personal Access Token](https://github.com/settings/tokens/new) with `read:packages` scope
    3. Save your token as an environment variable

    ```bash
    export GH_PKG_TOKEN=your_gh_pat
    ```

    4. Then run

    ```bash
    npm ci
    npm run dev
    ```

# Links

- [Website](https://lacunabot.com)
- [Docs](https://docs.lacunabot.com)
- [Discord](https://discord.gg/srfhGjbKce)
- [Telegram](https://t.me/roviusistaken)
- [GitHub Discussions](https://github.com/orgs/LacunaHub/discussions)
- [Crowdin](https://crowdin.com/project/lacuna)
