

## 掌握技能

### 前端开发
- **React 19 + Next.js 16 (App Router)** — 服务端组件、API Routes、中间件、布局系统
- **shadcn/ui + Radix UI** — 基于无障碍原语的组件库搭建与定制
- **Tailwind CSS v4** — 原子化样式、响应式布局、暗色主题
- **Recharts** — 交互式财务数据可视化图表
- **Lucide React** — 统一图标系统

### 后端开发
- **Next.js API Routes** — RESTful 接口设计与实现
- **Drizzle ORM + PostgreSQL** — 数据库 Schema 设计、迁移、查询
- **JWT (jose)** — 无状态认证与鉴权中间件
- **bcryptjs** — 密码安全哈希存储
- **Prompt Engineering** — 构建用户财务上下文，优化 AI 对话质量

### AI 与 API 集成
- **OpenAI SDK** — DeepSeek API 调用与流式响应处理
- **单例模式** — 大模型客户端全局唯一实例管理

### 工程化 & AI 辅助开发
- **TypeScript** — 全栈类型安全
- **Turbopack** — 高性能构建与热更新
- **Drizzle Kit** — 数据库迁移管理与版本控制
- **Vibe Coding** — 熟练使用 **Claude Code**、**Cursor** 等 AI 编程工具驱动开发全流程：需求分析 → 代码生成 → Debug → 重构 → 代码审查，大幅提升开发效率

---

## 项目经历

### 智能财务教练 — AI 驱动的个人财务管理平台


**项目简介**  
一个面向个人的智能财务管理平台，支持收支记录、储蓄目标追踪，并集成 AI 对话教练提供个性化财务建议。前后端全栈使用 TypeScript 构建。

**技术栈**  
`Next.js 16 (App Router)` `React 19` `TypeScript` `Tailwind CSS v4` `shadcn/ui`  
`PostgreSQL` `Drizzle ORM` `JWT (jose)` `bcryptjs`  
`DeepSeek API (OpenAI SDK)` `Recharts` `Turbopack`

**核心职责与成果**

#### 后端开发
- **数据库设计**：使用 PostgreSQL + Drizzle ORM 设计三张核心业务表（用户、交易记录、储蓄目标），建立外键关联与约束
- **认证系统**：基于 JWT（jose 库）实现注册/登录无状态认证，使用 bcryptjs 进行密码加密存储，保障用户数据安全
- **RESTful API**：实现交易 CRUD、储蓄目标 CRUD、用户信息管理等完整接口
- **AI 对话引擎**：
  - 通过 OpenAI SDK 集成 DeepSeek API，实现智能财务顾问对话功能
  - 运用 **Prompt Engineering** 构建用户财务上下文（总收入、总支出、最新目标），使 AI 回答更具个性化
  - 采用**单例模式**管理大模型客户端，确保全局唯一实例，避免资源浪费

#### 前端开发
- **响应式仪表盘**：使用 shadcn/ui 构建现代化响应式界面，支持明暗主题切换
- **数据可视化**：使用 Recharts 实现收支趋势、分类占比等统计图表
- **AI 聊天界面**：消息气泡式交互设计，支持流式响应展示
- **分层架构**：构建独立的请求库层，封装 API 调用与响应数据处理，实现视图层与业务层的清晰分离
- **UI 组件库**：基于 Radix UI 无障碍原语封装 20+ 通用组件（按钮、对话框、选择器、下拉菜单等）

#### 工程实践
- 使用 Turbopack 作为构建工具，提升开发热更新效率
- 全项目 TypeScript 覆盖，保障类型安全
- Drizzle Kit 管理数据库迁移，支持 Schema 版本控制
- 前后端统一技术栈，降低上下文切换成本
- 运用 **Claude Code + Cursor** 进行 Vibe Coding 开发，涵盖需求分析、代码生成、Bug 调试、代码重构与审查全流程




