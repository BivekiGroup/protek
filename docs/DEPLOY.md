# Деплой ProtekAuto (CMS + Frontend)

## Структура
- `protekauto-cms` — админка (Next.js App Router + Prisma + Postgres + S3)
- `protekauto-frontend` — публичный сайт (Next.js)
- `docs` — документация проекта (индекс: `docs/README.md`)

## Переменные окружения

Все значения задаются через файлы `stack.env` и/или `.env` и пробрасываются в контейнеры docker-compose. Для CMS используем `protekauto-cms/stack.env` (шаблон уже заполнен ключами, оставьте нужные пустыми и задайте в CI/CD секреты).

Минимальный набор для CMS:
- БД: `DATABASE_URL`
- Аутентификация: `NEXTAUTH_SECRET`, `JWT_SECRET`, `NEXTAUTH_URL`
- S3: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME` (и при необходимости `S3_ENDPOINT`)
- Ozon: `OZON_CLIENT_ID`, `OZON_API_KEY`, опционально `OZON_MOCK=0|1`
- OpenAI: `OPENAI_API_KEY`, опционально `OPENAI_MODEL` (по умолчанию `gpt-5`)
- Прочие (SMS/Яндекс/Логистика/Оплаты) — см. `protekauto-cms/stack.env`

Frontend (если нужен доступ к CMS):
- `NEXT_PUBLIC_CMS_BASE_URL=https://admin.yourdomain.com`
- `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

## Сборка и запуск (CMS)

1) Проверьте/заполните `protekauto-cms/stack.env`.
2) Запуск:

```
cd protekauto-cms
# локально (prod image):
CMS_PORT=3000 docker compose --env-file ./stack.env up -d --build
# или через deploy/CI импортируйте переменные и выполните тот же compose
```

Сервис будет доступен на `http://localhost:3000` (или по вашему домену; выставьте `NEXTAUTH_URL`).

Примечания:
- В `docker-compose.yml` CMS прокидывает все ключевые переменные окружения (включая Ozon/OpenAI).
- Prisma миграции выполняйте согласно вашему процессу (если есть скрипт миграций, добавьте его в пайплайн).

## Сборка и запуск (Frontend)

```
cd protekauto-frontend
# аналогично используйте свой docker-compose (если есть), или
npm ci && npm run build && npm run start
```

## Логи/Мониторинг
- Проверяйте логи контейнера CMS: `docker compose logs -f protekauto-cms`
- Ошибки загрузки изображений в S3 и запросов к Ozon/OpenAI пишутся в stdout.

## Безопасность
- Не храните реальные ключи в репозитории. Для локала используйте `.env` (в `.gitignore`), для продакшена — секции/секреты CI/CD.
- Ключ `OPENAI_API_KEY` используется только на серверной стороне.

## Ссылки
- Ozon раздел: `docs/ozon-admin-integration.md`
- Чат с ИИ (GPT‑5): `docs/2025-08-19-ai-chat-gpt5.md`
