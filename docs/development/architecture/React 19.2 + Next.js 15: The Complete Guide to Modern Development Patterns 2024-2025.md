# React 19.2 + Next.js 15: Полное руководство по современным паттернам разработки 2024-2025

**React 19 + Next.js 15 + Turbopack + Tailwind CSS 4.0 + shadcn/ui + Drizzle ORM + NextAuth.js v5 + Zustand + TanStack Query v5 + Node.js 24 LTS**

React 19 и Next.js 15 представляют революционные изменения в разработке full-stack приложений. Ключевое изменение — **Server Components теперь по умолчанию**, что радикально меняет архитектуру приложений. В этом руководстве разбираются актуальные паттерны 2024-2025 года с конкретными примерами кода для production-ready приложений.

## React 19: революционные изменения в работе с формами и состоянием

React 19 вводит **Actions** — новую парадигму работы с асинхронными операциями, которая радикально упрощает обработку форм и управление состоянием. Actions автоматически обрабатывают pending states, ошибки и оптимистичные обновления.

**Форма с Actions (новый стандарт 2025):**

```typescript
'use client'
import { useActionState } from 'react'

function UserForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData) => {
      const result = await createUser(formData)
      if (result.error) return { error: result.error }
      redirect('/success')
      return { success: true }
    },
    { error: null }
  )
  
  return (
    <form action={formAction}>
      <input name="username" required />
      <button disabled={isPending}>
        {isPending ? 'Создание...' : 'Создать пользователя'}
      </button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  )
}
```

**useOptimistic для мгновенных UI обновлений:**

```typescript
function TodoList({ initialTodos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    initialTodos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  )
  
  const [, formAction] = useActionState(async (_, formData) => {
    const text = formData.get('text')
    addOptimisticTodo({ id: Date.now(), text, completed: false })
    await addTodoToDatabase(text)
    revalidatePath('/todos')
  }, null)
  
  return (
    <>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
      <form action={formAction}>
        <input name="text" />
        <button>Добавить</button>
      </form>
    </>
  )
}
```

**use() hook для условного чтения промисов:**

В отличие от классических хуков, `use()` можно вызывать условно — это открывает новые паттерны работы с асинхронными данными:

```typescript
function Comments({ commentsPromise }) {
  const comments = use(commentsPromise) // Приостанавливает рендер до разрешения
  return comments.map(c => <p key={c.id}>{c.text}</p>)
}

function Post({ postId }) {
  const commentsPromise = fetchComments(postId)
  return (
    <Suspense fallback={<div>Загрузка комментариев...</div>}>
      <Comments commentsPromise={commentsPromise} />
    </Suspense>
  )
}
```

**ref as prop заменяет forwardRef:**

**Устарело ❌ (будет удалено):**
```typescript
const MyInput = forwardRef((props, ref) => (
  <input ref={ref} {...props} />
))
```

**Новый стандарт ✅:**
```typescript
function MyInput({ ref, ...props }) {
  return <input ref={ref} {...props} />
}
```

## Next.js 15 App Router: Server Components как основа архитектуры

Next.js 15 делает Server Components выбором по умолчанию. **Ключевой принцип**: используйте Server Components везде, добавляйте `'use client'` только когда необходима интерактивность.

**Матрица принятия решений: Server vs Client Component:**

| Server Component | Client Component |
|-----------------|------------------|
| Получение данных из БД/API | Интерактивность (onClick, onChange) |
| Доступ к backend ресурсам | React хуки (useState, useEffect) |
| Хранение секретов | Browser APIs (window, localStorage) |
| Большие зависимости | Пользовательский ввод в реальном времени |

**Композиция: передача Server Components в Client:**

```typescript
// Server Component может передавать другие Server Components как children
export default async function Page() {
  const data = await fetchData()
  return (
    <ClientWrapper>
      <ServerDataDisplay data={data} /> {/* Остается серверным! */}
    </ClientWrapper>
  )
}
```

**Server Actions — унифицированный способ мутаций:**

```typescript
// app/actions/posts.ts
'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  
  // Всегда валидируйте на сервере
  if (!title || title.length < 3) {
    return { error: 'Заголовок слишком короткий' }
  }
  
  try {
    const post = await db.post.create({ data: { title } })
    revalidatePath('/posts')
    redirect(`/posts/${post.id}`)
  } catch (error) {
    return { error: 'Не удалось создать пост' }
  }
}

// Server Component
import { createPost } from '@/actions/posts'

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <button type="submit">Создать</button>
    </form>
  )
}
```

**Parallel Routes для одновременной загрузки:**

```
app/
├── @analytics/page.tsx
├── @team/page.tsx
└── page.tsx
```

```typescript
// layout.tsx
export default function Layout({ children, analytics, team }) {
  return (
    <div>
      <main>{children}</main>
      <aside>{analytics}{team}</aside>
    </div>
  )
}
```

## Turbopack и Partial Prerendering: революция в производительности

**Turbopack стал стабильным в Next.js 15** и по умолчанию используется в development. Производственные сборки находятся в beta (флаг `--turbopack`).

**Измеренные улучшения производительности:**
- **До 76.7% быстрее** запуск dev-сервера
- **До 96.3% быстрее** Fast Refresh (обновления кода)
- **До 45.8% быстрее** начальная компиляция маршрута
- **10x быстрее** полные сборки в production
- **100x быстрее** инкрементальные сборки

**Настройка Turbopack:**

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src',
      '@components': './src/components',
      '@utils': './src/utils',
    },
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
}

export default nextConfig
```

**Partial Prerendering (PPR) — статика + динамика в одном маршруте:**

PPR объединяет статическое и динамическое содержимое. Статическая оболочка отправляется мгновенно, динамические части стримятся по готовности.

```typescript
// next.config.ts
export default {
  experimental: {
    ppr: 'incremental', // Включить для отдельных маршрутов
  },
}

// app/page.tsx
export const experimental_ppr = true

export default function Page() {
  return (
    <>
      <StaticComponent />  {/* Предрендерено */}
      <Suspense fallback={<Skeleton />}>
        <DynamicComponent />  {/* Стримится в рантайме */}
      </Suspense>
    </>
  )
}
```

**Новое в Next.js 15: after() API для фоновых задач:**

```typescript
import { after } from 'next/server'

export async function POST(request: Request) {
  const user = await createUser(request)
  
  // Выполняется после отправки ответа (неблокирующее)
  after(async () => {
    await sendWelcomeEmail(user.email)
    await logUserAction(user.id)
    await updateAnalytics(user)
  })
  
  return NextResponse.json({ success: true })
}
```

**Критическое изменение: кеширование теперь opt-in:**

В Next.js 15 запросы и GET маршруты **больше не кешируются по умолчанию**. Используйте новую директиву `use cache`:

```typescript
'use cache'
import { cacheTag } from 'next/cache'

export async function getComments() {
  cacheTag('comments')
  const comments = await db.select().from(commentsTable)
  return comments
}

// Инвалидация кеша
import { revalidateTag } from 'next/cache'

export async function createComment(formData) {
  await db.insert(comments).values({ message: formData.get('message') })
  revalidateTag('comments')
}
```

## Tailwind CSS 4.0: CSS-first конфигурация и Oxide engine

**Tailwind CSS 4.0 представляет кардинальные изменения:**
- **10x быстрее** полные сборки благодаря Rust-based Oxide engine
- **100x быстрее** инкрементальные сборки
- **CSS-first конфигурация** вместо JavaScript
- **Встроенная поддержка** container queries, вложенности CSS
- **Нулевая конфигурация** для обнаружения шаблонов

**Миграция конфигурации с v3 на v4:**

**Устарело (v3) ❌:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { 500: '#3b82f6' }
      }
    }
  }
}
```

**Новый стандарт (v4) ✅:**
```css
@import "tailwindcss";

@theme {
  --color-brand-500: #3b82f6;
  --font-family-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 1920px;
  --color-neon-pink: oklch(71.7% 0.25 360);
}
```

**Автоматическая миграция:**
```bash
npx @tailwindcss/upgrade@next
```

**Container Queries теперь встроены:**

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @lg:grid @lg:grid-cols-3">
    <!-- Адаптируется к ширине контейнера, не viewport -->
  </div>
</div>
```

**Интеграция с shadcn/ui:**

```bash
# Установка Next.js 15 + shadcn/ui
npx create-next-app@latest my-app
npx shadcn@latest init

# Добавление компонентов
npx shadcn@latest add button dialog form
```

**Настройка темы для shadcn/ui с Tailwind v4:**

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
  --primary: hsl(0 0% 9%);
  --radius: 0.5rem;
}

.dark {
  --background: hsl(0 0% 3.9%);
  --foreground: hsl(0 0% 98%);
  --primary: hsl(0 0% 98%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --radius-lg: var(--radius);
}
```

**Dark mode с Tailwind v4:**

```css
@variant dark (&:where(.dark, .dark *));

/* Или с data-атрибутом */
@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

## Drizzle ORM: type-safe база данных для edge runtime

**Ключевое обновление 2025: identity columns вместо serial:**

```typescript
import { pgTable, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  // ✅ Новый стандарт 2025
  id: integer('id').primaryKey().generatedAlwaysAsIdentity({
    startWith: 1000,
    increment: 1,
  }),
  email: varchar('email', { length: 320 }).notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', {
    mode: 'date',        // date режим на 10-15% быстрее
    precision: 3,        // миллисекундная точность
    withTimezone: true   // всегда используйте timezone
  }).defaultNow().notNull(),
})
```

**Оптимальная индексация (до 275x быстрее с partial indexes):**

```typescript
export const orders = pgTable('orders', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  customerId: integer('customer_id').notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  orderDate: timestamp('order_date', { mode: 'date' }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }),
}, (table) => [
  // Индекс для внешних ключей
  index('orders_customer_idx').on(table.customerId),
  
  // Partial index - до 275x улучшение производительности
  index('orders_active_idx')
    .on(table.customerId, table.orderDate.desc())
    .where(sql`${table.status} = 'active'`),
  
  // Covering index - избегает обращений к таблице
  index('orders_covering_idx')
    .on(table.customerId, table.orderDate.desc())
    .include(table.totalAmount),
])
```

**Edge-совместимые драйверы (критично для Next.js 15):**

```typescript
// PostgreSQL - Neon Serverless (рекомендуется для Edge)
import { drizzle } from 'drizzle-orm/neon-serverless'
export const db = drizzle(process.env.POSTGRES_URL!)

// Edge runtime маршрут
export const runtime = 'edge'

export async function GET(request: Request) {
  const users = await db.select().from(usersTable)
  return NextResponse.json({ users })
}
```

**Prepared statements — до 100x быстрее:**

```typescript
// ✅ Подготавливается один раз, выполняется многократно
const getUserByEmail = db
  .select()
  .from(users)
  .where(eq(users.email, sql.placeholder('email')))
  .prepare('getUserByEmail')

// Переиспользование для максимальной производительности
const user1 = await getUserByEmail.execute({ email: 'user1@example.com' })
const user2 = await getUserByEmail.execute({ email: 'user2@example.com' })
```

**Upstash Redis кеширование (нативная поддержка):**

```typescript
import { upstashCache } from "drizzle-orm/cache/upstash"
import { drizzle } from "drizzle-orm/neon-serverless"

const db = drizzle(process.env.DB_URL!, {
  cache: upstashCache({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
    global: true,  // Включить для всех запросов
    config: { ex: 60 }, // 60 секунд TTL
  }),
})

// Автоматическая инвалидация при мутациях
await db.insert(users).values({ email: "[email protected]" })
// ☝️ Автоматически инвалидирует кешированные запросы к таблице users
```

## NextAuth.js v5 (Auth.js): упрощенная аутентификация

NextAuth.js v5 представляет **унифицированный API** и улучшенную совместимость с Next.js 15 App Router.

**Централизованная конфигурация:**

```typescript
// auth.ts (в корне проекта)
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google, GitHub],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.sub
      return session
    },
  },
})

// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

**Универсальный метод auth() заменяет все:**

**Устарело (v4) ❌:**
```typescript
import { getServerSession } from "next-auth/next"
import { getToken } from "next-auth/jwt"
import { withAuth } from "next-auth/middleware"
```

**Новый стандарт (v5) ✅:**
```typescript
import { auth } from "@/auth"

// Server Component
export default async function Page() {
  const session = await auth()
  return <div>{session?.user?.email}</div>
}

// API Route
export const GET = auth(function GET(req) {
  if (req.auth) return NextResponse.json(req.auth)
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
})

// Middleware
export { auth as middleware } from "@/auth"
```

**Server Actions с NextAuth v5:**

```typescript
import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("github")
      }}
    >
      <button>Войти через GitHub</button>
    </form>
  )
}
```

**Edge-совместимая конфигурация:**

```typescript
// auth.config.ts (edge-совместимая)
import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"

export default { 
  providers: [GitHub] 
} satisfies NextAuthConfig

// auth.ts (полная конфигурация с адаптером)
import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import authConfig from "./auth.config"

export const { auth, handlers } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" }, // Обязательно для edge
  ...authConfig,
})
```

## Zustand + TanStack Query v5: разделение клиентского и серверного состояния

**Четкое разделение ответственности:**

| Тип состояния | Библиотека | Примеры | Характеристики |
|--------------|-----------|---------|----------------|
| **Server State** | TanStack Query | API данные, профили пользователей | Асинхронное, требует синхронизации, кеш |
| **Client State** | Zustand | UI состояние, настройки, фильтры | Синхронное, локальное, эфемерное |

**Zustand для UI состояния:**

```typescript
import { create } from 'zustand'

interface UIStore {
  sidebar: boolean
  theme: 'light' | 'dark'
  toggleSidebar: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebar: false,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebar: !state.sidebar })),
  setTheme: (theme) => set({ theme }),
}))

// Экспортируйте атомарные селекторы
export const useSidebar = () => useUIStore((state) => state.sidebar)
export const useTheme = () => useUIStore((state) => state.theme)
```

**TanStack Query v5 с Server Components:**

```typescript
// app/posts/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

async function getPosts() {
  const res = await fetch('https://api.example.com/posts')
  return res.json()
}

export default async function PostsPage() {
  const queryClient = new QueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostsClient />
    </HydrationBoundary>
  )
}

// app/posts/posts-client.tsx
'use client'
import { useQuery } from '@tanstack/react-query'

export function PostsClient() {
  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })
  return <PostsList posts={posts} />
}
```

**useSuspenseQuery — новые хуки в v5:**

```typescript
'use client'
import { useSuspenseQuery } from '@tanstack/react-query'

export function Posts() {
  // data никогда не undefined - типобезопасно!
  const { data } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <ul>
      {data.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <Posts />
    </Suspense>
  )
}
```

**Оптимистичные обновления с TanStack Query:**

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    // Отменить исходящие refetch
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    
    // Снимок предыдущего значения
    const previousTodos = queryClient.getQueryData(['todos'])
    
    // Оптимистичное обновление
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
    
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    // Откат при ошибке
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

**Zustand с Server Components (Next.js 15):**

**Критично:** Не используйте глобальные стора в App Router. Создавайте стору per-request через Context:

```typescript
// stores/counter-store.ts
import { createStore } from 'zustand/vanilla'

export const createCounterStore = (initState: { count: number }) => {
  return createStore<CounterStore>()((set) => ({
    ...initState,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
}

// providers/counter-store-provider.tsx
'use client'
import { createContext, useRef, useContext } from 'react'
import { useStore } from 'zustand'

const CounterStoreContext = createContext<ReturnType<typeof createCounterStore> | null>(null)

export function CounterStoreProvider({ children, initialCount }) {
  const storeRef = useRef<ReturnType<typeof createCounterStore>>()
  if (!storeRef.current) {
    storeRef.current = createCounterStore({ count: initialCount })
  }
  
  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  )
}
```

## Архитектура проекта: feature-based структура

**Рекомендуемая структура для production:**

```
my-app/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/            # Route group (не влияет на URL)
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── actions.ts # Server Actions
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── _components/  # Приватная папка (колокация)
│   │   │   │   └── actions.ts
│   │   │   └── layout.tsx
│   │   └── api/
│   │       ├── trpc/[trpc]/
│   │       │   └── route.ts
│   │       └── webhooks/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                # shadcn/ui компоненты
│   │   ├── layout/
│   │   └── features/
│   ├── server/
│   │   ├── api/               # tRPC роутеры
│   │   ├── db/                # Drizzle схемы
│   │   └── auth.ts            # NextAuth конфиг
│   ├── lib/
│   │   ├── utils.ts
│   │   └── schemas/           # Zod схемы
│   ├── store/                 # Zustand стора
│   └── hooks/                 # React хуки
├── tests/
│   ├── unit/                  # Vitest
│   ├── integration/
│   └── e2e/                   # Playwright
├── drizzle/                   # Миграции
├── .env.local
└── next.config.ts
```

**TypeScript конфигурация:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "module": "esnext",
    "moduleResolution": "bundler",
    
    // Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    
    // Path Aliases
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/server/*": ["./src/server/*"]
    },
    
    "plugins": [{ "name": "next" }]
  }
}
```

**Валидация переменных окружения:**

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_GOOGLE_ID: z.string(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

## Устаревшие паттерны: что НЕ использовать

### React 19 — удалено:

❌ **forwardRef** → ✅ Используйте `ref` как prop  
❌ **PropTypes** → ✅ Используйте TypeScript  
❌ **defaultProps** для функций → ✅ ES6 дефолтные параметры  
❌ **Legacy Context API** → ✅ Modern Context API  

### Next.js 15 — breaking changes:

❌ **getServerSideProps/getStaticProps** → ✅ Server Components с async fetch  
❌ **next/head** → ✅ Metadata API  
❌ **Синхронные** `cookies()`, `headers()` → ✅ **Async** версии  
❌ **Дефолтное кеширование** GET маршрутов → ✅ Opt-in кеширование  

**Миграция синхронных APIs:**

```bash
npx @next/codemod@canary next-async-request-api .
```

**Устарело ❌:**
```typescript
import { cookies } from 'next/headers'

export default function Page() {
  const cookieStore = cookies()  // Синхронное
}
```

**Новый стандарт ✅:**
```typescript
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()  // Асинхронное
}
```

### Tailwind CSS 4.0 — breaking changes:

❌ **@tailwind directives** → ✅ `@import "tailwindcss"`  
❌ **JavaScript config** → ✅ CSS `@theme` блоки  
❌ **Sass/Less** → ✅ Нативный CSS (несовместимы с v4)  

### NextAuth v4 → v5:

❌ **getServerSession** → ✅ Универсальный `auth()`  
❌ **`@next-auth/*` адаптеры** → ✅ `@auth/*` адаптеры  
❌ **Конфигурация в API route** → ✅ Корневой `auth.ts`  

## Performance оптимизации: критические паттерны

**1. Partial Prerendering для мгновенной загрузки:**

```typescript
export const experimental_ppr = true

export default function ProductPage() {
  return (
    <>
      <ProductInfo />  {/* Статичное - мгновенно */}
      <Suspense fallback={<CartSkeleton />}>
        <ShoppingCart />  {/* Динамичное - стримится */}
      </Suspense>
    </>
  )
}
```

**2. Параллельная загрузка данных:**

```typescript
// ❌ Плохо - водопад запросов
const user = await fetchUser()
const posts = await fetchPosts(user.id)  // Ждет user

// ✅ Хорошо - параллельно
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPosts(),
])
```

**3. Streaming с Suspense boundaries:**

```typescript
export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>  {/* Рендерится сразу */}
      
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Analytics />  {/* Стримится по готовности */}
      </Suspense>
      
      <Suspense fallback={<ChartSkeleton />}>
        <Chart />  {/* Стримится параллельно */}
      </Suspense>
    </div>
  )
}
```

**4. Image оптимизация:**

```typescript
import Image from 'next/image'

// Приоритет для LCP изображения
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // Предзагрузить
/>

// Responsive изображения
<Image
  src="/banner.jpg"
  alt="Banner"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  style={{ objectFit: 'cover' }}
/>
```

**5. Bundle size оптимизация:**

```typescript
// ❌ Плохо - импортирует всю библиотеку
import _ from 'lodash'

// ✅ Хорошо - tree-shakeable
import { debounce } from 'lodash-es'

// Dynamic imports для тяжелых компонентов
const HeavyChart = dynamic(() => import('react-chartjs-2'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
})
```

## Security best practices

**1. Server Actions - всегда валидируйте:**

```typescript
'use server'
import { z } from 'zod'
import { auth } from '@/server/auth'

const schema = z.object({
  title: z.string().min(3),
  content: z.string(),
})

export async function createPost(formData: FormData) {
  // 1. Аутентификация
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  
  // 2. Валидация
  const validated = schema.parse({
    title: formData.get('title'),
    content: formData.get('content'),
  })
  
  // 3. Авторизация (если нужно)
  // 4. Выполнение
  await db.insert(posts).values({
    ...validated,
    authorId: session.user.id,
  })
  
  revalidatePath('/posts')
}
```

**2. Environment variables - разделяйте публичные и приватные:**

```bash
# Public (доступны в браузере) - префикс NEXT_PUBLIC_
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://myapp.com

# Private (только сервер) - БЕЗ префикса
DATABASE_URL=postgresql://...
AUTH_SECRET=<32+ символов>
AUTH_GOOGLE_SECRET=<secret>
```

**3. Database connection security:**

```typescript
// Используйте Drizzle с connection pooling
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Максимум соединений
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export const db = drizzle(pool, { schema })
```

**4. CSRF защита (встроена в NextAuth v5):**

NextAuth.js v5 автоматически защищает от CSRF через "double submit cookie" метод. Server Actions также имеют встроенную CSRF защиту.

## Testing: Vitest + Playwright стратегия

**Unit тесты (Vitest + React Testing Library):**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
})

// tests/unit/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from '@/components/ui/Button'

test('Button рендерится с правильным текстом', () => {
  render(<Button>Нажми меня</Button>)
  expect(screen.getByRole('button', { name: 'Нажми меня' })).toBeInTheDocument()
})
```

**E2E тесты (Playwright):**

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})

// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('пользователь может войти в систему', async ({ page }) => {
  await page.goto('/login')
  
  await page.fill('input[name="email"]', 'user@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

## Ключевые выводы: что использовать в 2025

### ✅ ИСПОЛЬЗУЙТЕ:

**React 19:**
- Actions с useActionState для форм
- useOptimistic для мгновенных UI обновлений
- use() hook для условного чтения промисов
- ref as prop вместо forwardRef
- Server Components как основа архитектуры

**Next.js 15:**
- Server Components по умолчанию
- Server Actions для мутаций
- Async версии cookies(), headers(), params
- Partial Prerendering для производительности
- after() API для фоновых задач
- HydrationBoundary для prefetch с TanStack Query

**Drizzle ORM:**
- Identity columns для primary keys
- Date mode для timestamps (10-15% быстрее)
- Prepared statements для частых запросов (100x быстрее)
- Partial indexes для фильтрованных запросов (275x быстрее)
- Edge-совместимые драйверы (Neon, Vercel Postgres)

**Tailwind CSS 4:**
- CSS-first конфигурация через @theme
- Container queries для адаптивности компонентов
- Нативные CSS переменные
- Автоматическая миграция с npx @tailwindcss/upgrade

**State Management:**
- TanStack Query v5 для server state
- Zustand для client state
- Четкое разделение ответственности
- Context pattern для Zustand в App Router

**Аутентификация:**
- NextAuth.js v5 с универсальным auth() методом
- JWT strategy для edge compatibility
- Централизованный auth.ts конфиг

### ❌ НЕ ИСПОЛЬЗУЙТЕ:

- forwardRef (удален в React 19)
- PropTypes, defaultProps для функций (удалены)
- getServerSideProps/getStaticProps (используйте Server Components)
- Синхронные cookies()/headers() (теперь async)
- @tailwind directives (используйте @import "tailwindcss")
- JavaScript конфиг для Tailwind (используйте CSS @theme)
- getServerSession (используйте auth())
- 'use client' везде (используйте селективно)

## Быстрый старт: полная настройка за 10 минут

```bash
# 1. Создать Next.js 15 проект
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app

# 2. Установить зависимости
npm install next-auth@beta drizzle-orm @tanstack/react-query zustand
npm install -D drizzle-kit vitest @testing-library/react playwright

# 3. Инициализировать shadcn/ui
npx shadcn@latest init

# 4. Добавить компоненты
npx shadcn@latest add button form dialog

# 5. Настроить Drizzle
npx drizzle-kit init

# 6. Сгенерировать AUTH_SECRET
npx auth secret

# 7. Запустить dev сервер
npm run dev
```

Этот стек представляет собой **production-ready архитектуру 2025 года** с акцентом на производительность, type-safety и developer experience. Server Components радикально меняют подход к разработке, делая приложения быстрее и проще в поддержке.