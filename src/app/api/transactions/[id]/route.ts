import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-utils';
import { eq, desc, and } from 'drizzle-orm';


// 修改交易
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // 验证当前用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
        return NextResponse.json({
            message: '未登录或 token 已过期'
        }, { status: 401 })
    }

    const { id } = await params
    console.log('修改交易 ID:', id)
    const transactionId = parseInt(id)

    if (isNaN(transactionId)) {
        return NextResponse.json({
            message: '无效的交易 ID'
        }, { status: 400 });
    }
    try {
        const [existing] = await db
            .select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))

        if (!existing) {
            return NextResponse.json({
                message: '交易不存在 无法修改'
            }, { status: 404 });
        }


        const body = await request.json()
        const updateData: Record<string, any> = {}

        // 只更新 提供的字段
        const { type, category, amount, description, source, date } = body

        if (type) {
            updateData['type'] = type
        }
        if (category) {
            updateData['category'] = category
        }
        if (amount) {
            updateData['amount'] = amount.toString()
        }
        if (description) {
            updateData['description'] = description
        }
        if (source) {
            updateData['source'] = source
        }
        if (date) {
            updateData['date'] = date
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                message: '请提供要修改的字段'
            }, { status: 400 });
        }

        const [updated] = await db
            .update(transactions)
            .set(updateData)
            .where(eq(transactions.id, transactionId))
            .returning()

        return NextResponse.json({
            ...updated,
            amount: Number(updated.amount),
        })

    } catch (error) {
        console.error('修改交易失败:', error);
        return NextResponse.json({
            message: '修改交易失败'
        },{status:500});
    }

}

// 删除交易记录
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ detail: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
        return NextResponse.json({ detail: '无效的交易 ID' }, { status: 400 });
    }

    try {
        // 查询交易是否存在且属于当前用户
        const [existing] = await db
            .select()
            .from(transactions)
            .where(and(eq(transactions.id, transactionId), eq(transactions.user_id, user.id)));

        if (!existing) {
            return NextResponse.json({ detail: '交易记录不存在' }, { status: 404 });
        }

        await db
            .delete(transactions)
            .where(eq(transactions.id, transactionId));

        return NextResponse.json({ status: 200, message: '交易记录删除成功' });
    } catch (error) {
        console.error('删除交易失败:', error);
        return NextResponse.json({ detail: '删除失败' }, { status: 500 });
    }
}

