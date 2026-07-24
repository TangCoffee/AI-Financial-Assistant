import request from '@/lib/request'
import { ChatRequest } from '@/types/chat'



export const chatApi = {
    sendMessage: async (data: ChatRequest) => {
        return request.post("/aichat", data)
    },

    // ========== 获取智能财务建议 ==========
    getSuggestion: async () => {
        return request.get("/aichat/suggestions")
    },

    // ========== 流式获取智能财务建议 ==========
    sendMessageStream: async (
        data: ChatRequest,
        onChunk: (chunk: string) => void,
        onDone: () => void,
        onError: (err: Error) => void
    ) => {

        let response: Response;

        response = await request.postStream("/aichat/stream", data);

        const reader = response.body!.getReader() // 获取读取器
        const decoder = new TextDecoder();

        let buffer = '';

        try {
            while (true) {
                // done: 是否读取完成 true 读取完成 false 未读取完成
                // value: 读取到的数据块
                const { done, value } = await reader.read();

                // console.log("原始数据块:", value);

                if (done) {
                    break;
                }

                // stream: true 支持跨块合并
                buffer += decoder.decode(value, { stream: true });


                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimed = line.trim()
                    if (!trimed.startsWith("data: ")) {
                        continue
                    }

                    //   去掉 data: 前缀
                    const dataStr = trimed.slice(6)


                    if (dataStr === "[DONE]") {
                        onDone()
                        continue
                    }

                    const parsed = JSON.parse(dataStr)
                    if (parsed.content) {
                        onChunk(parsed.content)
                    }
                    if (parsed.error) {
                        onError(new Error(parsed.error))
                    }
                }
            }

            if (buffer.trim().startsWith("data: ")) {
                const dataStr = buffer.trim().slice(6);
                if (dataStr === "[DONE]") {
                    onDone();
                } else {
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.content) onChunk(parsed.content);
                    } catch {
                        // 忽略最后的垃圾数据
                    }
                }
            }
        }catch(err) {
            onError(err instanceof Error ? err : new Error("流式读取失败"))
        }
},
}