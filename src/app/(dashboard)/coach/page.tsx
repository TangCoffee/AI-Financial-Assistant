import Header from "@/components/Headers";
import { CoachChatStream } from "@/components/coach/CoachChatStream";

// 智能财务教练 — 流式输出版
export default function CoachStream() {
  return (
    <div className="flex flex-col h-screen">
      <Header menuName="财务教练（流式）" />
      <div className="flex-1 overflow-hidden">
        <CoachChatStream />
      </div>
    </div>
  );
}