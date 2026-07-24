"use client";
import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserRoundKey } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Toaster } from 'sonner';
import { useRouter } from 'next/navigation';


export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const router = useRouter();

    // 登录状态
    const [isAuth, setIsAuthed] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 获取登录状态
        const token = localStorage.getItem("token");
        const userInfo = localStorage.getItem("userInfo");

        if (token && userInfo) {
            setIsAuthed(true);
            setUser(JSON.parse(userInfo));
        } else {
            setIsAuthed(false);
        }
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            // 骨架屏 不需要显示loading 内容
            <div className="flex items-center justify-center gap-4 h-screen">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }


    if (!isAuth) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <Card className="text-center">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">无权限访问</CardTitle>
                            <CardDescription>您需要先登录才能访问此页面</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                            <div className="flex justify-center">
                                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                                    <UserRoundKey className="h-12 w-12 text-muted-foreground" />
                                </div>
                            </div>
                            <p className="text-muted-foreground">
                                您当前未登录，无法访问首页内容。请登录后再尝试访问。
                            </p>
                            <Button asChild>
                                <Link href="/login">立即登录</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }


    return (

        <SidebarProvider>
            {/* 侧边栏 */}
            <AppSidebar userInfo={user} />

            {/* 主内容区域 */}
            <SidebarInset >
                <Toaster position="top-center" />
                {children}
            </SidebarInset >
        </SidebarProvider>
    )
}