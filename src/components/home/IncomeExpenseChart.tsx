import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionResponse } from "@/types/transaction";
// import { getCategoryName } from "@/types/transaction";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer} from "recharts";

interface ExpenseChartProps {
  transactions: TransactionResponse[];
}

export function IncomeExpenseChart({ transactions }: ExpenseChartProps) {

  // 01 准备容器
  const itmeMap: Record<string, { date: string; income: number; expense: number }> = {
    // '01-01': { date: '01-01', income: 0, expense: 0 },
  };

  //02 遍历存储到容器
  // transactions
  // 2026-01-01 00:00:00  收入 10 支出5 
  // 2026-01-01 00:00:00  收入 50 支出20
  transactions.map((tr) => {
    const date = new Date(tr.date || tr.create_at).toLocaleDateString("zh-CN", {
      month: "2-digit", // 月份 2位数字
      day: "2-digit", // 日期 2位数字
    });

    // 01-01

    if(!itmeMap[date]){
      itmeMap[date] = {
        date:date,
        income:0,
        expense:0
      }
    }

    if (tr.type === "income") {
      itmeMap[date].income += tr.amount || 0;
    } else {
      itmeMap[date].expense += tr.amount || 0;
    }
  });

  console.log("itmeMap", itmeMap);

    // Object.values: 将对象的值转换为数组
    const trendData = Object.values(itmeMap);
    // [{date:'01-01',income:1000,expense:500},{date:'01-02',income:2000,expense:800}]
    // console.log("trendData1", trendData);
    

  // 03 排序
  const sortData = trendData.sort((a,b)=>{
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    // 如果 返回值>0 说明 a 在 b 后面
    // 如果 返回值<0 说明 a 在 b 前面
    // 如果 返回值=0 说明 a 和 b 相等
    return dateA.getTime() - dateB.getTime(); // 按时间排序
  })
 

  return (
    <Card>
      <CardHeader>
        <CardTitle>收支趋势</CardTitle>
      </CardHeader>
      <CardContent>
        {/* ResponsiveContainer 响应式容器 */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sortData}>
            {/* 网格线 */}
            <CartesianGrid strokeDasharray="3 3" />
            {/* X轴 月份 */}
            <XAxis dataKey="date" />
            {/* Y轴 值 */}
            <YAxis />
            {/* 提示框 */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#eee",
                borderColor: "1px solid #e5e5e5",
              }}
              // 提示框格式化: 用户数 对话数
              formatter={(value,name)=>{
                const lable = name === 'income' ? '收入' : '支出'

                return [`${lable}:${value}`]
              }
            }
            />

            {/* 图例 说明*/}
            <Legend 
              // 图例格式化： income -> 收入 expense -> 支出
              formatter={(value) => {
                if(value === 'income'){
                  return '收入';  
                }else if(value === 'expense'){
                  return '支出';
                }
                return value;
              }}
            />

            <Line
              type="monotone"
              dataKey="income"
              stroke="#007bff"
              activeDot={{ r: 3, stroke: "#007bff" }} // 激活点 r 半径 8
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#dc3545"
              activeDot={{ r: 3, stroke: "#dc3545" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
