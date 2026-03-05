'use client';

import React from 'react';
import { useLanguage } from './LanguageProvider';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
            style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '8px 16px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--neon-accent)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
        >
            <Globe size={16} />
            <span>{language === 'zh' ? 'EN' : '中文'}</span>
        </button>
    );
}
