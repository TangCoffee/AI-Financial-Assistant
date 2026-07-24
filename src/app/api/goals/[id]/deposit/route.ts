import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals, transactions } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-utils';
import { eq, and, sql } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ message: '未登录' }, { status: 401 });

  const { id } = await params;
  const goalId = parseInt(id);
  if (isNaN(goalId)) return NextResponse.json({ message: '无效ID' }, { status: 400 });

  const { amount } = await req.json();
  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return NextResponse.json({ message: '金额必须为正数' }, { status: 400 });
  }

  // 查询目标
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!goal || goal.user_id !== user.id) {
    return NextResponse.json({ message: '目标不存在' }, { status: 404 });
  }
  if (goal.type !== '积攒目标') {
    return NextResponse.json({ message: '仅积攒目标可存入' }, { status: 400 });
  }

  // 计算用户当前总余额
  const userTransactions = await db
    .select({ amount: transactions.amount, type: transactions.type })
    .from(transactions)
    .where(eq(transactions.user_id, user.id));

  let totalBalance = 0;
  for (const tx of userTransactions) {
    const amt = Number(tx.amount);
    if (tx.type === 'income') totalBalance += amt;
    else totalBalance -= amt;
  }

  // 检查是否会超出总余额
  const currentSaved = Number(goal.current_amount) || 0;
  if (currentSaved + depositAmount > totalBalance) {
    return NextResponse.json(
      { message: `存入金额不能超过可用余额（当前总余额 ${totalBalance.toFixed(2)}，已存 ${currentSaved.toFixed(2)}）` },
      { status: 400 }
    );
  }

  // 累加
  const newCurrent = currentSaved + depositAmount;
  await db.update(goals)
    .set({ current_amount: String(newCurrent) })
    .where(eq(goals.id, goalId));

  return NextResponse.json({ success: true, current_amount: newCurrent });
}