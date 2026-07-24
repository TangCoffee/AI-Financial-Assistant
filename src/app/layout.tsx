import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";


export const metadata: Metadata = {
  title: "AI 智能助手",
  description: "AI 智能助手平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"            // 通过 <html class="dark"> 切换
          defaultTheme="system"        // 默认跟随系统设置
          disableTransitionOnChange    // 切换时禁用过渡动画
          enableSystem                 // 允许跟随系统偏好
         >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
