'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh' | 'en';

export const translations = {
    zh: {
        login: {
            welcome: "欢迎回来",
            subtitle: "请输入您的账号信息以访问待办事项。",
            usernamePlaceholder: "用户名 / 账号",
            passwordPlaceholder: "密码",
            forgotPassword: "忘记密码？",
            signIn: "登录",
            noAccount: "还没有账号？",
            signUp: "立即注册",
            successMsg: "登录成功，正在跳转..."
        },
        register: {
            title: "创建账号",
            subtitle: "加入我们，高效率规划你的每一天。",
            usernamePlaceholder: "用户名",
            emailPlaceholder: "邮箱地址 (可选)",
            passwordPlaceholder: "密码",
            signUp: "注册",
            hasAccount: "已有账号？",
            signIn: "返回登录",
            successMsg: "注册成功，请登录",
            successViewTitle: "注册成功！",
            successViewMessage: "您的账号已成功创建，现在可以登录并开始使用了。",
            goToLogin: "前往登录"
        },
        forgot: {
            title: "重置密码",
            adminContact: "请联系管理员获取支持",
            securityNotice: "出于安全策略，自助密码重置功能已关闭。",
            contactAdmin: "请联系系统管理员为您重置密码。",
            backToLogin: "返回登录",
            sendLink: "发送重置链接",
            accountPlaceholder: "用户名 / 账号"
        },
        tasks: {
            greeting: "你好，",
            taskCount_zero: "今天没有待办事项！来放松一下吧 ✨",
            taskCount_has: "今天你还有 ",
            taskCount_tasks: " 个任务待完成。",
            inputPlaceholder: "输入你想做的事... 然后按回车键 (Enter)",
            addingPlaceholder: "正在添加中...",
            signOut: "退出",
            emptyState: "太棒了！所有任务都已清空 ✨",
            priority: {
                high: "🔴 高优",
                medium: "🟡 中优",
                low: "🟢 低优",
                none: "⚪ 普通"
            },
            filters: {
                allPriorities: "所有优先级",
                allCategories: "全部分类"
            },
            settings: {
                button: "更改密码",
                changePassword: "修改密码",
                currentPassword: "当前密码",
                newPassword: "新密码",
                confirmPassword: "确认新密码",
                save: "保存更改",
                cancel: "取消",
                success: "密码修改成功",
                errorMatch: "两次输入的新密码不一致",
                errorLength: "密码长度至少需要 6 位"
            }
        },
        errors: {
            default: "操作失败，请重试",
            network: "网络连接失败，请检查网络设置",
            server: "服务器无响应，请稍后再试",
            auth: "用户名或密码错误",
            exists: "该用户名已被注册",
            required: "请填写所有必填字段"
        }
    },
    en: {
        login: {
            welcome: "Welcome Back",
            subtitle: "Enter your account details to access your tasks.",
            usernamePlaceholder: "Username / Account",
            passwordPlaceholder: "Password",
            forgotPassword: "Forgot password?",
            signIn: "Sign In",
            noAccount: "Don't have an account?",
            signUp: "Sign up",
            successMsg: "Login success, redirecting..."
        },
        register: {
            title: "Create Account",
            subtitle: "Join us and get your tasks organized.",
            usernamePlaceholder: "Username",
            emailPlaceholder: "Email Address (Optional)",
            passwordPlaceholder: "Password",
            signUp: "Sign Up",
            hasAccount: "Already have an account?",
            signIn: "Sign in",
            successMsg: "Register success, please login",
            successViewTitle: "Registration Successful!",
            successViewMessage: "Your account has been created successfully. You can now log in.",
            goToLogin: "Go to Login"
        },
        forgot: {
            title: "Reset Password",
            adminContact: "Contact administrator for support",
            securityNotice: "For security reasons, self-service password reset is disabled.",
            contactAdmin: "Please contact the system administrator to reset your password.",
            backToLogin: "Back to Sign In",
            sendLink: "Send Reset Link",
            accountPlaceholder: "Username / Account"
        },
        tasks: {
            greeting: "Hello, ",
            taskCount_zero: "No tasks for today! Time to relax ✨",
            taskCount_has: "You have ",
            taskCount_tasks: " tasks remaining today.",
            inputPlaceholder: "What needs to be done? Press Enter to add...",
            addingPlaceholder: "Adding task...",
            signOut: "Sign Out",
            emptyState: "Awesome! All tasks are cleared ✨",
            priority: {
                high: "🔴 High",
                medium: "🟡 Medium",
                low: "🟢 Low",
                none: "⚪ Normal"
            },
            filters: {
                allPriorities: "All Priorities",
                allCategories: "All Categories"
            },
            settings: {
                button: "Settings",
                changePassword: "Change Password",
                currentPassword: "Current Password",
                newPassword: "New Password",
                confirmPassword: "Confirm New Password",
                save: "Save Changes",
                cancel: "Cancel",
                success: "Password updated successfully",
                errorMatch: "New passwords do not match",
                errorLength: "Password must be at least 6 characters"
            }
        },
        errors: {
            default: "Action failed, please try again",
            network: "Network connection failed",
            server: "Server is not responding",
            auth: "Invalid username or password",
            exists: "Username already exists",
            required: "Please fill in all required fields"
        }
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: typeof translations['zh'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('zh');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('app-lang') as Language;
        if (saved) setLanguage(saved);
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('app-lang', lang);
    };

    const val = {
        language: mounted ? language : 'zh',
        setLanguage: handleSetLanguage,
        t: mounted ? translations[language] : translations['zh']
    };

    return (
        <LanguageContext.Provider value={val}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
