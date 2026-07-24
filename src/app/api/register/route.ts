import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {

    try {
        //    获取请求数据
        const body = await request.json()
  
        const { email, name, password } = body
        //    验证请求数据
        if (!email || !password) {
            return NextResponse.json({
                status: 400,
                message: 'email or password is required'
            })
        }

        //    密码长度限制
        if (password.length < 8 || password.length > 20) {
            return NextResponse.json({
                status: 400,
                message: 'password must be at least 8 characters long'
            })
        }

        //    检查邮箱是否注册
        const [existingUser] = await db.select().from(users).where(eq(users.email, email))

        if (existingUser) {
            return NextResponse.json({
                status: 400,
                message: 'email already registered'
            })
        }

        //    处理密码
        const hashedPassword = await hashPassword(password)

        // 注册用户到数据库
        const [newUser] = await db.insert(users).values({
            email,
            name,
            password: hashedPassword,
        })
            .returning()

        // 返回注册成功的响应
        return NextResponse.json({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            create_at: newUser.create_at,
        })
    } catch (error) {
        console.error('Error registering user:', error)
        return NextResponse.json({
            status: 500,
            message: 'internal server error'
        })
    }

}
