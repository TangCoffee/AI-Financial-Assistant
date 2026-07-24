import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')

// 创建token
export async function createToken(payload: {sub:string}) {
    // 创建JWT实例
    const jwt = new SignJWT(payload)
    
    const token = await jwt
    .setProtectedHeader({ alg: process.env.JWT_ALGORITHM || ''  }) // 设置签名算法
    .setIssuedAt() // 设置签发时间
    .setExpirationTime(process.env.TOKEN_EXPIRES_IN || '1h') // 设置过期时间
    .sign(secret) // 签名JWT： token

    return token
}

// 验证token
export async function verifyToken(token: string) {
     // 如果 JWT 无效，抛出错误
    const { payload } = await jwtVerify(token, secret)
    return payload
}

