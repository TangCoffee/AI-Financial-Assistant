import OpenAI from 'openai';
import { db } from '@/db';
import { transactions, goals } from '@/db/schema';
import { and, eq, sql, desc } from 'drizzle-orm';

let client: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    client = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL,
    });
  }
  return client;
}

export async function buildUserContext(userId: number, trackedGoalId?: string) {
  const [incomeResult] = await db
    .select({ total: sql`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(and(eq(transactions.user_id, userId), eq(transactions.type, 'income')));

  const [expenseResult] = await db
    .select({ total: sql`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(and(eq(transactions.user_id, userId), eq(transactions.type, 'expense')));

  const income = Number(incomeResult?.total || 0);
  const expense = Number(expenseResult?.total || 0);
  const balance = income - expense;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const categoryExpenses = await db
    .select({
      category: transactions.category,
      total: sql`COALESCE(SUM(amount), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.user_id, userId),
        eq(transactions.type, 'expense'),
        sql`${transactions.date} >= ${dateStr}`
      )
    )
    .groupBy(transactions.category)
    .orderBy(desc(sql`SUM(amount)`))
    .limit(5);

  const allGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.user_id, userId))
    .orderBy(desc(goals.create_at));

  let context = `【财务概况】
总收入：${income}元
总支出：${expense}元
当前结余：${balance}元\n`;

  if (categoryExpenses.length > 0) {
    context += `\n【主要支出分类（近30天）】\n`;
    categoryExpenses.forEach((cat: any) => {
      context += `${cat.category}：${Number(cat.total)}元\n`;
    });
  }

  if (allGoals.length > 0) {
    context += `\n【财务目标】\n`;
    allGoals.forEach((goal: any) => {
      const isTracked = trackedGoalId && String(goal.id) === String(trackedGoalId);
      const prefix = isTracked ? '★' : '  ';
      const today = new Date();
      const deadline = goal.deadline ? new Date(goal.deadline) : null;
      const remainingDays = deadline
        ? Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 86400)))
        : null;

      if (goal.type === '积攒目标') {
        const need = Number(goal.target_amount) - Number(goal.current_amount);
        const dailySave = remainingDays && remainingDays > 0
          ? (need / remainingDays).toFixed(2)
          : null;
        context += `${prefix}[积攒] ${goal.title}：目标${Number(goal.target_amount)}元，已存${Number(goal.current_amount)}元，还需${need}元`;
        if (dailySave) context += `，每日需存${dailySave}元`;
        if (deadline) context += `，截止${goal.deadline}（剩${remainingDays}天）`;
        context += `\n`;
      } else if (goal.type === '剩余目标') {
        const diff = balance - Number(goal.target_amount);
        const status = diff >= 0 ? '安全' : '超支';
        context += `${prefix}[剩余] ${goal.title}：保留${Number(goal.target_amount)}元，当前余额${balance}元，${status}`;
        if (diff >= 0) {
          context += `，可支配${diff}元`;
        } else {
          context += `，超支${Math.abs(diff)}元`;
        }
        if (deadline) context += `，截止${goal.deadline}（剩${remainingDays}天）`;
        context += `\n`;
      }
    });
  } else {
    context += `\n【财务目标】暂无目标\n`;
  }

  return context;
}