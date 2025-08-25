# Frontend: защита раздела /profile-history — 2025‑08‑24

Что изменено
- Страница `src/pages/profile-history.tsx` теперь требует авторизацию аналогично странице гаража.
- При отсутствии `authToken` в `localStorage` выполняется редирект на `/login-required`.

Мотивация
- Ранее `/profile-history` открывался без авторизации. Ожидаемое поведение — доступ только для авторизованных пользователей, как в разделе «Гараж».

Технические детали
- Добавлен `useEffect` с проверкой `localStorage.getItem('authToken')` и `router.replace('/login-required')` при отсутствии токена.
- Поведение согласовано с реализацией в `src/pages/profile-garage.tsx`.

Проверка
- Выйти из аккаунта (очистить `localStorage.authToken`).
- Открыть `/profile-history` — должен произойти мгновенный редирект на `/login-required`.
- Авторизоваться и повторно открыть `/profile-history` — страница доступна.
