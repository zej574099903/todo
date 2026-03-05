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
            <div className={styles.ambientGlow} />

            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={styles.loginContainer}
            >
                <div className={styles.avatarSection}>
                    <Avatar isPasswordFocused={false} />
                </div>

                <div className={styles.glassCard}>
                    <div className={styles.cardHeader}>
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {t.forgot.title}
                        </motion.h1>
                        <p className={styles.subtitle}>
                            {t.forgot.adminContact}
                        </p>
                    </div>

                    <div style={{ textAlign: 'center', margin: '30px 0', padding: '24px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <ShieldAlert size={48} color="var(--neon-accent)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                        <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6' }}>
                            {t.forgot.securityNotice}
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px' }}>
                            {t.forgot.contactAdmin}
                        </p>
                    </div>

                    <div className={styles.footer} style={{ marginTop: '24px' }}>
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
                            <ArrowLeft size={16} />
                            <span className={styles.link} style={{ marginLeft: 0 }}>{t.forgot.backToLogin}</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
