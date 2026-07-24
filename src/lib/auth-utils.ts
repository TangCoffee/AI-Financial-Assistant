import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/** 从请求中提取 Bearer token（优先 Authorization header，其次 cookie） */
export function extractToken(request: NextRequest) {
    // 优先从 Authorization header 获取
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7)
    }
    // 其次从 cookie 获取
    const cookieToken = request.cookies.get('token')?.value
    if (cookieToken) return cookieToken

    throw new Error('token请求头无效 或 token 格式错误')
}

/** 从请求中解析当前登录用户，未认证返回 null */
export async function getCurrentUser(request: NextRequest) {
    try {
        const token = extractToken(request)
        if (!token) return null;

        //   验证token
        let payload: { sub?: string };
        payload = await verifyToken(token)

        //    从token中获取用户邮箱
        const email = payload.sub || ''
        if (!email) {
            return null;
        }

        //    从数据库中查询用户
        const [existingUser] = await db.select().from(users).where(eq(users.email, email))
        if (!existingUser) {
            return null;
        }

        return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
        };

    } catch (error) {
        return null;
    }
}

/** 从请求中解析当前登录用户，未认证返回 401 Response */
export async function requireUser(request: NextRequest) {
    const user = await getCurrentUser(request)
    if (!user) {
        return NextResponse.json({
            status: 401,
            message: '未登录或 token 已过期'
        })
    }
    return NextResponse.json(user)
}

