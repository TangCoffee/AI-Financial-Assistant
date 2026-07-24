"use client";

import { useState } from "react";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES,TRANSACTION_SOURCES } from "@/types/transaction";
import { TransactionCreate } from "@/types/transaction";
import { toast } from "sonner";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    FileText,
    Calendar,
    CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


interface CreateTransactionProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (transaction: TransactionCreate) => void;
}

export default function CreateTransaction(
    { open, onOpenChange, onSubmit }: CreateTransactionProps,
) {
    const [type, setType] = useState<"income" | "expense">("expense");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [source, setSource] = useState("other");
    // toISOString : 转换为 ISO 格式的时间字符串 2026-04-07T20:00:00.000Z [2026-04-07,20:00:00.000Z]
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    // 02 获取当前类型:income或expense的分类选项
    const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;


    // 04 重置表单
    const resetForm = () => {
        setType("expense");
        setCategory("");
        setAmount("");
        setDescription("");
        setSource("");
        setDate(new Date().toISOString().split("T")[0]);
    };

    // 05 提交表单
    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();

        if (!category || !amount || !source) {
            toast.error("请填写必填项");
            return;
        }

        setLoading(true);

        try {
            const data: TransactionCreate = {
                // user_id: 0, // 临时值，后续从token中获取用户ID
                type,
                category,
                amount: parseFloat(amount), // 转换为浮点数
                description: description || undefined,
                source: (source as any) || undefined,
                date: date || undefined,
            };

            // 调用后端创建交易记录接口
            await onSubmit(data);

            toast.success("交易记录创建成功");
            resetForm();
            //   onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "创建失败");
        } finally {
            setLoading(false);
            onOpenChange(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480]">
                {/* 标题 */}
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-4 w-4" />
                        新建交易记录
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        添加一笔新的收入或支出，带 * 为必填
                    </DialogDescription>
                </DialogHeader>

                {/* 内容表单 */}
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
                                    variant={type === "income" ? "default" : "outline"}
                                    className={`h-9 text-sm ${type === "income" ? "bg-green-600 hover:bg-green-700" : ""
                                        }`}
                                    onClick={() => {
                                        setType("income");
                                        setCategory("");
                                    }}
                                >
                                    <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
                                    收入
                                </Button>
                                <Button
                                    type="button"
                                    variant={type === "expense" ? "default" : "outline"}
                                    className={`h-9 text-sm ${type === "expense" ? "bg-red-600 hover:bg-red-700" : ""
                                        }`}
                                    onClick={() => {
                                        setType("expense");
                                        setCategory("");
                                    }}
                                >
                                    <ArrowDownCircle className="mr-1.5 h-3.5 w-3.5" />
                                    支出
                                </Button>
                            </div>
                        </div>

                        {/* 分类 */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="category"
                                className="flex items-center gap-1.5 text-sm"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                分类 <span className="text-red-500">*</span>
                            </Label>
                            <Select value={category} onValueChange={setCategory} required>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder="请选择分类" />
                                </SelectTrigger>
                                <SelectContent>
                                    {
                                        //  Object.entries : 将对象转换为键值对数组
                                        // []
                                        Object.entries(categories).map(([key, label]) => (
                                            <SelectItem key={key} value={key} className="text-sm">
                                                {label}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 金额 */}
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor="amount"
                                className="flex items-center gap-1.5 text-sm"
                            >
                                <Wallet className="h-3.5 w-3.5" />
                                金额 <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                                    ¥
                                </span>
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
                                <Label
                                    htmlFor="date"
                                    className="flex items-center gap-1.5 text-sm"
                                >
                                    <Calendar className="h-3.5 w-3.5" />
                                    日期
                                </Label>
                                <Input
                                    id="date"
                                    type="date"
                                    className="h-9 text-sm"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            {/* 来源 */}
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="source"
                                    className="flex items-center gap-1.5 text-sm"
                                >
                                    <CreditCard className="h-3.5 w-3.5" />
                                    支付方式
                                </Label>
                                <Select value={source} onValueChange={setSource} required>
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
                            <Label
                                htmlFor="description"
                                className="flex items-center gap-1.5 text-sm"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                备注
                            </Label>
                            <Input
                                id="description"
                                placeholder="添加备注（可选）"
                                maxLength={255}
                                className="h-9 text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                resetForm();
                                onOpenChange(false);
                            }}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className={
                                type === "income"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-red-600 hover:bg-red-700"
                            }
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-1.5">⏳</span>
                                    创建中...
                                </>
                            ) : (
                                <>
                                    {type === "income" ? (
                                        <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
                                    ) : (
                                        <ArrowDownCircle className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    创建{type === "income" ? "收入" : "支出"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
