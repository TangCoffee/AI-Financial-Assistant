import request from '@/lib/request'
import { GoalCreate, GoalUpdate } from '@/types/goal'


export const goalApi = {

    list: async () => {
        return request.get("/goals")
    },

    create: async (data: GoalCreate) => {
        return request.post("/goals", data)
    },

    update: async (id: number, data: GoalUpdate) => {
        return request.put(`/goals/${id}`, data)
    },

    delete: async (id: number) => {
        return request.delete(`/goals/${id}`)
    },

}