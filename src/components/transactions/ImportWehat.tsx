'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface PreviewTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  selected: boolean;
}

interface ImportWechatProps {
  onSuccess?: () => void;
}

export default function ImportWechat({ onSuccess }: ImportWechatProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [data, setData] = useState<PreviewTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    if (!file) {
      toast.error('请先选择微信账单文件（CSV/Excel）');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/transactions/parse', { method: 'POST', body: formData });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setData(json.data.map((tx: any) => ({ ...tx, selected: true })));
      setStep('preview');
      toast.success(`解析成功，共 ${json.data.length} 条记录`);
    } catch (err: any) {
      toast.error(err.message || '解析失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setData(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  };

  const toggleAll = (checked: boolean) => {
    setData(prev => prev.map(item => ({ ...item, selected: checked })));
  };

  const handleImport = async () => {
    const selected = data.filter(tx => tx.selected);
    if (selected.length === 0) {
      toast.error('请至少选择一条记录');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: selected }),
      });
        const text = await res.text();  // 先用文本接收，防止非 JSON 报错
        let json: any;
        try {
            json = JSON.parse(text);
        } catch {
            throw new Error(`服务器返回非 JSON 响应 (状态码 ${res.status})`);
        }
        if (!json.success) throw new Error(json.message || '导入失败');
      toast.success(`成功导入 ${json.count} 条，${json.duplicate || 0} 条重复已跳过`);
      onSuccess?.();
      resetAndClose();
    } catch (err: any) {
      toast.error(err.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setFile(null);
    setData([]);
    setStep('upload');
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" />
        导入微信账单
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetAndClose(); }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>导入微信账单</DialogTitle>
          </DialogHeader>

          {step === 'upload' ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="wechat-file">选择微信账单文件（CSV 或 Excel）</Label>
                <Input
                  id="wechat-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    已选择: {file.name}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400">
                微信 App → 我 → 服务 → 钱包 → 账单 → 右上角... → 下载账单 → 用于个人对账
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button onClick={handleParse} disabled={loading}>
                  {loading ? '解析中...' : '解析账单'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden space-y-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  共 {data.length} 条，已选 {data.filter(d => d.selected).length} 条
                </p>
                <Button size="sm" variant="ghost" onClick={() => setStep('upload')}>
                  返回重选文件
                </Button>
              </div>

              <div className="border rounded-md flex-1 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={data.length > 0 && data.every(d => d.selected)}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead className="w-28">日期</TableHead>
                      <TableHead className="min-w-[200px]">描述</TableHead>
                      <TableHead className="w-24">金额</TableHead>
                      <TableHead className="w-24">类型</TableHead>
                      <TableHead className="w-24">分类</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((tx, idx) => (
                      <TableRow key={idx} className={tx.selected ? '' : 'opacity-50'}>
                        <TableCell>
                          <Checkbox checked={tx.selected} onCheckedChange={() => toggleSelect(idx)} />
                        </TableCell>
                        <TableCell className="text-xs">{tx.date}</TableCell>
                        <TableCell className="text-xs">{tx.description}</TableCell>
                        <TableCell className="text-xs font-medium">
                          <span className={tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {tx.amount >= 0 ? '+' : '-'}¥{Math.abs(tx.amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{tx.amount >= 0 ? '收入' : '支出'}</TableCell>
                        <TableCell className="text-xs">{tx.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                <Button onClick={handleImport} disabled={loading || data.filter(d => d.selected).length === 0}>
                  {loading ? '导入中...' : `导入选中的 ${data.filter(d => d.selected).length} 条`}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}