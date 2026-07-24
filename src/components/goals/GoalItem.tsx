import type { GoalResponse } from "@/types/goal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Calendar } from "lucide-react";
import { getRemainingDays, formatAmount } from "@/types/goal";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface GoalItemProps {
  goal: GoalResponse;
  onEdit: (goal: GoalResponse) => void;
  onDelete: (id: number) => void;
  totalBalance?: number;
  onDeposit?: () => void; // 存入成功后通知父组件刷新
}

export function GoalItem({ goal, onEdit, onDelete, totalBalance = 0, onDeposit }: GoalItemProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);

  const isRemainingGoal = goal.type === "剩余目标";
  // 在 GoalItem 组件里，获取 totalBalance 和 current_amount
  const maxDeposit = totalBalance - Number(goal.current_amount || 0);
  // ---------- 进度计算 ----------
  let progress = 0;
  let progressLabel = "";
  let progressColor = "";
  let textColor = "";
  let amountLine1 = "";
  let amountLine2 = "";

  if (isRemainingGoal) {
    const balance = totalBalance;
    const target = Number(goal.target_amount) || 0;
    const diff = balance - target;

    if (diff >= 0) {
      progress = 100;
      progressLabel = `还可支配 ${formatAmount(diff)}`;
      progressColor = "bg-green-500";
      textColor = "text-green-600";
    } else {
      progress = target > 0 ? (balance / target) * 100 : 0;
      progressLabel = `已超支 ${formatAmount(Math.abs(diff))}`;
      progressColor = "bg-red-500";
      textColor = "text-red-600";
    }

    amountLine1 = formatAmount(balance);
    amountLine2 = formatAmount(target);
  } else {
    // 积攒目标
    const current = Number(goal.current_amount) || 0;
    const target = Number(goal.target_amount) || 0;
    progress = target > 0 ? (current / target) * 100 : 0;
    progressLabel = `${progress.toFixed(1)}%`;
    progressColor = "bg-blue-600";
    textColor = "text-blue-600";

    amountLine1 = formatAmount(current);
    amountLine2 = formatAmount(target);
  }

  const remainingDays = getRemainingDays(goal.deadline || "");

  const getTypeShort = (type?: string) => {
    if (type === "积攒目标") return "积攒";
    if (type === "剩余目标") return "剩余";
    return type || "未分类";
  };

  const typeLabel = getTypeShort(goal.type);
  const typeColorClass =
    goal.type === "积攒目标"
      ? "bg-blue-600"
      : goal.type === "剩余目标"
      ? "bg-red-600"
      : "bg-gray-500";

  // 存入处理
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("请输入有效的存入金额");
      return;
    }
    setDepositing(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}/deposit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      toast.success(`成功存入 ${formatAmount(amount)}`);
      setDepositOpen(false);
      setDepositAmount("");
      onDeposit?.(); // 通知父组件刷新
    } catch (err: any) {
      toast.error(err.message || "存入失败");
    } finally {
      setDepositing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <CardTitle className="truncate">{goal.title}</CardTitle>
              <span
                className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${typeColorClass}`}
              >
                {typeLabel}
              </span>
            </div>

            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="编辑" onClick={() => onEdit(goal)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" title="删除" onClick={() => onDelete(goal.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 进度条 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">{isRemainingGoal ? "安全状态" : "完成进度"}</span>
              <span className={`font-semibold ${textColor}`}>{progressLabel}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all ${progressColor}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* 金额信息 + 存入按钮 */}
          <div className="grid grid-cols-2 gap-3 py-2 border-y">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">{isRemainingGoal ? "当前余额" : "已存"}</p>
              <p className="text-base font-bold text-green-600">{amountLine1}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">{isRemainingGoal ? "目标保留" : "目标"}</p>
              <p className="text-base font-bold text-blue-600">{amountLine2}</p>
              {!isRemainingGoal && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setDepositOpen(true)}
                >
                  + 存入
                </Button>
              )}
            </div>
          </div>

          {/* 截止日期 */}
          {goal.deadline && (
            <div className="flex items-center justify-between text-xs pt-2">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Calendar className="h-3.5 w-3.5" />
                <span>截止日期</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{goal.deadline}</p>
                {remainingDays >= 0 && (
                  <p className={`text-xs font-semibold ${remainingDays <= 7 ? "text-red-600" : remainingDays <= 30 ? "text-yellow-600" : "text-green-600"}`}>
                    {remainingDays}天剩余
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 存入对话框 */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>存入 {goal.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">存入金额
                 <p className="text-xs text-gray-500">
                  当前最多可存入：{formatAmount(maxDeposit)}
                </p>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">￥</span>
                <Input
                  id="depositAmount"
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  max={maxDeposit > 0 ? maxDeposit : 0}
                  min="0"
                  step="0.01"
                />
               
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>取消</Button>
            <Button onClick={handleDeposit} disabled={depositing}>
              {depositing ? "存入中..." : "确认存入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}