import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {

    try {
        //    获取token
        const authHeader = await request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                message: 'token请求头无效 或 token 格式错误'
            },{status:401});
        }

        // const token = authHeader?.split(' ')[1]
          const token = authHeader.slice(7);

        //   验证token
        let payload: { sub?: string };
        try {
           payload = await verifyToken(token)
        } catch (error) {
            return NextResponse.json({
                message: 'token 验证失败'
            },{status:401});
        }


        //    从token中获取用户邮箱
        const email = payload.sub || ''
        if (!email) {
            return NextResponse.json({
                message: '无效token，未包含用户邮箱'
            },{status:401});
        }

        const [existingUser] = await db.select().from(users).where(eq(users.email, email))
        if (!existingUser) {
            return NextResponse.json({
                message: '用户不存在'
            },{status:401});
        }

        return NextResponse.json({
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            created_at: existingUser.create_at,
        })
    } catch (error) {
        console.error('Error logging in user:', error)
        return NextResponse.json({
            message: '登录失败，请稍后重试'
        },{status:500});
    }

}
