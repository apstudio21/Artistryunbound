# Artistry Unbound

Статичний сайт + Cloudflare Pages Functions. Деплой: GitHub -> Cloudflare Pages.

## 1. GitHub
1. Створи репозиторій `artistry-unbound` (можна приватний).
2. Завантаж у нього весь вміст цієї папки (в корені мають лежати `index.html`, `functions/`, `admin/`).
3. У `admin/config.yml` заміни `YOUR_GITHUB_USERNAME/artistry-unbound` на свій репозиторій.

## 2. Cloudflare Pages
1. Workers & Pages -> Create -> Pages -> Connect to Git -> обери репозиторій.
2. Build command: порожньо. Build output directory: `/` (корінь).
3. Після першого деплою запиши адреса сайту (`xxx.pages.dev`) і встав її в `admin/config.yml` у `base_url`.

## 3. Telegram-бот для заявок
1. У Telegram напиши @BotFather -> `/newbot` -> отримаєш токен.
2. Власниця сайту відкриває свого бота і натискає Start.
3. Її chat id: відкрий в браузері `https://api.telegram.org/bot<ТОКЕН>/getUpdates` і знайди `"chat":{"id":...}`.
4. Cloudflare Pages -> Settings -> Variables and Secrets (Production), додай як Secret:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

## 4. Адмінка (/admin)
1. GitHub -> Settings -> Developer settings -> OAuth Apps -> New.
   - Homepage URL: адреса сайту
   - Authorization callback URL: `https://<адреса сайту>/api/callback`
2. Скопіюй Client ID і створи Client secret.
3. У Cloudflare додай Secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.
4. Надай власниці доступ до репозиторію (Settings -> Collaborators, роль Write).
5. Зроби Redeploy у Cloudflare, щоб змінні підхопились.

Власниця заходить на `/admin`, входить через GitHub і редагує тексти, фото й аудіо.
Кожне збереження створює коміт, і Cloudflare сам публікує зміни за ~1 хвилину.

## Перед запуском заповнити (admin -> Settings)
Способи оплати (PayPal, банк тощо), Telegram, WhatsApp, посилання на Instagram-стрічку (behold.so). Усе в admin -> Settings. Поки порожньо, на кроці оплати показується заглушка, а кружечки Telegram/WhatsApp неактивні.

## Локальний перегляд
Відкрий `index.html` у браузері: форми нічого не надсилають, але сценарій проходиться.
