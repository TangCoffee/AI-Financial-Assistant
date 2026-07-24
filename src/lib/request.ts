
// 请求地址 ： 基础地址 + 接口路径
// 请求方式 ： POST  GET  PUT  DELETE
// 请求数据 ？： 表单数据 
// 请求头 ：  token , json 格式
// 获取token 以及 清除token


// 获取token
const getToken = () => {
    // 浏览器检查 ：是否在浏览器环境中
    if (typeof window !== "undefined") {
        const raw = localStorage.getItem("token")
        if (!raw) return null
        // 兼容新旧格式：如果 token 被 JSON.stringify 包裹过（以引号开头），则先 JSON.parse
        if (raw.startsWith('"')) {
            try { return JSON.parse(raw) } catch { return null }
        }
        return raw
    }
    return null
}


// 封装一个公共请求函数
// endpoint ： 接口路径
// method ： 请求方式
// data ： 请求数据 ？： 表单数据 
// 返回值 ： 响应数据
const baseRequest = async (endpoint: string, method: string, data?: any, stream?: boolean) => {
    const token = getToken()

    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    const config: RequestInit = {
        headers,
        method,
    }

    if (data && (method === "POST" || method === "PUT")) {
        config.body = JSON.stringify(data)
    }

    const response = await fetch(`/api/${endpoint}`, config)
    console.log('请求响应:', response)

    // ✅ 统一处理 401
    if (response.status === 401) {
        localStorage.removeItem("token")
        window.location.href = "/login"
        return Promise.reject(new Error("登录已过期，请重新登录"))
    }

    // 统一请求失败处理
    if (!response.ok) {
        let detail = response.statusText || "Unknown error"
        const errBody = await response.json()
        if (errBody?.message) {
            detail = errBody.message
        }
        throw new Error(detail)
    }

    if (stream) {
        return response
    }

    const result = await response.json()
    console.log('请求成功结果:', result)
    return result
}

export async function postStream(endpoint: string, data?: any) {
        return baseRequest(endpoint,'POST',data,true)
}
export async function postRequest(endpoint: string, data?: any) {
        return baseRequest(endpoint,'POST',data)
}

async function putRequest(endpoint: string, data?: any) {
    return baseRequest(endpoint,'PUT',data)
}

async function deleteRequest(endpoint: string) {
    return baseRequest(endpoint,'DELETE')
}

async function getRequest(endpoint: string) {
    return baseRequest(endpoint,'GET')
}


const request ={
    postStream:postStream,
    post:postRequest,
    put:putRequest,
    delete:deleteRequest,
    get:getRequest,
}

export default request




