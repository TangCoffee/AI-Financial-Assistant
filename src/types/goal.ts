
export interface GoalCreate {
    title: string ;
    target_amount: number;
    current_amount?: number | null;
    deadline?: string | null; 
    type?:string | undefined;
}

export interface GoalUpdate {
    title?: string ;
    target_amount?: number;
    current_amount?: number | null;
    deadline?: string | null; 
    type?:string| undefined;
}


export interface GoalResponse  extends GoalCreate{
    id: number;
    create_at: string;
}


// 计算完成百分比
export const calculateProgress = (current: number, target: number): number => {
    if (target <= 0) return 0;
    
    // Math.min :约束完成百分比不超过100%
    return Math.min((current / target) * 100, 100);
  };

// 获取剩余天数
export const getRemainingDays = (deadline: string): number => {
    if (!deadline) return -1;
    const today = new Date();  // 获取当前日期实例
    const deadlineDate = new Date(deadline); // 将截止日期字符串转换为日期实例

    // getTime() :返回自1970年1月1日00:00:00 UTC以来的毫秒数。
    // 通过比较两个日期的getTime()值，可以计算出它们之间的时间差。
    const diffTime = deadlineDate.getTime() - today.getTime();

    // 1000 * 60 * 60 * 24 一天的毫秒数
    // diffTime ：毫秒数的差额
    // Math.ceil() :向上取整，确保即使剩余时间不足一天也会显示为1天，而不是0天。
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };


// 格式化金额
export const formatAmount = (amount: number): string => {
    return `¥${amount.toFixed(2)}`;
  };
  
  