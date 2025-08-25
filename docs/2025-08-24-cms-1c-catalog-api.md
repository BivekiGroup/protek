# CMS: API интеграция 1С — каталог (идемпотентный upsert)

Эндпоинты
- POST `/api/1c/catalog/products` — пакетный upsert товаров (категории, характеристики, изображения, цены/остатки).
- GET `/api/1c/catalog/health` — проверка доступности и версии схемы.

Аутентификация и доступ
- Заголовок `X-API-Key` с токеном `ONEC_API_TOKEN`.
- Необязательный allow‑list по IP: `ONEC_IP_ALLOWLIST` (через запятую).
- Rate limit (в минуту на ключ): `ONEC_RATE_LIMIT_PER_MIN` (по умолчанию 60).

Конфигурация
- `ONEC_API_TOKEN`: токен доступа от 1С.
- `ONEC_MAX_BATCH_SIZE`: максимум позиций в одном запросе (по умолчанию 1000).
- `ONEC_RATE_LIMIT_PER_MIN`: лимит запросов в минуту (60 по умолчанию).
- `ONEC_STRICT_VALIDATION`: `true|false` — при `true` обработка прерывается на первой ошибке.

Идентификация и идемпотентность
- Ключ товара: `externalId` (если есть) или пара `article + brand` (оба нормализуются: article — без пробелов/дефисов, uppercase; brand — uppercase).
- Повторная отправка с тем же ключом обновляет запись, а не создаёт дубликат.
- Поддержка `Idempotency-Key` (опционально): при повторе с тем же ключом в течение 10 минут вернётся тот же агрегированный результат.

Схема данных item
```
{
  externalId?: string,
  article: string,
  brand: string,
  name: string,
  description?: string,
  price?: number,
  retailPrice?: number,
  stock?: number,
  weight?: number,
  dimensions?: string,
  images?: string[], // URL
  categories?: string[], // A/B/C
  characteristics?: Record<string,string>,
  isVisible?: boolean
}
```

Обработка
- Категории: создаются при отсутствии; поддержка иерархии `A/B/C`, привязка к товару полная (set + connect).
- Характеристики: ключ создаётся при отсутствии; `ProductCharacteristic` upsert по (productId, characteristicId).
- Изображения: при передаче массива URL синхронизируется полный набор (delete отсутствующих, create новых, order по индексу).
- Цены/остатки: частичное обновление; поле отсутствует — не меняется.
- Видимость: меняется только при явной передаче `isVisible`.
- Нормализация: `brand` — uppercase; `article` — удаление пробелов/дефисов, uppercase; trim строк.

Ответ
- Успешно: `{ ok, created, updated, failed, items: [{ key, status, id? | error? }], requestId }`
- Частичный успех — код 207.
- Ошибки валидации — 422, без падения сервера.
- Без токена/неверный IP — 401.

Примеры
- POST `/api/1c/catalog/products`:
```
{ "items": [
  {
    "externalId": "a1b2c3",
    "article": "123-ABC",
    "brand": "Bo sch",
    "name": "Щетки стеклоочистителя",
    "description": "Описание",
    "price": 990.5,
    "retailPrice": 1290,
    "stock": 15,
    "weight": 0.4,
    "dimensions": "50x5x4",
    "images": ["https://.../img1.jpg","https://.../img2.jpg"],
    "categories": ["Автотовары/Стеклоочистители"],
    "characteristics": { "Длина": "500 мм", "Крепление": "Hook" },
    "isVisible": true
  }
]}
```

Миграции БД (план)
- Добавить `Product.externalId String? @unique` (добавлено в schema.prisma).
- Перенести уникальность `Product.article` на составной индекс `(article, brand)` (добавлено в schema.prisma).
- Проводятся через Prisma (`prisma migrate`) — не входят в этот коммит.

Тестовые команды (curl)

1) Health:
```
curl -sS -H "X-API-Key: $ONEC_API_TOKEN" http://localhost:3000/api/1c/catalog/health | jq
```

2) Upsert одного товара:
```
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ONEC_API_TOKEN" \
  -H "Idempotency-Key: demo-001" \
  -d '{
    "items": [
      {
        "externalId": "demo-ext-1",
        "article": "941024",
        "brand": "DAYCO",
        "name": "Тестовый товар",
        "retailPrice": 1290,
        "price": 990.5,
        "stock": 15,
        "images": ["https://example.com/img1.jpg"],
        "categories": ["Автотовары/Ремни"],
        "characteristics": {"Длина": "500 мм"},
        "isVisible": true
      }
    ]
  }' \
  http://localhost:3000/api/1c/catalog/products | jq
```

3) Повтор с тем же `Idempotency-Key` (вернёт тот же агрегированный результат):
```
curl -sS -X POST -H "Content-Type: application/json" -H "X-API-Key: $ONEC_API_TOKEN" -H "Idempotency-Key: demo-001" -d '{"items":[{"externalId":"demo-ext-1","article":"941024","brand":"DAYCO","name":"Тестовый товар"}]}' http://localhost:3000/api/1c/catalog/products | jq
```

Проверка в БД
- Запустите `npm run db:studio` в CMS, найдите созданный Product, убедитесь:
  - `externalId` заполнен, `article` нормализован, `brand` в UPPERCASE;
  - добавлены категории по иерархии (A/B/C);
  - изображения присутствуют и упорядочены согласно входному массиву;
  - характеристики присутствуют и связаны через Characteristic + ProductCharacteristic.

Примечания
- Схема разработана так, чтобы не ломать текущие ограничения (уникальный `article`) до миграции.
- Реальные ограничения идемпотентности по `externalId` и `(article,brand)` будут закреплены миграцией.

Документация в админке
- Полная живая документация и примеры: `CMS_HOST/dashboard/integrations/1c-catalog`

Быстрый старт (dev)
- Окружение: в `protekauto-cms/.env.local` добавить без кавычек/пробелов:
  - `ONEC_API_TOKEN=...`
  - (опц.) `ONEC_IP_ALLOWLIST=127.0.0.1,::1`
- Применить схему и сгенерировать клиент Prisma:
  - `cd protekauto-cms`
  - `npm run db:push && npm run db:generate`
- Запустить CMS: `npm run dev`
- Проверка доступа:
  - `curl -sS "http://localhost:3000/api/1c/catalog/health?debug=1" -H "X-API-Key: <ONEC_API_TOKEN>" | jq`
  - Ожидается: `tokenConfigured: true`, `headerPresent: true`, `authOk: true`.

Типичные ошибки
- 401 Unauthorized:
  - Нет `ONEC_API_TOKEN` в окружении CMS или неверный `X-API-Key`.
  - Включён `ONEC_IP_ALLOWLIST`, но IP не разрешён (для curl добавьте `-H "X-Forwarded-For: 127.0.0.1"`).
  - `X-API-Key` содержит лишний пробел в конце.
- 422 Validation / Strict:
  - Нарушение схемы item или включён `ONEC_STRICT_VALIDATION=true` — обработка прерывается на первой ошибке.
- Ошибки Prisma при миграции:
  - Возможны дубли `(article, brand)` — требуется очистка данных перед применением уникального индекса.

Примечания по миграциям
- В schema.prisma добавлены `externalId` и `@@unique([article, brand])`.
- Для prod используйте `prisma migrate deploy`.
