import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-utils';
import { eq, desc, and } from 'drizzle-orm';


// 创建交易
export async function POST(request: NextRequest) {
    // 验证当前用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
        return NextResponse.json({
            message: '未登录或 token 已过期'
        },{status:401})
    }

    try {
        const body = await request.json()
        const { type, category, amount, description, source, date } = body

        if (!type || !['income', 'expense'].includes(type)) {
            return NextResponse.json({
                message: '类型必须是 income 或 expense'
            },{status:400});
        }

        if (!category) {
            return NextResponse.json({
                message: '分类不能为空'
            },{status:400});
        }

        if (amount == null || isNaN(Number(amount)) || Number(amount) <= 0) {
            return NextResponse.json({
                message: '金额必须是正数'
            },{status:400});
        }

        // 交易插入数据库
        const [tx] = await db
            .insert(transactions)
            .values({
                user_id: user.id,
                type,
                category,
                amount: amount.toString(),
                date: date || new Date().toISOString().split('T')[0],
                description: description || null,
                source: source || null
            })
            .returning()

        return NextResponse.json({
            ...tx,
            amount: Number(tx.amount),
        })

    } catch (error) {
        console.error('创建交易失败:', error);
        return NextResponse.json({
            message: '创建交易失败'
        },{status:500});
    }

}

// 获取交易列表
export async function GET(request: NextRequest) {
    // 验证当前用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
        return NextResponse.json({
            message: '未登录或 token 已过期'
        },{status:401})
    }


    try {

        // transactions.user_id 等于当前用户 id 
        // 方便后期 添加其他条件
        const conditions = [eq(transactions.user_id, user.id)];


        // 交易查询数据库
        const result = await db
            .select()
            .from(transactions)
            .where(and(...conditions)) // 且条件
            .orderBy(desc(transactions.date)); // desc 按日期降序排序

        const data = result.map((t) => ({
            ...t,
            amount: Number(t.amount),
        }));

        return NextResponse.json(data)

    } catch (error) {
        console.error('获取交易列表失败:', error);
        return NextResponse.json({
            message: '获取交易列表失败'
        },{status:500});
    }

}
