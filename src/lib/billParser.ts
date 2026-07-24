import * as XLSX from 'xlsx';

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  tradeNo?: string;
}

function mapCategory(desc: string, type: 'income' | 'expense'): string {
  if (type === 'income') return '收入';
  if (/餐|饭|食|外卖|美团|饿了么|麻辣烫|板面|牛肉|烧烤|火锅/.test(desc)) return '餐饮';
  if (/交通|打车|滴滴|出行|地铁|公交|加油/.test(desc)) return '交通';
  if (/超市|购物|淘宝|京东|拼多多|百货|五金/.test(desc)) return '购物';
  if (/房租|物业|水电|生活缴费/.test(desc)) return '居住';
  if (/电影|游戏|娱乐|网易云|MuMu|QQ音乐|视频/.test(desc)) return '娱乐';
  if (/DeepSeek|API|打印|复印/.test(desc)) return '技术服务';
  if (/转账|红包/.test(desc)) return '转账';
  return '其他';
}

function excelSerialToDate(serial: number): string {
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + serial * 86400 * 1000);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function parseWechatBill(buffer: Buffer, filename: string) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });

  let headerRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (Array.isArray(row) && row.some(cell => String(cell).includes('交易时间'))) {
      headerRowIndex = i;
      break;
    }
  }
  if (headerRowIndex === -1) {
    throw new Error('未找到微信账单表头');
  }

  const headers: string[] = data[headerRowIndex].map((h: any) => String(h).trim());
  const transactions: ParsedTransaction[] = [];

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const getVal = (colName: string) => {
      const idx = headers.indexOf(colName);
      return idx >= 0 ? String(row[idx] || '').trim() : '';
    };

    let timeStr = getVal('交易时间');
    if (!timeStr) continue;

    // 处理Excel日期序列号
    if (/^\d+(\.\d+)?$/.test(timeStr)) {
      const serial = parseFloat(timeStr);
      if (serial > 40000 && serial < 60000) {
        timeStr = excelSerialToDate(serial);
      }
    }

    const counterparty = getVal('交易对方');
    const product = getVal('商品');
    const direction = getVal('收/支');
    const amountStr = getVal('金额(元)').replace(/[¥,￥]/g, '');
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) continue;
    if (direction !== '收入' && direction !== '支出') continue;

    const date = timeStr.substring(0, 10);
    const isIncome = direction === '收入';

    // 构建描述，并嵌入交易单号保证长度不超255
    const tradeNo = getVal('交易单号');
    let baseDesc = product && product !== '/' ? product : counterparty;
    let description = baseDesc;

    if (tradeNo) {
      const tag = `【微信交易单号:${tradeNo}】`;
      const maxBaseLen = 255 - tag.length;
      if (baseDesc.length > maxBaseLen) {
        baseDesc = baseDesc.substring(0, maxBaseLen);
      }
      description = baseDesc + tag;
    }

    transactions.push({
      date,
      description,
      amount: isIncome ? amount : -amount,
      category: mapCategory(baseDesc, isIncome ? 'income' : 'expense'),
      tradeNo: tradeNo || undefined,
    });
  }

  return {
    transactions,
    debug: {
      rowCount: data.length,
      sampleColumns: headers,
      sampleRow: data[headerRowIndex + 1] || null,
    },
  };
}