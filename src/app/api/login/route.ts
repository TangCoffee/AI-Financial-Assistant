import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword,comparePassword } from '@/lib/password';
import { createToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {

    try {
        //    获取请求数据
        const body = await request.json()

        const { email, password} = body

        //    验证请求数据
        if (!email || !password) {
            return NextResponse.json({
                status: 400,
                message: 'email or password is required'
            })
        }

        //    检查邮箱是否注册
        const [existingUser] = await db.select().from(users).where(eq(users.email, email))

        if (!existingUser) {
            return NextResponse.json({
                status: 400,
                message: 'email not registered'
            })
        }

        //    检查密码是否正确
        const isPasswordValid = await comparePassword(password, existingUser.password)

        if (!isPasswordValid) {
            return NextResponse.json({
                status: 400,
                message: 'password is incorrect'
            })
        }

        // token : 用于位置用户登录状态
        const token = await createToken({sub: existingUser.email})

        // 返回登录成功的响应
        return NextResponse.json({
            token,
            email: existingUser.email,
            name: existingUser.name,
        })
    } catch (error) {
        console.error('Error logging in user:', error)
        return NextResponse.json({
            status: 500,
            message: '登录失败，请稍后重试'
        })
    }

}
