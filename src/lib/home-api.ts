import {chatApi} from './chat-api'
import { goalApi } from './goal-api'
import {transactionApi} from './transaction-api'

export const homeApi = {

    // 获取交易列表数据（用于分析）
    getTransactions: async () => {
        return transactionApi.list()
    },

    // 获取目标列表数据（用于分析）
    getGoals: async () => {
        return goalApi.list()
    },

    // 获取首页数据
   getSuggestions:async () => {
       return chatApi.getSuggestion()
   },
}