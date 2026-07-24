import { useState } from "react";
import { GoalResponse } from "@/types/goal";
import { TransactionResponse } from "@/types/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Plus, Check, Calendar, ChevronDown } from "lucide-react";
import { formatAmount } from "@/types/goal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  transactions: TransactionResponse[];
  goals: GoalResponse[];
}

export default function StatsCards({ transactions, goals }: StatsCardsProps) {
  // 统计数据
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // ---------- 已存入积攒目标的金额总和 ----------
  // 目前先设为 0，等“存入”功能做好后，这里改为从交易记录或目标中动态计算
  const totalDeposited = goals
    .filter(g => g.type === '积攒目标')
    .reduce((sum, g) => sum + Number(g.current_amount || 0), 0);

  // 自由余额 = 总余额 - 已存入积攒目标的金额
  const freeBalance = totalBalance - totalDeposited;

  // 目标追踪状态 - 从 localStorage 恢复
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trackedGoalId");
      return saved ? Number(saved) : null;
    }
    return null;
  });

  // 获取选中的目标对象
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) || null;

  // 判断目标类型
  const isSavingGoal = selectedGoal?.type === "积攒目标";
  const isRemainingGoal = selectedGoal?.type === "剩余目标";

  // 当前目标的已存入金额（等存入功能做好后动态计算）
  const goalDeposited = 0;

  // 计算差额（根据类型分别处理）
  let remaining = 0;

  if (selectedGoal) {
    if (isRemainingGoal) {
      // 剩余目标：可支配金额 = 当前总余额 - 目标保留金额
      remaining = totalBalance - selectedGoal.target_amount;
    } else {
      // 积攒目标：还需存入 = 目标金额 - 已存入金额
      remaining = selectedGoal.target_amount - goalDeposited;
    }
  }

  // 显示文案
  const remainingLabel = isSavingGoal
    ? "还需存入"
    : isRemainingGoal
    ? "可支配"
    : "差额";

  const isOverBudget = isRemainingGoal && remaining < 0;

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "无截止日期";
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleSelectGoal = (goalId: number) => {
    setSelectedGoalId(goalId);
    localStorage.setItem("trackedGoalId", String(goalId));
  };

  // 获取类型简写（去掉"目标"二字）
  const getTypeShort = (type?: string) => {
    if (type === "积攒目标") return "积攒";
    if (type === "剩余目标") return "剩余";
    return type || "积攒";
  };

  // 前三个卡片
  const cards = [
    {
      title: "总收入",
      value: formatAmount(totalIncome),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "总支出",
      value: formatAmount(totalExpense),
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "结余",
      value: formatAmount(totalBalance),
      icon: Wallet,
      color: totalBalance >= 0 ? "text-blue-600" : "text-orange-600",
      bgColor: totalBalance >= 0 ? "bg-blue-50" : "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 前三个固定卡片 */}
      {cards.map((card, index) => (
        <Card key={index} className="rounded-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                {/* 追踪积攒目标时，在结余卡片显示自由余额 */}
                {card.title === "结余" && selectedGoal && isSavingGoal && (
                  <p className="text-xs text-gray-700 mt-2 text-red-500">
                    💡 可自由支配：
                    <span className={`font-semibold ${
                      freeBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatAmount(freeBalance)}
                    </span>
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 第四张卡片：目标追踪选择器 */}
      <Card
        className={cn(
          "rounded-none transition-all duration-200",
          selectedGoal && "ring-2 ring-purple-200"
        )}
      >
        <CardContent className="p-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-500">
                      {selectedGoal ? "追踪目标(点击切换)" : "选择目标"}
                    </p>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-gray-400 transition-transform duration-200",
                        selectedGoal && "text-purple-400"
                      )}
                    />
                  </div>

                  {selectedGoal ? (
                    <>
                      {/* 主行：左标题 + 右金额 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-lg font-semibold truncate text-gray-800">
                            {selectedGoal.title}
                          </p>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full text-white font-medium flex-shrink-0",
                              isSavingGoal
                                ? "bg-blue-500"
                                : isRemainingGoal
                                ? "bg-red-500"
                                : "bg-gray-500"
                            )}
                          >
                            {getTypeShort(selectedGoal.type)}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 flex-shrink-0 ml-4">
                          <span
                            className={cn(
                              "text-xl font-bold",
                              isOverBudget
                                ? "text-red-600"
                                : isSavingGoal
                                ? "text-blue-600"
                                : isRemainingGoal
                                ? "text-orange-600"
                                : "text-purple-600"
                            )}
                          >
                            {isOverBudget
                              ? `-${formatAmount(Math.abs(remaining))}`
                              : formatAmount(remaining)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {isOverBudget ? "已超支" : remainingLabel}
                          </span>
                        </div>
                      </div>
                      {/* 截止日期（第二行） */}
                      {selectedGoal.deadline && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            截止：{formatDate(selectedGoal.deadline)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 text-gray-400 py-2">
                      <div className="p-2 border-2 border-dashed border-gray-200 rounded-lg">
                        <Plus className="h-6 w-6" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">点击选择目标</p>
                        <p className="text-xs">追踪你的储蓄进度</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
              {goals.length === 0 ? (
                <div className="px-3 py-6 text-sm text-center text-gray-500">
                  暂无储蓄目标
                  <br />
                  <span className="text-xs">去创建一个吧 ！</span>
                </div>
              ) : (
                goals.map((goal) => {
                  const isSelected = selectedGoalId === goal.id;
                  const isSaving = goal.type === "积攒目标";
                  const isRemaining = goal.type === "剩余目标";

                  // 计算每个目标的差额
                  let goalRemaining = 0;
                  if (isRemaining) {
                    goalRemaining = totalBalance - goal.target_amount;
                  } else {
                    goalRemaining = goal.target_amount - goalDeposited;
                  }

                  const displayLabel = isSaving
                    ? `还需 ${formatAmount(goalRemaining)}`
                    : isRemaining
                    ? goalRemaining >= 0
                      ? `可支配 ${formatAmount(goalRemaining)}`
                      : `超支 ${formatAmount(Math.abs(goalRemaining))}`
                    : `差额 ${formatAmount(goalRemaining)}`;

                  return (
                    <DropdownMenuItem
                      key={goal.id}
                      onClick={() => handleSelectGoal(goal.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer",
                        isSelected && "bg-purple-50"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-medium truncate">{goal.title}</span>
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium flex-shrink-0",
                              isSaving ? "bg-blue-500" : isRemaining ? "bg-red-500" : "bg-gray-500"
                            )}
                          >
                            {getTypeShort(goal.type)}
                          </span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-purple-600 flex-shrink-0 ml-2" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 w-full">
                        <span>{displayLabel}</span>
                        {goal.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(goal.deadline)}
                          </span>
                        )}
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    </div>
  );
}