'use client'

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription,
} from "@/components/ui/field";
import { useState } from "react"
import Link from "next/link";
import { authApi } from "@/lib/auth-api";
import { useRouter } from "next/navigation";


export function SignupForm() {
    const [error, setError] = useState("");
    const [success, seSuccess] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        // console.log(id, value);

        setFormData({
            ...formData,
            [id]: value,
        });
    };

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault()

        // value 去除空格
        const name = formData.name.trim();
        const email = formData.email.trim();
        const password = formData.password.trim();
        const confirmPassword = formData.confirmPassword.trim();

        if (!name || !email || !password || !confirmPassword) {
            //   alert("请填写完整信息");
            setError("请填写完整信息");
            return;
        }

        if (password.length < 8) {
            //   alert("密码长度至少8位字符");
            setError("密码长度至少8位字符");
            return;
        }

        // 密码和确认密码一致检查
        if (password !== confirmPassword) {
            //   alert("密码和确认密码不一致");
            setError("密码和确认密码不一致");
            return;
        }

        const data = {
            name,
            email,
            password,
        };



        await authApi.register(data)
       
        seSuccess("注册成功");

        setTimeout(() => {
            setError("");
            seSuccess("");
            router.replace("/login");
        }, 1000);
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>注册账号</CardTitle>
                <CardDescription>输入一下信息完成用户创建</CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
                            {success}
                        </div>
                    )}
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="name">
                                昵称<span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="name"
                                placeholder="昵称"
                                required
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <FieldDescription>昵称至少2个字符以上.</FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="email">
                                邮箱<span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="email"
                                placeholder="demo@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="password">
                                密码<span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                placeholder="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <FieldDescription>密码长度至少8位字符</FieldDescription>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="confirmPassword">
                                确认密码<span className="text-destructive">*</span>
                            </FieldLabel>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field>
                            <Button type="submit" className="w-full">
                                创建账号
                            </Button>
                            <FieldDescription className="text-center">
                                如果已经有账号？ <Link href="/login">登录</Link>
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )

}