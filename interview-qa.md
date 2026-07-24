# 面试答疑问题库 — 智能财务教练项目

> 基于项目代码与实际技术栈整理的常见面试问题及参考答案。
> 按技术领域分类，覆盖深度原理 + 项目实践。

---

## 目录

1. [Next.js 16 & App Router](#1-nextjs-16--app-router)
2. [React 19 & 前端架构](#2-react-19--前端架构)
3. [数据库 & Drizzle ORM](#3-数据库--drizzle-orm)
4. [认证与安全（JWT + bcrypt）](#4-认证与安全jwt--bcrypt)
5. [AI 集成 & OpenAI SDK](#5-ai-集成--openai-sdk)
6. [工程化 & Vibe Coding](#6-工程化--vibe-coding)
7. [全栈综合问题](#7-全栈综合问题)

---

## 1. Next.js 16 & App Router

### Q1. 为什么选择 Next.js 16 App Router 而不是 Pages Router？

**答：** App Router 是 Next.js 的下一代路由方案，核心优势：

- **服务端组件（RSC）默认**：组件默认在服务端渲染，减少客户端 JS 体积，提升首屏性能
- **布局系统（Layout）**：嵌套布局自动保持状态，多个页面共享 Header/Footer 时无需重复渲染
- **流式渲染（Streaming）**：利用 React Suspense 实现页面分块加载，慢接口不阻塞整体渲染
- **API Routes 与前端同目录**：本项目将 API 放在 `src/app/api/` 下，前后端代码在同一个项目中组织，维护成本低

本项目中，`layout.tsx` 作为全局布局包裹 ThemeProvider，所有页面共享主题切换能力，正是 App Router Layout 的典型使用场景。

### Q2. 项目中如何使用 API Routes？路由参数怎么处理？

**答：** Next.js 16 的 API Routes 通过文件系统约定路由。例如：

```
src/app/api/transactions/[id]/route.ts  →  PUT /api/transactions/:id
```

在 Next.js 16 中，`params` 从同步变为异步获取：

```typescript
export async function PUT(request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params  // 需要 await
    // ...
}
```

这一设计是为了支持流式渲染场景下的路由参数延迟解析，面试中常作为考点出现。

### Q3. 服务端组件和客户端组件怎么选择？

**答：** 核心原则：**能不标 `'use client'` 就不标**。

项目中：
- **服务端组件（默认）**：布局 `layout.tsx`、API Routes、数据获取逻辑
- **客户端组件**：需要交互的 UI，如 `SignupForm.tsx`（表单状态）、`Home` 页面的 `ThemeToggle`（useEffect + useState）

`ThemeToggle` 组件是一个很好的范例：
- 使用 `useState` 跟踪 `mounted` 状态，避免 SSR 时主题不匹配导致 hydration 报错
- 只在客户端运行 `useEffect(() => setMounted(true), [])`
- 未 mount 时只渲染无样式的占位按钮，避免闪烁

---

## 2. React 19 & 前端架构

### Q4. 项目的请求库是怎么封装的？为什么自己写而不是用 axios？

**答：** 在 `src/lib/request.ts` 中封装了一个轻量请求库，核心设计：

**统一管理：**
- Token 自动注入：从 `localStorage` 读取 token，自动写入 `Authorization: Bearer` 请求头
- 401 统一处理：token 过期时自动清除本地认证信息，防止无效请求继续发出
- 错误统一格式化：无论后端返回什么格式的错误，都提取 `message` 字段抛出

**分层设计：**
```
视图层（SignupForm） → 业务 API 层（auth-api.ts） → 请求库（request.ts） → fetch
```

- `auth-api.ts` 定义业务接口（`register`、`login`）
- `request.ts` 封装通用逻辑（token、header、异常处理）
- 视图层不直接操作 fetch，也不关心 token 怎么传

**选择原生 fetch 而非 axios 的原因：** 在 Next.js 环境中，fetch 原生支持请求缓存、ISR 增量静态生成等特性，且体积更小，对项目而言足够使用。

### Q5. 主题切换（亮/暗/系统）是怎么实现的？

**答：** 基于 `next-themes` + Tailwind CSS 实现：

**`layout.tsx` 配置：**
```typescript
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

- `attribute="class"`：通过切换 `<html>` 标签的 `class="dark"` 来控制主题
- `defaultTheme="system"`：默认跟随系统偏好
- `enableSystem`：允许通过 `prefers-color-scheme` 媒体查询检测系统主题

**`ThemeToggle` 组件交互：**
- 三个按钮：亮色（`light`）、暗黑（`dark`）、系统（`system`）
- 使用 `useTheme()` hook 读取和设置主题
- `useEffect` + `useState` 处理 hydration 匹配问题，避免 SSR 与客户端渲染不一致

> 面试扩展点：CSS 变量驱动的主题系统不需要 JS 运行时切换所有颜色，Tailwind v4 中通过 `@variant dark { ... }` 定义暗色变量即可。

---

## 3. 数据库 & Drizzle ORM

### Q6. 为什么选择 Drizzle ORM 而不是 Prisma 或 TypeORM？

**答：** Drizzle ORM 是一个"更像 SQL"的 TypeScript ORM，选择理由：

**优点：**
- **轻量无代码生成**：无需像 Prisma 那样运行 `prisma generate`，Schema 直接是 TypeScript 代码
- **SQL 优先**：查询语法贴近原生 SQL，比如 `.where(and(eq(transactions.user_id, userId), eq(transactions.type, 'income')))` 直接对应 `WHERE user_id = ? AND type = ?`
- **类型安全**：查询结果自动推断类型，无需额外类型定义
- **包体积小**：相比 Prisma，依赖更少，构建更快

**项目中的实践：**
```typescript
// src/db/index.ts - Drizzle 客户端初始化
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### Q7. 数据库表结构怎么设计的？为什么这样设计？

**答：** 三个核心表（完整代码见 `src/db/schema.ts`）：

| 表 | 核心字段 | 作用 |
|---|---|---|
| `users` | id, email, name, password, monthly_income, initial_balance, final_balance | 用户认证 + 财务状况 |
| `transactions` | id, user_id, type(income/expense), category, amount, date, description, source | 每一笔收支 |
| `goals` | id, user_id, title, target_amount, current_amount, deadline | 储蓄目标跟踪 |

**设计考量：**
- **用户与交易一对多**：一个用户有多条交易记录，用 `user_id` 外键关联
- **金额使用 `numeric(10,2)`**：避免浮点数精度问题，所有金额在返回前端时转为 `Number()`
- `type` 字段区分收入和支出，用 `varchar(20)` 枚举约束而不是单独建两张表，简化查询
- `transactions` 和 `goals` 通过 `user_id` 一起构成 AI 上下文的数据来源

### Q8. 项目中用了哪些 Drizzle 查询？举几个例子。

**答：** 主要用到以下几种操作：

```typescript
// 条件查询 + 排序（交易列表）
const result = await db.select()
  .from(transactions)
  .where(and(eq(transactions.user_id, user.id)))
  .orderBy(desc(transactions.date));

// 插入 + 返回（创建交易）
const [tx] = await db.insert(transactions)
  .values({ user_id: user.id, type, category, amount: amount.toString() })
  .returning();

// 更新指定字段（只更新提供的字段）
const [updated] = await db.update(transactions)
  .set(updateData)   // 动态构建更新对象
  .where(eq(transactions.id, transactionId))
  .returning();

// 聚合函数（AI 上下文构建）
const [result] = await db
  .select({ total: sql`COALESCE(SUM(amount), 0)` })
  .from(transactions)
  .where(and(eq(transactions.user_id, userId), eq(transactions.type, 'income')));
```

关键细节：所有金额存数据库时用 `amount.toString()` 转为字符串存入 `numeric` 字段，取出后用 `Number()` 还原，确保精度不丢失。

---

## 4. 认证与安全（JWT + bcrypt）

### Q9. JWT 认证流程是怎么实现的？

**答：** 认证流程分为三部分（代码分别位于 `src/lib/jwt.ts`、`src/lib/auth-utils.ts`、`src/app/api/login/route.ts`）：

**1. 登录签发 Token（jose 库）：**
```typescript
const token = await new SignJWT({ sub: user.email })
  .setProtectedHeader({ alg: process.env.JWT_ALGORITHM || 'HS256' })
  .setIssuedAt()
  .setExpirationTime(process.env.TOKEN_EXPIRES_IN || '1h')
  .sign(secret)  // secret 由 JWT_SECRET 环境变量编码而来
```

**2. 请求鉴权（Auth Middleware）：**
```typescript
// auth-utils.ts - 提取 Bearer Token
const authHeader = request.headers.get('Authorization')
const token = authHeader.slice(7)  // 去掉 "Bearer "

// 验证 token 并解析 payload
const { payload } = await jwtVerify(token, secret)
const email = payload.sub

// 从数据库查询用户
const [user] = await db.select().from(users).where(eq(users.email, email))
```

**3. 未认证统一返回 401：**
每个敏感接口都调用 `getCurrentUser(request)`，返回 null 时拒绝请求。

> 扩展考点：JWT 是无状态的，服务端不需要存储 session。缺点是一旦签发，在过期前无法主动撤销。对于需要登出能力的场景，可以配合黑名单机制（Redis 存储失效 token）。

### Q10. 密码怎么存储的？为什么？

**答：** 使用 `bcryptjs` 加盐哈希，而不是加密或明文存储。

```typescript
// hashPassword - 注册时哈希
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)  // 10 轮 salt
}

// comparePassword - 登录时比对
export async function comparePassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword)
}
```

**为什么是 bcrypt？**
- **不可逆**：哈希是单向函数，数据库泄露也无法还原原始密码
- **自动加盐**：每个密码的 salt 不同，相同密码的哈希值也不同，防彩虹表攻击
- **可调节强度**：`10` 表示 2^10 轮计算，未来硬件变强可以增加轮数

### Q11. 什么是 Bearer Token？为什么登录注册 API 不需要鉴权而交易 API 需要？

**答：** Bearer Token 是一种 HTTP 认证方式，持有 token 即代表拥有访问权限（Bearer = "持有者"）。

- **登录/注册不鉴权**：用户在登录前没有 token，这是用户获取身份的入口
- **交易/目标接口需鉴权**：涉及用户私有数据，必须通过 `getCurrentUser()` 验证身份，通过 `user.id` 隔离数据——用户只能操作自己的交易记录和目标

数据隔离的实现：
```typescript
// 只查询当前登录用户的交易
const conditions = [eq(transactions.user_id, user.id)];
const result = await db.select().from(transactions).where(and(...conditions));
```

---

## 5. AI 集成 & OpenAI SDK

### Q12. 怎么集成 DeepSeek API 的？为什么用 OpenAI SDK？

**答：** DeepSeek API 兼容 OpenAI 的接口格式，所以直接使用 `openai` 官方 SDK，只需修改 `baseURL`：

```typescript
const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL,  // DeepSeek 的 API 地址
});
```

这样做的优势：
- 利用 OpenAI SDK 成熟的类型定义和请求处理
- 未来如果需要切换到其他兼容 API（如 Claude、GPT），只需改环境变量
- 无需为 DeepSeek 单独封装请求

### Q13. 怎么构建 AI 财务对话上下文的？Prompt 怎么设计的？

**答：** 核心在 `src/lib/openai.ts` 的 `buildUserContext()` 函数：

**上下文构建流程：**

```
用户请求 → buildUserContext(userId) → 查询数据库聚合数据
  → 总收入 SUM(income) + 总支出 SUM(expense) + 最新财务目标
  → 拼接成自然语言文本 → 注入 Prompt → 发送给 DeepSeek API
```

**数据来源（两条 SQL 聚合查询 + 一条目标查询）：**
```typescript
const income = await db.select({ total: sql`COALESCE(SUM(amount), 0)` })
  .from(transactions)
  .where(and(eq(transactions.user_id, userId), eq(transactions.type, 'income')));

const expense = ... // 同上，type='expense'

const [latestGoal] = await db.select().from(goals)
  .where(eq(goals.user_id, userId))
  .orderBy(desc(goals.create_at)).limit(1);
```

**生成的上下文文本示例：**
```
用户的收入是：15000，支出是：8500。用户的最新财务目标是：攒钱买 MacBook，
目标金额是：20000，当前金额是：5000，截止时间是：2026-12-31。
```

**Prompt 结构：**
```
system: "你是一个专业的财务顾问"
user: "基于以下财务数据：{上下文}。用户的问题：{用户问题}。回答用户的问题。"
```

### Q14. 为什么 OpenAI 客户端要设计成单例模式？

**答：** 防止重复创建 API 客户端实例，浪费资源。

```typescript
let client: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey, baseURL: process.env.DEEPSEEK_BASE_URL,
    });
  }
  return client;
}
```

**面试扩展：** 在 Next.js 服务端，每次请求都会调用处理函数，如果没有单例，每次对话请求都会 `new OpenAI()`，在热加载（Turbopack）环境下甚至可能创建几十个实例。单例确保整个进程生命周期内只有一个客户端实例复用连接池。

### Q15. 两个 AI 接口分别有什么用？

**答：**
- **`POST /api/aichat`**（对话）— 接收用户消息，返回 AI 回复。用于聊天界面中的多轮交互
- **`GET /api/aichat/suggestions`**（建议）— 无需用户输入，直接根据财务数据生成一条 50 字内的简短建议。用于仪表盘首页展示每日财务建议

两者共享 `buildUserContext()` 和 `getOpenAIClient()`，区别在于 Prompt 和请求方式不同。

---

## 6. 工程化 & Vibe Coding

### Q16. 什么是 Vibe Coding？你在项目中怎么用的？

**答：** Vibe Coding 是指借助 AI 编程工具（Claude Code、Cursor 等）以对话驱动的开发方式，开发者描述需求，AI 生成代码，双方持续迭代。

**在本项目中的应用：**

| 阶段 | 具体使用 |
|---|---|
| 需求分析 | 用 Claude Code 分析 README 需求，拆解功能模块 |
| 代码生成 | 描述接口规范 → AI 生成 API Route + Schema + 前端组件 |
| Bug 调试 | 报错信息直接粘贴给 AI → 分析根因 → 生成修复方案 |
| 代码审查 | 用 `/code-review` 命令审查变更代码，发现潜在问题 |
| 文档编写 | 用 AI 生成 README、面试题库等文档内容 |

**价值：** 传统开发中，从"想法"到"代码"需要经过详细设计、查阅文档、手动编码。Vibe Coding 可以快速原型验证，开发者专注于架构决策和代码审查，而非重复 boilerplate 代码。

### Q17. TypeScript 在项目中提供了哪些好处？有没有遇到类型难题？

**答：** 具体收益：

1. **API 响应类型安全**：数据库查询结果自动推断类型，`amount: Number(tx.amount)` 的转换不会意外丢失字段
2. **请求参数约束**：`authApi.register(data: {email, password, name?})` 明确告知调用方需要传什么
3. **重命名安全**：修改数据库字段名时，所有引用处都会报错，不会漏改
4. **动态更新对象的类型处理**：

```typescript
// 只更新提供的字段，使用 Record<string, any>
const updateData: Record<string, any> = {}
if (title) updateData['title'] = title
// ...
```

这里用 `Record<string, any>` 是因为 Drizzle 的 `.set()` 接受动态对象，但在实际项目中可以进一步用 `Partial<typeof transactions.$inferInsert>` 替代 `any` 获得更精确的类型约束。

---

## 7. 全栈综合问题

### Q18. 从用户请求到 AI 回复的整体数据流是怎么走的？

**答：** 以"用户问 AI 财务建议"为例：

```
浏览器（聊天界面）
  → request.ts（读取 localStorage token，注入 Authorization header）
  → POST /api/aichat（Next.js API Route）

进入服务端：
  → getCurrentUser(request) → 解析 JWT → 查用户表 → 返回 user
  → buildUserContext(user.id)
      → SELECT SUM(amount) FROM transactions WHERE type='income'
      → SELECT SUM(amount) FROM transactions WHERE type='expense'
      → SELECT * FROM goals ORDER BY create_at DESC LIMIT 1
      → 拼接成文字上下文
  → 调用 DeepSeek API（OpenAI SDK 单例）
  → 返回 AI 回复 → JSON 响应回前端
```

### Q19. 如果让你对这个项目做性能优化或功能扩展，会怎么做？

**答：** 几个方向：

**性能优化：**
- **数据库索引**：在 `transactions.user_id`、`transactions.date` 上建立索引，加速查询和排序
- **响应缓存**：AI 建议接口（对同一用户的重复请求）可短时缓存，避免频繁调用 API 产生费用
- **数据分页**：交易列表如果数据量大，应该加分页查询，而不是一次性全量返回

**功能扩展：**
- **数据导出**：支持导出 CSV/PDF 的收支报表
- **预算管理**：为每个分类设置月度预算，超支时提醒
- **多轮对话记忆**：当前 AI 对话每次只传当前上下文，没有历史消息，未来可以加消息表持久化对话记录

### Q20. 项目开发中遇到的最大技术挑战是什么？怎么解决的？

**答（建议实际回忆自己的经历，以下是可参考的示例）：**

一个典型的挑战是 **金额精度处理**：
- 问题：PostgreSQL 中金额使用 `numeric` 类型，但 JS 中只有 `number`（浮点数），直接存取可能导致精度丢失
- 解决：存入时用 `amount.toString()` 转为字符串，取出时用 `Number()` 转回数字。所有金额操作都经过这个转换，避免中间计算链

另一个是 **AI 响应延迟**：DeepSeek API 调用可能有几秒的延迟，目前是同步等待，未来可以改成流式响应（`stream: true`），通过 Server-Sent Events 逐步返回 AI 回复，用户体验会更好。

---

## 附录：项目代码文件索引

> 面试官可能让你"打开某个文件看看"，提前熟悉文件位置。

| 功能 | 文件路径 |
|---|---|
| 数据库 Schema | `src/db/schema.ts` |
| Drizzle 客户端 | `src/db/index.ts` |
| JWT 签发/验证 | `src/lib/jwt.ts` |
| 密码哈希 | `src/lib/password.ts` |
| 认证工具函数 | `src/lib/auth-utils.ts` |
| OpenAI 客户端 + 上下文构建 | `src/lib/openai.ts` |
| 前端请求库 | `src/lib/request.ts` |
| 业务 API 层 | `src/lib/auth-api.ts` |
| 注册 API | `src/app/api/register/route.ts` |
| 登录 API | `src/app/api/login/route.ts` |
| 当前用户 API | `src/app/api/current_user/route.ts` |
| 交易 CRUD API | `src/app/api/transactions/route.ts` |
| 交易详情 API | `src/app/api/transactions/[id]/route.ts` |
| 目标 CRUD API | `src/app/api/goals/route.ts` |
| 目标详情 API | `src/app/api/goals/[id]/route.ts` |
| AI 对话 API | `src/app/api/aichat/route.ts` |
| AI 建议 API | `src/app/api/aichat/suggestions/route.ts` |
| 全局布局 | `src/app/layout.tsx` |
| 首页 | `src/app/page.tsx` |
| 注册页面 | `src/app/(auth)/signup/page.tsx` |
| 注册表单组件 | `src/components/SignupForm.tsx` |
| 主题切换组件 | `src/app/page.tsx` (ThemeToggle) |
