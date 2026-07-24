import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarMenuItem,
    SidebarMenu,
    SidebarHeader,
    SidebarMenuButton,
    useSidebar,
    SidebarGroup,
    SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
    DropdownMenu, DropdownMenuTrigger,
    DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { GalleryVerticalEnd, Moon, Sun, LogOut, Sparkles, BadgeCheck, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings2, ArrowRightLeft, Target, MessageCircle } from "lucide-react";

export function AppSidebar(props: { userInfo: any }) {
    const router = useRouter();
    const { isMobile } = useSidebar()
    const { theme, setTheme } = useTheme();

    const { nickname, email } = props.userInfo || {};

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    }
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        document.cookie = "token=; path=/; max-age=0";
        router.replace("/login");
    }

    const menus = [
        {
            title: "首页",
            url: "/",
            icon: Settings2,
            isActive: true,
        },
        {
            title: "交易管理",
            url: "/transactions",
            icon: ArrowRightLeft,
            isActive: true,
        },
        {
            title: "储蓄目标",
            url: "/goals",
            icon: Target,
            isActive: true,
        },
        {
            title: "智能教练",
            url: "/coach",
            icon: MessageCircle,
            isActive: true,
        },
    ];

    return (
        <Sidebar>
            <SidebarHeader >
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <GalleryVerticalEnd className="size-4" />
                            </div>

                            <div className="ml-2 flex flex-col items-start">
                                <span className="font-bold">Smart-Wealth</span>
                                <span className="text-xs">智能财富管理</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup />
                <SidebarGroupLabel>platform</SidebarGroupLabel>
                <SidebarMenu>
                    {
                        menus.map((menu) => (
                            <Link key={menu.url} href={menu.url}>
                                <SidebarMenuButton>
                                    <menu.icon className="size-4" />
                                    <span className="ml-2">{menu.title}</span>
                                </SidebarMenuButton>
                            </Link>
                        ))
                    }
                </SidebarMenu>
                <SidebarGroup />
            </SidebarContent>

            <SidebarFooter >
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar>
                                        <AvatarImage src="https://img0.baidu.com/it/u=197317906,3074320042&fm=253&fmt=auto&app=138&f=PNG?w=500&h=500" />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>

                                    <div className="ml-2 flex flex-col items-start">
                                        <span className="font-bold">
                                            {nickname}
                                        </span>
                                        <span className="text-xs">
                                            {email}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            {/* 触发后弹出：菜单内容 */}
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                align="start"
                                // 响应式适配：手机端弹出在底部
                                side={isMobile ? "bottom" : "right"}
                                sideOffset={8}
                            >
                                <DropdownMenuLabel>
                                    <div className="flex items-center gap-2 text-left text-sm">
                                        {/* 头像 */}
                                        <Avatar>
                                            <AvatarImage src="https://img0.baidu.com/it/u=197317906,3074320042&fm=253&fmt=auto&app=138&f=PNG?w=500&h=500" />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-2 flex flex-col items-start">
                                            <span className="font-bold">
                                                {nickname}
                                            </span>
                                            <span className="text-xs">
                                                {email}
                                            </span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {/* 升级 */}
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <Sparkles />
                                        升级到专业版
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                {/* 账户、通知 */}
                                <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        <BadgeCheck />
                                        账户
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Bell />
                                        通知
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                {/* 切换主题 */}
                                <DropdownMenuItem onClick={toggleTheme}>
                                    {theme === "dark" ? <Sun /> : <Moon />}
                                    {theme === "dark" ? "浅色模式" : "深色模式"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* 退出登录 */}
                                <DropdownMenuItem onClick={logout}>
                                    <LogOut />
                                    退出登录
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}