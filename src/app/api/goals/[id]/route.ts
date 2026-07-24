import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { goals } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth-utils';
import { eq, desc, and } from 'drizzle-orm';


// 修改目标
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // 验证当前用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
        return NextResponse.json({
            message: '未登录或 token 已过期'
        },{status:401})
    }

    const { id } = await params
    console.log('修改目标 ID:', id)
    const goalId = parseInt(id)

    if (isNaN(goalId)) {
        return NextResponse.json({
            message: '无效的目标 ID'
        },{status:400});
    }

    try {
        const [existing] = await db
            .select()
            .from(goals)
            .where(eq(goals.id, goalId))

        if (!existing) {
            return NextResponse.json({
                message: '目标不存在 无法修改'
            },{status:404});
        }


        const body = await request.json()
        const updateData: Record<string, any> = {}


        // 只更新 提供的字段
        const { title, type, target_amount, current_amount, deadline } = body

        if (title !== undefined) {
            updateData['title'] = title
        }
        if (type !== undefined) {
            updateData['type'] = type
        }
        if (target_amount !== undefined) {
            updateData['target_amount'] = target_amount.toString()
        }
        if (current_amount !== undefined) {
            updateData['current_amount'] = current_amount.toString()
        }
        if (deadline !== undefined) {
            updateData['deadline'] = deadline
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({
                message: '请提供要修改的字段'
            },{status:400});
        }

        const [updated] = await db
            .update(goals)
            .set(updateData)
            .where(eq(goals.id, goalId))
            .returning()

        return NextResponse.json({
            ...updated,
            target_amount: Number(updated.target_amount),
            current_amount: Number(updated.current_amount),
        })

    } catch (error) {
        console.error('修改目标失败:', error);
        return NextResponse.json({
            message: '修改目标失败'
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
  const goalId = parseInt(id);

  if (isNaN(goalId)) {
    return NextResponse.json({ detail: '无效的目标 ID' }, { status: 400 });
  }

  try {
    // 查询交易是否存在且属于当前用户
    const [existing] = await db
      .select()
      .from(goals)
      .where(and(eq(goals.id, goalId), eq(goals.user_id, user.id)));

    if (!existing) {
      return NextResponse.json({ detail: '目标不存在' }, { status: 404 });
    }

    await db
    .delete(goals)
    .where(eq(goals.id, goalId));

    return NextResponse.json({ status: 200, message: '目标删除成功' });
  } catch (error) {
    console.error('删除目标失败:', error);
    return NextResponse.json({ detail: '删除目标失败' }, { status: 500 });
  }
}

