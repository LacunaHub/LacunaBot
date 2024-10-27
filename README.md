<div align="center">

<img src="https://github.com/LacunaHub/LacunaDocs/blob/e5945ea2166885e29bf7d94989918e7f3ce80af8/static/img/1920x1080.png?raw=true" alt="Lacuna" style="border-radius: 8px">

# Lacuna

[![Сообщество](https://discord.com/api/guilds/740586549145763960/widget.png)](https://discord.gg/lacunabot)
[![Статус](https://top.gg/api/widget/status/740585412560420914.svg?noavatar=true)](https://top.gg/bot/740585412560420914)
[![Серверы](https://top.gg/api/widget/servers/740585412560420914.svg?noavatar=true)](https://top.gg/bot/740585412560420914)
[![Голоса](https://top.gg/api/widget/upvotes/740585412560420914.svg?noavatar=true)](https://top.gg/bot/740585412560420914)
[![Crowdin](https://badges.crowdin.net/lacuna/localized.svg)](https://crowdin.com/project/lacuna)

</div>

# Требования

-   [Node.js](https://nodejs.org/en/download/package-manager) (v18 и выше)
-   [MongoDB](https://www.mongodb.com/try/download/community)
-   [Redis](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)

# Первоначальная настройка

1. Создать файл `.env` в корне проекта и заполнить его, взяв за основу `.env.example`.
2. Установить зависимости проекта с помощью команды `npm ci`.
    - Требуется `node-gyp` (см. [установка node-gyp](https://github.com/nodejs/node-gyp?tab=readme-ov-file#installation)).
    - Для установки зависимостей из организации @lacunahub необходимо создать GitHub PAT (personal access token) с областью `read:packages` и поместить его в переменную среды с названием `GH_PKG_TOKEN`.

## Запуск приложения

1. Выполнить компиляцию с помощью команды `npm run build`.
2. Затем запустить:
    - Через команду `npm run dev` (удобно для разработки).
    - Через команду `pm2 start process.config.js` (подходит для production).
        - PM2 можно установить через команду `npm i pm2 -g`.
        - В дополнение можно установить `pm2-logrotate` (`pm2 install pm2-logrotate`) для автоматической ротации логов.
            - Конфигурация `pm2-logrotate`:
                ```
                pm2 set pm2-logrotate:max_size 24M
                pm2 set pm2-logrotate:retain 30
                pm2 set pm2-logrotate:dateFormat YYYY-MM-DD-HH-mm
                ```

# Ссылки

-   [Сайт](https://lacunabot.com)
-   [Документация](https://docs.lacunabot.com)
-   [Discord](https://discord.gg/lacunabot)
-   [Telegram](https://t.me/roviusistaken)
-   [GitHub Discussions](https://github.com/orgs/LacunaHub/discussions)
-   [Crowdin](https://crowdin.com/project/lacuna)
