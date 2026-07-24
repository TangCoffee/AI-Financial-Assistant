import { NextRequest, NextResponse } from 'next/server';
import { parseWechatBill } from '@/lib/billParser';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ message: '请上传文件' }, { status: 400 });
    }
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.csv') && !filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      return NextResponse.json({ message: '仅支持 CSV 或 Excel 格式' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseWechatBill(buffer, file.name);
    const transactions = result.transactions; // 关键：提取数组

    if (transactions.length === 0) {
      return NextResponse.json({
        message: '未解析到有效交易记录',
        debug: result.debug,
      }, { status: 422 });
    }

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    console.error('解析失败:', error);
    return NextResponse.json({ message: error.message || '解析失败' }, { status: 500 });
  }
}