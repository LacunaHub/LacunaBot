# Зависимости

* Node.js v16
* MongoDB v5.0
* PM2
* [node-gyp](https://github.com/nodejs/node-gyp)
* Reverse proxy (e.g. Nginx)

## Установка Node.js

Вначале установим PPA для получения доступа к его пакетам. Используйте в домашнем каталоге команду curl для получения скрипта установки предпочитаемой версии. Замените 14.x предпочитаемым номером версии (если он отличается).

```
cd ~
curl -sL https://deb.nodesource.com/setup_16.x -o nodesource_setup.sh
```

Просмотр содержимого загруженного скрипта

```
nano nodesource_setup.sh
```

Запуск скрипта

```
sudo bash nodesource_setup.sh
```

Запуск процесса установки

```
sudo apt install nodejs
```

## Установка MongoDB

Для начала импортируйте публичный ключ GPG для последней стабильной версии MongoDB. Вы можете найти соответствующий файл ключа на [сервере ключей MongoDB](https://www.mongodb.org/static/pgp/). Вам нужно найти файл, который включает номер последней стабильной версии и заканчивается на .asc. Например, если вы хотите установить MongoDB версии 5.0, необходимо искать файл с именем server-5.0.asc.

```
curl -fsSL https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
```

Проверка корректности установки ключа

```
apt-key list
```

На этом этапе ваша система APT все еще не знает, где искать пакет `mongodb-org`, который необходим для установки последней версии MongoDB.

На вашем сервере есть два места, где APT ищет онлайн-источники пакетов для загрузки и установки: файл `sources.list` и каталог `sources.list.d`. `sources.list` — это файл, который перечисляет активные источники данных APT (по одному источнику в строке, наиболее предпочтительные указываются первыми). Каталог `sources.list.d` позволяет добавлять такие записи sources.list в качестве отдельных файлов.

Запустите следующую команду, которая создает файл в каталоге `sources.list.d` под именем mongodb-org-4.4.list. В этом файле содержится только одна строка: `deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse`:

```
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
```

Эта единственная строка указывает APT все, что необходимо знать об источнике, и где его найти:

* `deb`: означает, что источник ссылается на обычную архитектуру Debian. В других случаях эта часть строки может выглядеть как `deb-src`. Это означает, что источник представляет исходный код дистрибутива Debian.
* `[ arch=amd64,arm64 ]`: указывает, в какие архитектуры загружать данные APT. В данном случае это архитектуры `amd64` и `arm64`.
* `https://repo.mongodb.org/apt/ubuntu`: это URI, представляющий местоположение данных APT. В данном случае URI указывает на адрес HTTPS, где находится официальный репозиторий MongoDB.
* `focal/mongodb-org/5.0`: репозитории Ubuntu могут содержать несколько разных выпусков. Это означает, что вам нужна только версия `4.4` пакета `mongodb-org`, доступная для выпуска Ubuntu `focal` («Focal Fossa» — это кодовое название Ubuntu 20.04).
* `multiverse`: эта часть указывает APT на один из четырех основных репозиториев Ubuntu. В данном случае — на [репозиторий `multiverse`](https://help.ubuntu.com/community/Repositories#Multiverse).

Обновите локальный индекс пакетов вашего сервера, чтобы APT знал, где найти пакет `mongodb-org`

```
sudo apt update
```

Установка

```
sudo apt install mongodb-org
```

При появлении запроса нажмите `Y`, а затем `ENTER`, чтобы подтвердить, что вы хотите установить пакет.

## Настройка службы MongoDB

Выполните следующую команду systemctl, чтобы запустить службу MongoDB

```
sudo systemctl start mongod.service
```

Затем проверьте статус службы. Обратите внимание, что эта команда не включает `.service` в определение служебного файла. `systemctl` будет автоматически добавлять этот суффикс для любого аргумента, который вы передаете, если он еще не присутствует, поэтому нет необходимости включать его

```
sudo systemctl status mongod
```

После подтверждения того, что служба работает нормально, установите активацию службы MongoDB при загрузке

```
sudo systemctl enable mongod
```

## Настройка удаленного подключения MongoDB

Чтобы разрешить удаленные подключения, необходимо отредактировать файл конфигурации MongoDB — `/etc/mongod.conf` — для дополнительной привязки MongoDB к публичному маршрутизированному IP-адресу вашего сервера. Таким образом ваша система MongoDB сможет прослушивать подключения к вашему серверу MongoDB, выполненные с удаленных компьютеров

```
sudo nano /etc/mongod.conf
```

В разделе `network interfaces` нужно найти `bindIp`

```
# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1,server_ip
```

Рекомендуется также поменять стандартный порт

Перезапустите MongoDB, чтобы изменение вступило в силу

```
sudo systemctl restart mongod
```

## Добавление пользователя с правами администратора (ВАЖНО!)

Чтобы добавить пользователя с правами администратора, вам нужно сначала подключиться к оболочке Mongo. Поскольку аутентификация отключена, вы можете сделать это с помощью команды `mongo` без каких-либо опций

```
use admin
```

Воспользуйтесь методом `db.createUser`

```javascript
db.createUser(
    {
        user: "username",
        pwd: "password", // passwordPrompt() - запрос на ввод пароля после выполнения метода
        roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
    }
)
```

Этот метод требует указать имя и пароль пользователя, а также любые роли, которые будет иметь пользователь. Напомним, что MongoDB хранит свои данные в виде документов JSON. Поэтому при создании нового пользователя все, что вы делаете, — это создаете документ для хранения соответствующих данных пользователя в форме отдельных полей.

Как и в случае объектов в JSON, документы в MongoDB начинаются и заканчиваются фигурными скобками (`{` и `}`). Чтобы начать добавление пользователя, введите открывающую фигурную скобку:

---

Чтобы активировать аутентификацию, необходимо изменить файл конфигурации MongoDB mongod.conf. После активации и перезапуска службы Mongo пользователи все равно смогут подключаться к базе данных без аутентификации. Однако они не смогут читать или изменять какие-либо данные до тех пор, пока не представят корректное имя пользователя и пароль.

```
sudo nano /etc/mongod.conf
```

Раскомментируйте раздел `security` и добавьте параметр `authorization` со значением `"enabled"`

```yaml
security:
  authorization: "enabled"
```

Обратите внимание, что у строки `security:` нет пробелов в начале, а строка `authorization:` выделена двумя пробелами в начале.

Перезапустите демон, чтобы изменения вступили в силу

```
sudo systemctl restart mongod
```

## Автоматический рестарт демона MongoDB

```
nano /lib/systemd/system/mongod.service
```

Добавьте `Restart=always` под `service`

Перезагрузите демон

```
sudo systemctl daemon-reload
```

## Установка PM2

```
npm install pm2 -g
```

### Автоматическая ротация логов PM2

```
pm2 install pm2-logrotate
```

Конфигурация

```
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD
```

# Настройка бота

В корневой папке приложения должен находиться файл `data.json` и `.env`

Пример `data.json`

```json
{
    "playableMusicHosts": [],
    "diamondPrices": [
        {
            "months": 1,
            "prices": {
                "RUB": 159,
                "USD": 1.99
            },
            "discounts": {
                "RUB": 0,
                "USD": 0
            }
        },
        {
            "months": 2,
            "prices": {
                "RUB": 299,
                "USD": 3.79
            },
            "discounts": {
                "RUB": 0,
                "USD": 0
            }
        },
        {
            "months": 12,
            "prices": {
                "RUB": 1699,
                "USD": 19.99
            },
            "discounts": {
                "RUB": 0,
                "USD": 0
            }
        }
    ],
    "allowedApiHosts": [],
    "allowedApiUrls": [],
    "allowedImageHosts": [],
    "rootUsers": [],
    "blockedUsers": []
}
```

Пример `.env`

```make
NODE_ENV=development
LCN_API_PORT=5810
LCN_DB_URI=mongodb://127.0.0.1:27017/
LCN_REDIS_URI=redis://user:pass@127.0.0.1:6379/

LCN_DISCORD_CLIENT_ID=
LCN_DISCORD_CLIENT_SECRET=
LCN_DISCORD_CLIENT_TOKEN=

LCN_SERVER_HOST_COUNT=1
LCN_SERVER_SHARD_COUNT=1
LCN_SERVER_HOST=localhost
LCN_SERVER_PORT=5565
LCN_SERVER_AUTHORIZATION=

LCN_GOOGLE_API_KEY=

LCN_BOTS_GG_API_KEY=
LCN_TOP_GG_API_KEY=
LCN_TOP_GG_WEBHOOK_SECRET=

LCN_PAYPAL_CLIENT_ID=
LCN_PAYPAL_SECRET=

LCN_QIWI_PUBLIC_KEY=
LCN_QIWI_SECRET_KEY=

LCN_TELEGRAM_BOT_TOKEN=
LCN_TELEGRAM_LOG_CHAT_ID=
LCN_TELEGRAM_PUBLIC_BOT_TOKEN=
LCN_TELEGRAM_PUBLIC_BOT_HMAC_SECRET=

LCN_TWITCH_CLIENT_ID=
LCN_TWITCH_CLIENT_SECRET=
LCN_TWITCH_SIGNING_SECRET=

LCN_ROOT_DOMAIN=localhost
# Only for local development
LCN_WEBSITE_PORT=5820

LCN_LAVALINK_NODES=NAME:IP:PORT:PASSWORD

LCN_YOUTUBE_HMAC_SECRET=

LCN_SUPPORT_SERVER_ID=
LCN_PROJECT_TEAM_ROLE_ID=
LCN_SUBSCRIBED_PATRON_ROLE_ID=
LCN_ACTIVE_PATRON_ROLE_ID=
LCN_BIG_PATRON_ROLE_ID=
LCN_FORMER_PATRON_ROLE_ID=
LCN_SERVER_BOOSTER_ROLE_ID=
LCN_NEWS_CHANNEL_ID=
LCN_NEWS_ROLE_ID=
```

Генерация ранговой карточки использует шрифт [Gotham Pro](https://fonts-online.ru/fonts/gotham-pro). Желательно его установить

---

Установка зависимостей

```
npm install
```

Компиляция

```
npm run build
```

Чистая компиляция

```
npm run clean-build
```

Запуск

```
pm2 start process.json
```