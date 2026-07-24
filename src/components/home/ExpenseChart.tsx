import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { TransactionResponse } from "@/types/transaction";
import { getCategoryName } from "@/types/transaction";

interface ExpenseChartProps {
  transactions: TransactionResponse[];
}

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  // 所有支出的记录
  let expenseTransactions = transactions.filter((tx) => tx.type === "expense");

  if (expenseTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>支出分类</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">暂无支出数据</p>
        </CardContent>
      </Card>
    );
  }

  //   {
  //     'transport': 300,
  //     'food': 500,
  //     'entertainment': 200,
  //      ...
  //      'other': 100
  //   }

  const categoryMap: Record<string, number> = {};

  expenseTransactions.map((transaction) => {
    let category = getCategoryName('expense', transaction.category) || "其他";
    let amount = transaction.amount || 0;

    const currentAmount = categoryMap[category] || 0;

    categoryMap[category] = currentAmount + amount;
  });

  //   cong map -> array
  //   [
  //     { name: 'transport', value: 300 },
  //     { name: 'food', value: 500 },
  //     ...
  //   ]

  //  Object.entries：将对象转换为键值对数组
  //  Object.entries(categoryMap) -> [['transport', 300], ['food', 500], ...]

  const colors = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82ca9d",
  ];

  const pieData = Object.entries(categoryMap).map(
    ([categoryName, categoryValue], index) => ({
      name: categoryName,
      value: categoryValue,
      fill: colors[index % colors.length],
    }),
  );

  

  return (
    <Card>
      <CardHeader>
        <CardTitle>支出分类</CardTitle>
      </CardHeader>
      <CardContent>
        {/* ResponsiveContainer 响应式容器 */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            {/* 饼图 */}
            <Pie
              // 饼图数据
              data={pieData}
              // 饼图值
              dataKey="value"
              // 饼图名称
              nameKey="name"
              // 饼图圆心坐标
              cx="50%"
              cy="50%"
              // 外半径
              outerRadius="100"
              // 内部半径
              innerRadius="30"
              // 动画时长 ：毫秒
              animationDuration={500}
              // 动画曲线
              animationEasing="ease-in-out" // 动画曲线 入出
              // label={(props) => {return props.name;}}
              label={(props) => {
                const name = props.name;
                const percent = props.percent;

                if (!percent) {
                  return name;
                }

                return `${name}(${(percent * 100).toFixed(0)}%)`;
              }}
            />

            {/* 图例 说明*/}
            <Legend />

            {/* 提示框 */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderColor: "1px solid #e5e5e5",
              }}
              // 提示框格式化: 用户数 对话数
              formatter={(value, name) => {
                // 计算总数
                // 初始值 0
                // 累加器 sum
                const total = pieData.reduce(
                  (sum: number, item: any) => sum + item.value,
                  0,
                );

                // 计算百分比
                // 保留一位小数
                //  as number 类型断言
                const percent = (
                  (((value as number) / total) as number) * 100
                ).toFixed(1);

                return [`${name}:${value}(${percent}%)`, "模型使用"];
              }
            }
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
