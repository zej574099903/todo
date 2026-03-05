'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import PremiumButton from '@/components/PremiumButton';
import { useLanguage } from '@/components/LanguageProvider';
import styles from '../page.module.css';

export default function RegisterPage() {
    const { t } = useLanguage();
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMap: Record<string, string> = {
                    'ALREADY_EXISTS': t.errors.exists,
                    'REQUIRED': t.errors.required,
                    'SERVER_ERROR': t.errors.server
                };
                throw new Error(errorMap[data.error] || t.errors.default);
            }

            // Registration successful, show success view
            setIsSuccess(true);
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
            <div className={styles.ambientGlow} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={styles.loginContainer}
            >
                <div className={styles.avatarSection}>
                    <Avatar isPasswordFocused={isPasswordFocused} />
                </div>

                <div className={styles.glassCard}>
                    <div className={styles.cardHeader}>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {isSuccess ? t.register.successViewTitle : t.register.title}
                        </motion.h1>
                        <p className={styles.subtitle}>
                            {isSuccess ? t.register.successViewMessage : t.register.subtitle}
                        </p>
                    </div>

                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '10px 0 20px' }}
                        >
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '32px',
                                background: 'rgba(0, 240, 255, 0.1)', border: '2px solid var(--neon-accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px',
                                boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)'
                            }}>
                                <div style={{ width: '22px', height: '12px', borderBottom: '3px solid var(--neon-accent)', borderLeft: '3px solid var(--neon-accent)', transform: 'rotate(-45deg)', marginTop: '-4px' }} />
                            </div>
                            <Link href="/" style={{
                                display: 'block', padding: '14px 24px', background: 'var(--neon-accent)',
                                color: '#000', fontWeight: 600, borderRadius: '12px', textDecoration: 'none',
                                boxShadow: '0 4px 15px rgba(0, 240, 255, 0.3)', transition: 'transform 0.2s'
                            }}>
                                {t.register.goToLogin}
                            </Link>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleRegister} className={styles.form}>
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
                                        color: '#ff6b6b',
                                        fontSize: '14px',
                                        boxShadow: '0 4px 12px rgba(255, 60, 60, 0.1)'
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
                                        placeholder={t.register.usernamePlaceholder}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={styles.input}
                                        required
                                        onFocus={() => setIsPasswordFocused(false)}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.inputIcon} size={20} />
                                    <input
                                        type="email"
                                        placeholder={t.register.emailPlaceholder}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={styles.input}
                                        onFocus={() => setIsPasswordFocused(false)}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.inputIcon} size={20} />
                                    <input
                                        type="password"
                                        placeholder={t.register.passwordPlaceholder}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={styles.input}
                                        required
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(password.length > 0)}
                                    />
                                </div>
                            </div>

                            <PremiumButton type="submit" isLoading={isLoading} style={{ marginTop: '8px' }}>
                                {t.register.signUp}
                            </PremiumButton>
                        </form>
                    )}

                    {!isSuccess && (
                        <div className={styles.footer}>
                            <p>{t.register.hasAccount} <Link href="/" className={styles.link}>{t.register.signIn}</Link></p>
                        </div>
                    )}
                </div>
            </motion.div>
        </main>
    );
}
