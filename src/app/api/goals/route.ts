import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-utils';
import { eq, desc, and } from 'drizzle-orm';


// 创建财务目标
export async function POST(request: NextRequest) {
    // 验证当前用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
        return NextResponse.json({
            message: '未登录或 token 已过期'
        }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { title, type ,target_amount, current_amount, deadline } = body

        if (!title || target_amount == null || target_amount === '') {
            return NextResponse.json({
                message: '标题和目标金额不能为空'
            }, { status: 400 });
        }

        // 目标插入数据库
        const [goal] = await db
            .insert(goals)
            .values({
                user_id: user.id,
                title,
                type,
                target_amount: target_amount.toString(),
                current_amount: (current_amount || 0).toString(),
                deadline: deadline || null
            })
            .returning()

        // return NextResponse.json(goal)
        return NextResponse.json({
            ...goal,
            target_amount: Number(target_amount),
            current_amount: Number(current_amount),
        })

    } catch (error) {
        console.error('创建目标失败:', error);
        return NextResponse.json({
            message: '创建目标失败'
        }, { status: 500 });
    }

}

// 获取目标列表
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
        const conditions = [eq(goals.user_id, user.id)];


        // 交易查询数据库
        const result = await db
            .select()
            .from(goals)
            .where(and(...conditions)) // 且条件
            .orderBy(desc(goals.create_at)); // desc 按日期降序排序


        const data = result.map((g) => ({
            ...g,
            target_amount: Number(g.target_amount),
            current_amount: Number(g.current_amount),
        }));

        return NextResponse.json(data)

    } catch (error) {
        console.error('获取目标列表失败:', error);
        return NextResponse.json({
            message: '获取目标列表失败'
        },{status:500});
    }

}
