'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './PremiumButton.module.css';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    isLoading?: boolean;
}

export default function PremiumButton({ children, isLoading, className, ...props }: PremiumButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98, translateY: 2 }}
            className={`${styles.button} ${className || ''}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            <div className={styles.glow} />
            <span className={styles.content}>
                {isLoading ? 'Processing...' : children}
            </span>
        </motion.button>
    );
}
