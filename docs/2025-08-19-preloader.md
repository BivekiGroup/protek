# Глобальные прелоадеры (Front + CMS) — 2025‑08‑19

Что добавлено
- Frontend (pages router): глобальный прелоадер при навигации между страницами — оверлей с брендингом и спиннером.
  - Компонент: `protekauto-frontend/src/components/GlobalPreloader.tsx`
  - Подключение: `protekauto-frontend/src/pages/_app.tsx` (добавлен `<GlobalPreloader />` внутри `<Layout>`)
- CMS (app router): лёгкий роут‑прелоадер, вспыхивает на короткое время при смене `pathname`.
  - Компонент: `protekauto-cms/src/components/ui/route-preloader.tsx`
  - Подключение: `protekauto-cms/src/app/layout.tsx`

Поведение
- Frontend: слушаем `next/router` события `routeChangeStart/Complete/Error` и показываем/скрываем оверлей.
- CMS: используем `usePathname` и короткое отображение прелоадера (~400 мс) на смену пути.

Заметки
- Тексты «Загрузка…» убраны, используется чистая индикация (оверлей + спиннер/бренд). Можно заменить на GIF/анимацию по желанию.
- Прелоадер не мешает SSR/стримингу: показывается только при клиентской навигации.
