'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionResponse, TransactionUpdate, INCOME_CATEGORIES, EXPENSE_CATEGORIES, TRANSACTION_SOURCES } from '@/types/transaction';
import { toast } from 'sonner';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, CreditCard, FileText, Pencil } from 'lucide-react';

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionResponse | null;
  onSubmit: (data: TransactionUpdate) => Promise<void>;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSubmit,
}: EditTransactionDialogProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  // 当交易数据变化时，填充表单
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCategory(transaction.category);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setSource(transaction.source || '');
      setDate(transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '');
    }
  }, [transaction]);

  // 处理提交
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!category || !amount || !source) {
      toast.error('请填写必填项');
      return;
    }

    setLoading(true);

    try {
      const data: TransactionUpdate = {
        id: transaction?.id as number,
        type,
        category,
        amount: parseFloat(amount),
        description: description || undefined,
        // 优先使用表单状态，如果为空则检查是否是初始加载阶段
        source: (source as any) || undefined,
        date: date || undefined,
      };

      await onSubmit(data);
      toast.success('交易记录更新成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    } finally {
      onOpenChange(false);
      setLoading(false);
    }
  };

  // 获取当前类型的分类选项
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Pencil className="h-4 w-4" />
            编辑交易记录
          </DialogTitle>
          <DialogDescription className="text-xs">
            修改交易记录，带 * 为必填
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-3">
            {/* 交易类型 - 使用卡片式选择 */}
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                交易类型 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === 'income' ? 'default' : 'outline'}
                  className={`h-9 text-sm ${type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => {
                    setType('income');
                    setCategory('');
                  }}
                >
                  <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
                  收入
                </Button>
                <Button
                  type="button"
                  variant={type === 'expense' ? 'default' : 'outline'}
                  className={`h-9 text-sm ${type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  onClick={() => {
                    setType('expense');
                    setCategory('');
                  }}
                >
                  <ArrowDownCircle className="mr-1.5 h-3.5 w-3.5" />
                  支出
                </Button>
              </div>
            </div>

            {/* 分类 */}
            <div className="grid gap-1.5">
              <Label htmlFor="category" className="flex items-center gap-1.5 text-sm">
                <FileText className="h-3.5 w-3.5" />
                分类 <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-sm">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 金额 */}
            <div className="grid gap-1.5">
              <Label htmlFor="amount" className="flex items-center gap-1.5 text-sm">
                <Wallet className="h-3.5 w-3.5" />
                金额 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">¥</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7 h-9 text-base font-semibold"
                  required
                />
              </div>
            </div>

            {/* 日期和来源 - 两列布局 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 日期 */}
              <div className="grid gap-1.5">
                <Label htmlFor="date" className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-3.5 w-3.5" />
                  日期
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* 来源 */}
              <div className="grid gap-1.5">
                <Label htmlFor="source" className="flex items-center gap-1.5 text-sm">
                  <CreditCard className="h-3.5 w-3.5" />
                  支付方式
                </Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="选择方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANSACTION_SOURCES).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="text-sm">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 描述 */}
            <div className="grid gap-1.5">
              <Label htmlFor="description" className="flex items-center gap-1.5 text-sm">
                <FileText className="h-3.5 w-3.5" />
                备注
              </Label>
              <Input
                id="description"
                placeholder="添加备注（可选）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={255}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              size="sm"
              // 只有当 category 和 amount 都有值时（说明 useEffect 已执行完），才允许提交
              disabled={loading || !category || !amount}
              className={type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-1.5">⏳</span>
                  保存中...
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  保存修改
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
