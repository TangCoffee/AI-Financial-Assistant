import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';

// 从描述中提取微信交易单号
function extractTradeNo(desc: string | null): string | null {
  if (!desc) return null;
  const match = desc.match(/【微信交易单号:(.*?)】/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: '未登录或 token 已过期' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { transactions: importData } = body;

    if (!Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json({ message: '无交易数据' }, { status: 400 });
    }

    // 查询当前用户已有记录
    const existing = await db
      .select({
        date: transactions.date,
        amount: transactions.amount,
        description: transactions.description,
      })
      .from(transactions)
      .where(eq(transactions.user_id, user.id));

    const existingTradeNos = new Set<string>();
    const existingOldKeys = new Set<string>();

    for (const tx of existing) {
      const tradeNo = extractTradeNo(tx.description);
      if (tradeNo) {
        existingTradeNos.add(tradeNo);
      } else {
        // 没有单号的老数据，用旧方法去重
        const dateStr =
          tx.date instanceof Date
            ? tx.date.toISOString().split('T')[0]
            : String(tx.date).split('T')[0];
        const key = `${dateStr}_${tx.amount}_${(tx.description || '').slice(0, 20)}`;
        existingOldKeys.add(key);
      }
    }

    // 过滤重复记录
    const toImport = importData.filter((tx: any) => {
      // 优先用交易单号去重
      if (tx.tradeNo && existingTradeNos.has(tx.tradeNo)) {
        return false;
      }
      // 无单号则降级为旧方法
      if (!tx.tradeNo) {
        const key = `${tx.date}_${Math.abs(tx.amount)}_${(tx.description || '').slice(0, 20)}`;
        if (existingOldKeys.has(key)) return false;
        existingOldKeys.add(key);
      }
      return true;
    });

    if (toImport.length === 0) {
      return NextResponse.json(
        { message: '所有记录已存在，无需重复导入' },
        { status: 409 }
      );
    }

    // 批量插入
    const values = toImport.map((tx: any) => ({
      user_id: user.id,
      date: tx.date,
      amount: String(Math.abs(tx.amount)),
      type: tx.amount >= 0 ? 'income' : 'expense',
      category: tx.category || '其他',
      description: tx.description || null,
      source: 'wechat',
    }));

    await db.insert(transactions).values(values);

    return NextResponse.json({
      success: true,
      count: toImport.length,
      duplicate: importData.length - toImport.length,
    });
  } catch (error) {
    console.error('导入失败:', error);
    return NextResponse.json({ message: '导入失败' }, { status: 500 });
  }
}