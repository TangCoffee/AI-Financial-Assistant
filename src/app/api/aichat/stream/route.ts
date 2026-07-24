import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, buildUserContext } from '@/lib/openai';
import { getCurrentUser } from '@/lib/auth-utils';


// AI 智能财务教练对话-流式输出
export async function POST(request: NextRequest) {
    // 验证当前用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
        return NextResponse.json({
            message: '未登录或 token 已过期'
        }, { status: 401 })
    }

    try {
        const { message } = await request.json();
        if (!message) {
            return NextResponse.json({
                message: '消息不能为空'
            }, { status: 400 });
        }

        const client = getOpenAIClient();
        if (!client) {
            return NextResponse.json({
                message: 'OpenAI 客户端未初始化'
            }, { status: 500 });
        }

        // 构建用户财务上下文
        const context = await buildUserContext(user.id);

        // 构建 prompt 提示词
        const prompt = `基于以下财务数据：${context}。
                         用户的问题：${message}。回答用户的问题。`;

        const response = await client.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
            messages: [
                { role: "system", content: process.env.DEEPSEEK_SYSTEM_PROMPT || "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            stream: true // 开启流式输出
        });

        // SSE : server- end event stream
        const stream = new ReadableStream({
            async start(controller) {

                try {

                    for await (const chunk of response) {
                        // 处理每个 chunk, 向流中推送数据块

                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            // SSE 协议 ：每个数据块前添加 data: 前缀，以\n\n结尾
                            const data = `data: ${JSON.stringify({content})}\n\n`
                            const encodeData = new TextEncoder().encode(data);
                            controller.enqueue(encodeData);
                        }
                    }

                    // 发送完成信号 ：data: [DONE]\n\n 结束标记
                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                } catch (error) {
                    console.error('处理流数据失败:', error);
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                        error: "处理流数据失败"
                    })}\n\n`));
                } finally {
                    controller.close();
                }

            }
        });


        return new Response(stream, { 
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache', 
                'Connection': 'keep-alive'
            }
        });

        // return new NextResponse(stream, { status: 200 });

    } catch (error) {
        console.error('获取 AI 对话失败:', error);
        return NextResponse.json({
            message: '获取 AI 对话失败'
        }, { status: 500 });
    }


}