import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// 程序里的客户端
const client = postgres(process.env.DATABASE_URL!);

// drizzle 对client 包装，能有 schema 类型提示
export const db = drizzle(client, { schema });