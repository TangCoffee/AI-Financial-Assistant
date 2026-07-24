import request from './request'
import { TransactionCreate, TransactionUpdate } from '@/types/transaction'


export  const transactionApi = {
    // 交易列表
    list:async ()=>{
        return request.get('/transactions')
    },
    
    // 创建交易记录
    create: async (data: TransactionCreate) => {
        return request.post("/transactions", data)
    },

    // 更新交易记录
    update: async (id: number, data: TransactionUpdate) => {
        return request.put(`/transactions/${id}`, data)
    },

    // 删除交易记录
    delete: async (id: number) => {
        return request.delete(`/transactions/${id}`)
    },
}