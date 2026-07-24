import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, buildUserContext } from '@/lib/openai';
import { getCurrentUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ message: '未登录或 token 已过期' }, { status: 401 });
  }

  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ message: '消息不能为空' }, { status: 400 });
    }

    const client = getOpenAIClient();
    if (!client) {
      return NextResponse.json({ message: 'OpenAI 客户端未初始化' }, { status: 500 });
    }

    // 构建用户财务上下文
    const context = await buildUserContext(user.id);

    // 优化后的 Prompt（赋予 AI 角色，明确回答规范）
    const prompt = `
你是一位专业的财务顾问 AI。用户向你提问，请基于以下财务数据回答。

数据：
${context}

用户问题：${message}

回答要求：
1. 直接回答用户问题，基于数据给出具体数字和建议。
2. 如果用户问的是“如何省钱/存钱”，给出分步行动计划。
3. 如果用户问的是“某类支出是否合理”，对比历史数据或预算给出判断。
4. 语气专业、友善，鼓励用户改善财务健康。
5. 如果问题与财务数据无关，礼貌告知“我专注于财务建议，请提供相关财务问题”。

回答不要超过 200 字，简洁明了。
`;

    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      messages: [
        { role: "system", content: "你是一位专业的财务顾问 AI，擅长基于用户财务数据提供个性化建议。" },
        { role: "user", content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content?.trim() || '暂无建议';

    return NextResponse.json({
      message: '获取 AI 对话成功',
      data: reply
    }, { status: 200 });

  } catch (error) {
    console.error('获取 AI 对话失败:', error);
    return NextResponse.json({
      message: '获取 AI 对话失败'
    }, { status: 500 });
  }
}