"use client";

import Header from "@/components/Headers";
import { GoalResponse, type GoalUpdate } from "@/types/goal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GoalItem } from "@/components/goals/GoalItem";
import { useState } from "react";
import { GoalCreate } from "@/types/goal";
import { goalApi } from "@/lib/goal-api";
import { toast } from "sonner";
import { useEffect } from "react";
import { homeApi } from "@/lib/home-api";
import { TransactionResponse } from "@/types/transaction";

import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog";
import { EditGoalDialog } from "@/components/goals/EditGoalDialog"
import { DeleteGoalDiaglog } from '@/components/goals/DeleteGoaldDialog'


// 储蓄目标页面
export default  function Goals() {
  const [goals, setGoals] = useState<GoalResponse[]>([]); // 目标列表
  const [loading, setLoading] = useState(false); // 加载状态
  const [creatreDialogOpen, setCreateDialogOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalResponse | null>(null); // 目标列表
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  // 获取数据
   useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Promise.all: 并行获取交易和目标数据
        const [transactionsData] = await Promise.all([
          homeApi.getTransactions(),
        ]);

        // 如果没有真实数据，使用模拟数据
        setTransactions(transactionsData);
      } catch (error) {
        console.error("加载数据失败，使用模拟数据:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

    // 统计数据
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;
  //加载列表数据
  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await goalApi.list();
      setGoals(data || []); //setGoals :同步数据  & 重新渲染
    } catch (error) {
      console.warn("加载存储目标失败", error);
      toast.error("加载存储目标失败");
    } finally {
      setLoading(false);
    }
  }

  // 上来就请求一次
  useEffect(() => {
    loadGoals();
  }, [])

  const handeCreateGoal = async (data: GoalCreate) => {
    await goalApi.create(data);
    toast.success("目标创建成功");
    loadGoals()
  };

  // 保存当前编辑的数据 + 打开dialoag
  const openEditGoal = (goal: GoalResponse) => {
    // GoalOItem 编辑的数据 同步到editGoal
    setEditGoal(goal)

    //打开编辑的dialoag
    setEditDialogOpen(true)
  }


  // 提交编辑目标数据
  const handeEditGoal = async (data: GoalUpdate) => {
    if (!editGoal) return;
    await goalApi.update(editGoal.id, data)
    toast.success('更新成功');
    setEditDialogOpen(false);
    setEditGoal(null)
    loadGoals()
  }

  //  打开删除对话框
  const handleDelete = (id: number) => {
    setDeleteDialogOpen(true);
    // 删除临时id 保存
    setDeleteId(id);
  };

  // 确认删除
  const deleteGoal = async () => {
    if (!deleteId) return;

    try {
      await goalApi.delete(deleteId);
      toast.success("删除成功");
      loadGoals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <Header menuName="储蓄目标" />
      <div className="container mx-auto p-6 max-w-4xl">
        {/* 交易记录标题 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">储蓄目标</h1>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建目标
          </Button>
        </div>

        {/* 目标列表 */}
        {goals.length === 0 ? (
          <Card className="rounded-none">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 text-lg mb-2">暂无储蓄目标</p>
              <p className="text-gray-400 text-sm mb-4">
                创建一个目标，开始你的理财之旅
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                创建第一个目标
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalItem
                goal={goal}
                key={goal.id}
                onEdit={openEditGoal}
                onDelete={handleDelete}
                totalBalance={totalBalance}
                onDeposit={loadGoals} 
              />
            ))}
          </div>
        )}

        {/* 创建的dialog */}
        <CreateGoalDialog
          open={creatreDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handeCreateGoal}
          totalBalance={totalBalance}
        />

        {/* 编辑diglog */}
        <EditGoalDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          goal={editGoal}
          onSubmit={handeEditGoal}
          totalBalance={totalBalance}
        />

        {/* 删除提示框 */}
        <DeleteGoalDiaglog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSubmit={deleteGoal}
        />

      </div>
    </div>
  );
}
