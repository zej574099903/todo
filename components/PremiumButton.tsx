'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './PremiumButton.module.css';

interface PremiumButtonProps extends HTMLMotionProps<'button'> {
    children: React.ReactNode;
    isLoading?: boolean;
}

export default function PremiumButton({ children, isLoading, className, ...props }: PremiumButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98, translateY: 2 }}
            className={`${styles.button} ${className || ''}`}
            {...(props as any)}
            disabled={isLoading || props.disabled}
        >
            <div className={styles.glow} />
            <span className={styles.content}>
                {isLoading ? 'Processing...' : (children as React.ReactNode)}
            </span>
        </motion.button>
    );
}
