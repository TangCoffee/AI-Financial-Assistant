"use client";
import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { Bot, Trash2, User, Send, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatApi } from "@/lib/chat-api";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogAction
} from "@/components/ui/alert-dialog";

export function CoachChatStream() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [clearDialogOpen, setClearDialogOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isStreaming, setIsStreaming] = useState<boolean>(false);

    const accumulatedRef = useRef<string>("");
    const streamingIdRef = useRef<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // 初始化欢迎消息
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: "1",
                    role: "assistant",
                    content:
                        "你好！我是你的智能财务教练（流式版）。我可以帮你分析预算、提供理财建议。请问有什么可以帮你的吗？",
                    timestamp: new Date(),
                },
            ]);
        }
    }, []);

    // 自动滚动到底部
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading || isStreaming) return;

        setIsLoading(true);

        // 用户消息
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: inputMessage,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // AI 占位消息
        const placeholderId = (Date.now() + 1).toString() + "-stream";
        streamingIdRef.current = placeholderId;
        accumulatedRef.current = "";

        setMessages((prev) => [
            ...prev,
            {
                id: placeholderId,
                role: "assistant",
                content: "...",
                timestamp: new Date(),
            },
        ]);

        const currentInput = inputMessage;
        setInputMessage("");
        setIsStreaming(true);

        try {
            await chatApi.sendMessageStream(
                { message: currentInput },
                (chunk) => {
                    accumulatedRef.current += chunk;
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === placeholderId
                                ? { ...msg, content: accumulatedRef.current }
                                : msg
                        )
                    );
                },
                () => {
                    streamingIdRef.current = null;
                    setIsLoading(false);
                    setIsStreaming(false);
                },
                (err) => {
                    console.error("流式消息出错:", err);
                    setIsLoading(false);
                    setIsStreaming(false);
                    if (!accumulatedRef.current) {
                        setMessages((prev) =>
                            prev.map((msg) =>
                                msg.id === placeholderId
                                    ? { ...msg, content: "抱歉，流式响应中断了。请稍后再试。" }
                                    : msg
                            )
                        );
                        toast.error("流式响应出错，请稍后再试");
                    }
                },
            );
        } catch (error) {
            console.error("发送消息失败:", error);
            setIsLoading(false);
            setIsStreaming(false);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === placeholderId
                        ? { ...msg, content: "抱歉，我无法回答你的问题。请稍后再试。" }
                        : msg
                )
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content:
                    "你好！我是你的智能财务教练（流式版）。我可以帮你分析预算、提供理财建议。请问有什么可以帮你的吗？",
                timestamp: new Date(),
            },
        ]);
        setClearDialogOpen(false);
        toast.success("聊天记录已清空");
    };

    // 判断某条消息是否正在流式输出（用于闪烁光标）
    const isMessageStreaming = (id: string) => {
        return streamingIdRef.current === id && isStreaming;
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
            {/* ========== 标题栏 ========== */}
            <Card className="flex-1 flex flex-col rounded-none border-0 shadow-none">
                <CardHeader className="pb-3 border-b bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <div>
                                <span>智能财务教练 <span className="text-xs text-blue-500 dark:text-blue-300 font-normal ml-1">流式版</span></span>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">
                                    实时流式输出，逐字呈现 AI 回复
                                </p>
                            </div>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="清空聊天记录"
                            onClick={() => setClearDialogOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                {/* ========== 聊天消息列表 ========== */}
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${
                                message.role === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                            {/* AI 头像 */}
                            {message.role === "assistant" && (
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                </div>
                            )}

                            {/* 气泡 */}
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                    message.role === "user"
                                        ? "bg-blue-600 text-white dark:bg-blue-500"
                                        : "bg-white border border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {message.content}
                                    {/* 流式光标动画 */}
                                    {isMessageStreaming(message.id) && (
                                        <span className="inline-block w-[2px] h-4 bg-blue-600 dark:bg-blue-300 ml-0.5 animate-pulse align-middle" />
                                    )}
                                </p>
                                <p
                                    className={`text-xs mt-2 ${
                                        message.role === "user"
                                            ? "text-blue-100 dark:text-blue-200"
                                            : "text-gray-400 dark:text-gray-500"
                                    }`}
                                >
                                    {message.timestamp.toLocaleTimeString("zh-CN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>

                            {/* 用户头像 */}
                            {message.role === "user" && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shrink-0">
                                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </CardContent>

                {/* ========== 快捷问题 ========== */}
                {messages.length <= 1 && (
                    <div className="px-6 pb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">💡 你可以问我：</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                "如何规划月度预算？",
                                "怎样提高储蓄率？",
                                "我的支出合理吗？",
                                "有什么投资建议？",
                            ].map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => setInputMessage(question)}
                                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* ========== 底部输入区 ========== */}
            <Card className="rounded-none border-t border-gray-200 dark:border-gray-800 shadow-lg">
                <CardContent className="p-4 bg-white dark:bg-gray-900">
                    <div className="flex gap-3 items-center">
                        <Textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入你的财务问题..."
                            className="min-h-[60] resize-none border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            disabled={isLoading || isStreaming}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isLoading || isStreaming}
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 h-[60]"
                            size="lg"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ========== 清空确认对话框 ========== */}
            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认清空</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作将清空所有聊天记录，只保留欢迎消息。确定要继续吗？
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearChat}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            确认清空
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}