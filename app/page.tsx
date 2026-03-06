'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import PremiumButton from '@/components/PremiumButton';
import { useLanguage } from '@/components/LanguageProvider';
import styles from './page.module.css';

export default function LoginPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleTyping = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value);
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 200);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMap: Record<string, string> = {
                    'INVALID_CREDENTIALS': t.errors.auth,
                    'REQUIRED': t.errors.required,
                    'SERVER_ERROR': t.errors.server
                };
                throw new Error(errorMap[data.error] || t.errors.default);
            }

            router.push('/tasks');
        } catch (err: any) {
            if (err instanceof TypeError || err.name === 'TypeError') {
                setError(t.errors.network);
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.main}>
            <div className={styles.leftPanel}>
                <div className={styles.avatarIsland}>
                    <Avatar isPasswordFocused={isPasswordFocused} isTyping={isTyping} />
                </div>
                <div className={styles.welcomeText}>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {t.login.welcome}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {t.login.subtitle}
                    </motion.p>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <motion.div
                    initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={styles.loginContainer}
                >
                    <div className={styles.glassCard} style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                        <div className={styles.cardHeader}>
                            <h2>{t.login.signIn || 'Sign In'}</h2>
                        </div>

                        <form onSubmit={handleLogin} className={styles.form}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{
                                        opacity: 1,
                                        x: [0, -10, 10, -10, 10, 0],
                                    }}
                                    transition={{ duration: 0.4 }}
                                    style={{
                                        background: 'rgba(255, 60, 60, 0.1)',
                                        border: '1px solid rgba(255, 60, 60, 0.3)',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#ff4757',
                                        fontSize: '14px',
                                    }}
                                >
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className={styles.inputGroup}>
                                <div className={styles.inputWrapper}>
                                    <User className={styles.inputIcon} size={20} />
                                    <input
                                        type="text"
                                        placeholder={t.login.usernamePlaceholder}
                                        value={username}
                                        onChange={(e) => handleTyping(setUsername, e.target.value)}
                                        className={styles.input}
                                        required
                                        onFocus={() => setIsPasswordFocused(false)}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.inputIcon} size={20} />
                                    <input
                                        type="password"
                                        placeholder={t.login.passwordPlaceholder}
                                        value={password}
                                        onChange={(e) => handleTyping(setPassword, e.target.value)}
                                        className={styles.input}
                                        required
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(password.length > 0)}
                                    />
                                </div>
                            </div>

                            <div className={styles.forgotPassword}>
                                <Link href="/forgot-password">{t.login.forgotPassword}</Link>
                            </div>

                            <PremiumButton type="submit" isLoading={isLoading} className={styles.loginButton}>
                                {t.login.signIn}
                            </PremiumButton>
                        </form>

                        <div className={styles.footer}>
                            <p>{t.login.noAccount} <Link href="/register" className={styles.link}>{t.login.signUp}</Link></p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
