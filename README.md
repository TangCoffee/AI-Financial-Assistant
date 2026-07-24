# 💰 智能财务教练 — Personal Finance Coach

> AI 驱动的个人财务管理平台，支持收支记录、储蓄目标追踪，集成 DeepSeek 智能对话助手，提供个性化财务建议。

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4)](https://tailwindcss.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-5C6BC0)](https://orm.drizzle.team/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 功能特性

### 🔐 用户认证
- JWT 无状态认证（`jose` 库）
- 密码 bcrypt 加密存储
- Token 过期自动跳转登录页

### 📊 交易管理
- 手动添加 / 编辑 / 删除交易记录
- **导入功能**：支持微信账单.xlsx导入，自动过滤重复记录

### 🎯 储蓄目标
- 两种目标类型：
  - **积攒目标**：从0开始积攒，手动存入金额，进度条展示存入/目标比
  - **剩余目标**：基于当前余额自动计算可支配金额，超支变红提示
- 创建剩余目标表单自动填入当前余额，日期禁止选「今日之前」

### 📈 仪表盘
- 收支趋势折线图（Recharts）
- 智能财务建议：基于用户总收支、最新目标构建上下文，利用Prompt提出精准建议
- 目标追踪卡片：可以在主页选择目标进行追踪，小建议与目标保持一致
- 结余卡片：若有已经存入积攒目标的部分，结余卡片下方会提示你的自由资金，提醒用户

### 💬 AI 对话助手
- 流式响应（DeepSeek API + OpenAI SDK）
- 单例模式管理客户端

### 🎨 界面体验
- 明暗主题切换（shadcn/ui + Tailwind v4）
- 响应式布局，适配移动端
- 20+ 通用 UI 组件（基于 Radix UI）

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router), React 19 |
| 样式 | Tailwind CSS v4, shadcn/ui, Radix UI |
| 图表 | Recharts |
| 后端 | Next.js API Routes, Drizzle ORM |
| 数据库 | PostgreSQL |
| 认证 | JWT (jose), bcryptjs |
| AI | OpenAI SDK (DeepSeek API) |
| 构建工具 | Turbopack |
| 语言 | TypeScript |
| 工具链 | Drizzle Kit, ESLint |

---

## 🚀 快速开始

### 环境要求 
- Node.js 18+
- PostgreSQL 14+
- pnpm (推荐) 或 npm

### 克隆 & 安装
```bash
git clone https://github.com/your-username/finance-coach.git
cd finance-coach
pnpm install

### 关键配置的结构在.env.example文件中，请对照修改
