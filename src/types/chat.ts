
export interface ChatRequest { 
    message: string
}


export interface ChatResponse { 
    message: string
}


export interface ChatMessage {
    id: string;
    role: 'user' | 'system' | 'assistant';
    content: string;
    timestamp: Date;
}


