'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoalCreate } from '@/types/goal';
import { Calendar } from 'lucide-react';
import { toast } from "sonner";
import { cn } from '@/lib/utils';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GoalCreate) => Promise<void>;
  totalBalance: number;
}

export function CreateGoalDialog({ open, onOpenChange, onSubmit, totalBalance }: CreateGoalDialogProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const prevTypeRef = useRef(type);
  const today = new Date().toISOString().split('T')[0];

  // 重置表单
useEffect(() => {
  if (!open) {
    setTitle('');
    setType('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setLoading(false);
  } else {
    // 打开时默认填 0，不管什么类型
    setCurrentAmount('0');
  }
}, [open]);

  // 切换类型时也重新填入总余额（确保数值最新）
  useEffect(() => {
    if (type && type !== prevTypeRef.current) {
      setCurrentAmount(totalBalance.toFixed(2));
    }
    prevTypeRef.current = type;
  }, [type, totalBalance]);

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
      toast.error('剩余目标的目标金额必须小于当前结余金额');
      return;
    }
    if (type === '积攒目标' && target <= current) {
      toast.error('积攒目标的目标金额必须大于当前金额');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        target_amount: target,
        current_amount: current,
        deadline: deadline || undefined,
        type: type,
      });
      toast.success("目标创建成功！");
    } catch (error: any) {
      console.error('创建失败:', error.message);
      toast.error("创建目标失败：" + error.message);
    } finally {
      onOpenChange(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480]">
        <DialogHeader>
          <DialogTitle>新建储蓄目标</DialogTitle>
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
              <Label htmlFor="targetAmount">目标类型</Label>
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
                    value={type == '剩余目标'? currentAmount : 0}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className={cn(
                      "pl-9 h-9 text-sm",
                      "bg-gray-100 cursor-not-allowed"
                    )}
                    min="0"
                    step="0.01"
                    readOnly
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
              {loading ? '创建中...' : '创建目标'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}