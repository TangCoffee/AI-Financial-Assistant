'use client'

import { useEffect, useState } from 'react';
import { transactionApi } from '@/lib/transaction-api';
import type { TransactionResponse, TransactionCreate, TransactionUpdate } from '@/types/transaction';
import { getCategoryName, getSourceName } from '@/types/transaction';
import Header from '@/components/Headers';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction } from '@/components/ui/alert-dialog';
import { toast } from "sonner"

import CreateTransaction from '@/components/transactions/CreateTransaction';
import { EditTransactionDialog } from '@/components/transactions/EditTransaction';
import ImportWechat from '@/components/transactions/ImportWehat';


export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTransaction, setEditTransaction] =useState<TransactionResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadTransactions = async () => {
    const token = localStorage.getItem("token")
    if (!token) return
    try {
      const res = await transactionApi.list()
      console.log('加载交易记录成功:', res)
      setTransactions(res)
    } catch (error:any) {
      console.error('加载交易失败:', error)
      toast.error("加载交易记录失败" + error.message); 
    }
  }

  useEffect(() => {
    loadTransactions()
  }, []);

  // 创建交易记录
  // 创建交易记录后 方便 loadTransactions（刷新列表）
  const createTransaction = async (transaction: TransactionCreate) => {
    try {
      await transactionApi.create(transaction);
      loadTransactions();
    } catch (error:any) {
      console.error('创建交易失败:', error)
      // toast.error("创建交易失败" + error);
    }
  };


  const handleEdit = (transaction: TransactionResponse) => {
    setEditTransaction(transaction);
    setEditDialogOpen(true);
  };

  const updateTransaction = async (transaction: TransactionUpdate) => {
    try {
      await transactionApi.update(transaction.id, transaction);
      loadTransactions();
    } catch (error) {
      console.error('更新交易失败:', error)
      // toast.error("更新交易失败");
    }
  };

  // 确认删除
  const deleteTransaction = async () => {
    if (!deleteId) return;

    try {
      await transactionApi.delete(deleteId);
      toast.success("交易记录删除成功", { duration: 2000, position: "bottom-center", style: { backgroundColor: "green", color: "#fff" } });
      loadTransactions();
    } catch (error) {
      console.error('删除交易失败:', error)
      toast.error("删除交易失败");
    }
  };


  return (
    <div>
      <Header menuName="交易管理" />
      <div className="container mx-auto p-6 max-w-4xl">
        {/* 交易记录标题 */}
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold flex-1">交易记录</h1>
          <div className="flex gap-2">
            <ImportWechat onSuccess={loadTransactions}/>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增交易
            </Button>
          </div>
        </div>

        {/* 交易记录列表 */}
        <div className="border border-gray-300 p-4 rounded-md">
          <div className="overflow-auto">
            <Table>
              {transactions.length === 0 && (
                <TableCaption>暂无交易记录</TableCaption>
              )}

              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100]">日期</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead className="w-[100] text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  // 获取支付方式显示名称
                  const sourceName = getSourceName(transaction.source);

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.date}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            transaction.type === "income"
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {transaction.type === "income" ? "收入" : "支出"}
                        </span>
                      </TableCell>
                      <TableCell>{getCategoryName(transaction.type, transaction.category)}</TableCell>
                      <TableCell className="text-gray-500">
                        {sourceName}
                      </TableCell>
                      <TableCell className="max-w-[200] overflow-hidden text-ellipsis whitespace-nowrap">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                        >
                          {transaction.type === "income" ? "+" : "-"} ¥{" "}
                          {transaction.amount}
                        </span>
                      </TableCell>
                      <TableCell className="w-[100] text-center flex justify-center items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="编辑"
                          onClick={() => handleEdit(transaction)}
                        >
                          {/* 编辑 */}
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          title="删除"
                          onClick={() => {
                            setDeleteId(transaction.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <CreateTransaction
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={createTransaction}
        />
       
        <EditTransactionDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          transaction={editTransaction}
          onSubmit={updateTransaction}
        />


        {/*  AlertDialog：删除提示框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除?</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将永久删除该交易记录，无法恢复。确定要继续吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={deleteTransaction}>
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
