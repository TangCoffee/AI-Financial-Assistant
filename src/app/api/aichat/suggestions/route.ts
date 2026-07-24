import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, buildUserContext } from '@/lib/openai';
import { getCurrentUser } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
    const user = await getCurrentUser(request);
    if (!user) {
        return NextResponse.json({ message: '未登录或 token 已过期' }, { status: 401 });
    }

    try {
        const client = getOpenAIClient();
        if (!client) {
            return NextResponse.json({ message: 'OpenAI 客户端未初始化' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const trackedGoalId = searchParams.get('trackedGoalId') || undefined;

        const context = await buildUserContext(user.id, trackedGoalId);

        if (!context || context === '暂无财务数据') {
            return NextResponse.json({ suggestions: '开始记账，我能帮你分析！' });
        }

        const prompt = `
你是用户的财务教练。根据以下数据，用一句 30 字左右的建议。
数据包含总收入、总支出、结余、近30天支出分类，以及财务目标（带★为追踪目标，包含类型、目标金额、已存/当前余额等）。

要求：
- 若★追踪目标为“积攒目标”：计算每日需存金额，给出“XX目标每天存XX元”的行动建议。
- 若★追踪目标为“剩余目标”：若安全则说“剩余XX元可支配，可控制XX支出”，若超支则说“已超支XX元，建议减少XX支出”。
- 若无★目标但有其他目标：优先针对第一个积攒目标或剩余目标给出同类建议。
- 同时结合支出分类提出一个具体优化动作（如减少外卖、控制购物等）。
- 语气简洁，直接说建议，不要解释。

数据：
${context}

示例：
- 买房首付日存67元，午餐带饭每月省200元。
- 应急金已超支500元，暂停网购，日支出限80元。
- 旅行基金剩余1500元可支配，减少打车可多存300元。
- 暂无目标，建议创建"旅行基金"日存50元。

你的建议：
`;

        const response = await client.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
            messages: [
                { role: "system", content: process.env.DEEPSEEK_SYSTEM_PROMPT || "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });

        const suggestions = response.choices[0]?.message?.content?.trim()||"建议您坚持「50/30/20」预算法则：50%用于必要支出，30%用于弹性支出，20%用于储蓄和投资。";

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('获取 AI 建议失败:', error);
        return NextResponse.json({ message: '获取 AI 建议失败' }, { status: 500 });
    }
}