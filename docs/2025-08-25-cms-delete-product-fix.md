# CMS: фикc мутации deleteProduct (GraphQL)

Дата: 2025‑08‑25

## Проблема

При удалении товара из админки возникала ошибка Apollo/GraphQL:

- Message: Cannot return null for non-nullable field Mutation.deleteProduct.
- Причина: в схеме `type Mutation { deleteProduct(id: ID!): Boolean! }` поле объявлено как non‑nullable, но резолвера не было, что приводило к `null` значению по умолчанию.

## Решение

- Реализован резолвер `deleteProduct` в `protekauto-cms/src/lib/graphql/resolvers.ts`:
  - Проверка авторизации (наличие `context.userId`).
  - Поиск товара и валидация наличия.
  - Удаление с помощью `prisma.product.delete({ where: { id } })`.
  - Логирование аудита через `createAuditLog` с действием `PRODUCT_DELETE`.
  - Возвращаем `true` при успехе (соответствует `Boolean!`).

## Влияние

- Кнопка удаления товара в списке (`ProductList.tsx`) теперь работает стабильно.
- Массовое удаление (`deleteProducts`) ранее уже работало — без изменений.

## Файлы

- Изменён: `protekauto-cms/src/lib/graphql/resolvers.ts` — добавлен резолвер `deleteProduct`.

## Нотации

- Каскадные удаления для зависимостей товара настроены на уровне Prisma моделей; дополнительных ручных чисток не требуется.
