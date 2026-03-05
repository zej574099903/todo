'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { useLanguage } from '@/components/LanguageProvider';
import styles from '../page.module.css';

export default function ForgotPasswordPage() {
    const { t } = useLanguage();

    return (
        <main className={styles.main}>
            {/* Left Panel */}
            <div className={styles.leftPanel}>
                <div className={styles.avatarIsland}>
                    <Avatar isPasswordFocused={false} />
                </div>
                <div className={styles.welcomeText}>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {t.forgot.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {t.forgot.adminContact}
                    </motion.p>
                </div>
            </div>

            {/* Right Panel */}
            <div className={styles.rightPanel}>
                <motion.div
                    initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={styles.loginContainer}
                >
                    <div className={styles.glassCard}>
                        <div className={styles.cardHeader}>
                            <h2>{t.forgot.title}</h2>
                        </div>

                        <div style={{ textAlign: 'center', margin: '30px 0', padding: '24px', background: 'rgba(240, 240, 240, 0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.6)' }}>
                            <ShieldAlert size={48} color="rgba(255, 159, 67, 1)" style={{ marginBottom: '16px', opacity: 0.9 }} />
                            <p style={{ color: '#4a4a4a', fontSize: '15px', lineHeight: '1.6', fontWeight: 600 }}>
                                {t.forgot.securityNotice}
                            </p>
                            <p style={{ color: '#636e72', fontSize: '14px', marginTop: '12px' }}>
                                {t.forgot.contactAdmin}
                            </p>
                        </div>

                        <div className={styles.footer} style={{ marginTop: '24px' }}>
                            <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#636e72', transition: 'color 0.2s', fontWeight: 600, textDecoration: 'none' }}>
                                <ArrowLeft size={16} />
                                <span className={styles.link} style={{ marginLeft: 0 }}>{t.forgot.backToLogin}</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
