'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalUpdate } from '@/types/goal';
import { Calendar } from 'lucide-react';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface EditGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: GoalUpdate | null;
  onSubmit: (data: GoalUpdate) => Promise<void>;
  totalBalance: number; // 新增：当前总余额
}

export function EditGoalDialog({ open, onOpenChange, goal, onSubmit, totalBalance }: EditGoalDialogProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // 表单初始化
  useEffect(() => {
    if (open && goal) {
      setTitle(goal.title || '');
      setType(goal.type || '');
      setTargetAmount(goal.target_amount?.toString() || '');
      setDeadline(goal.deadline || '');

      // 剩余目标：显示实时总余额，只读
      if (goal.type === '剩余目标') {
        setCurrentAmount(totalBalance.toFixed(2));
      } else {
        // 积攒目标：保留已存金额，可编辑
        setCurrentAmount(goal.current_amount?.toString() || '0');
      }
      setLoading(false);
    }
  }, [open, goal, totalBalance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("请输入目标名称");
      return;
    }

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      toast.warning('请输入有效的目标金额');
      return;
    }
    if (!currentAmount) {
      toast.error("请输入当前金额");
      return;
    }
    if (!deadline) {
      toast.error("请输入截止日期");
      return;
    }
    if (!type) {
      toast.error("请选择目标类型");
      return;
    }

    const current = parseFloat(currentAmount) || 0;

    // 类型特定验证
    if (type === '剩余目标' && target >= current) {
      toast.error('剩余目标的目标金额必须小于当前余额');
      return;
    }
    if (type === '积攒目标' && target <= current) {
      toast.error('积攒目标的目标金额必须大于起始金额');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        target_amount: target,
        current_amount: current,
        deadline: deadline || undefined,
        type: type || undefined
      });
      onOpenChange(false);
    } catch (error) {
      console.error('更新失败:', error);
      toast.error("更新目标失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480]">
        <DialogHeader>
          <DialogTitle>编辑储蓄目标</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 目标名称 */}
            <div className="space-y-2">
              <Label htmlFor="title">目标名称</Label>
              <Input
                id="title"
                placeholder="例如：买房首付、旅行基金"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-sm"
                maxLength={255}
                required
              />
            </div>

            {/* 目标类型 */}
            <div className="space-y-2">
              <Label htmlFor="type">目标类型</Label>
              <Select value={type} onValueChange={(newType) => setType(newType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择目标类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="积攒目标">积攒目标</SelectItem>
                  <SelectItem value="剩余目标">剩余目标</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 目标金额 */}
            <div className="space-y-2">
              <Label htmlFor="targetAmount">目标金额</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">￥</span>
                <Input
                  id="targetAmount"
                  type="number"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* 当前金额和截止日期 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="currentAmount">
                  {type === '剩余目标' ? '当前余额' : '起始金额'}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">￥</span>
                  <Input
                    id="currentAmount"
                    type="number"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className={cn(
                      "pl-9 h-9 text-sm",
                      type === '剩余目标' && "bg-gray-100 cursor-not-allowed"
                    )}
                    min="0"
                    step="0.01"
                    readOnly={type === '剩余目标'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">截止日期</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="pl-9 h-9 text-sm"
                    min={today}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存编辑'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}