'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
    isPasswordFocused: boolean;
}

export default function Avatar({ isPasswordFocused }: AvatarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isPasswordFocused || !containerRef.current) return;

            const { left, top, width, height } = containerRef.current.getBoundingClientRect();
            const centerX = left + width / 2;
            const centerY = top + height / 2;

            // Calculate normalized mouse position (-1 to 1) Limit tracking radius
            const maxDistance = 400;
            const dx = Math.max(-1, Math.min(1, (e.clientX - centerX) / maxDistance));
            const dy = Math.max(-1, Math.min(1, (e.clientY - centerY) / maxDistance));

            setMousePos({ x: dx, y: dy });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isPasswordFocused]);

    // Eye movement mapping
    const eyeX = mousePos.x * 6;
    const eyeY = mousePos.y * 6;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                zIndex: 10,
                margin: '0 auto',
            }}
        >
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Base Body - Minimalist Cyber Pet */}
                <circle cx="60" cy="60" r="50" fill="rgba(13, 15, 23, 0.9)" />
                <circle cx="60" cy="60" r="49" stroke="url(#gradient)" strokeWidth="2" />

                {/* Inner Screen/Face area */}
                <rect x="25" y="35" width="70" height="50" rx="20" fill="#0A0C11" />
                <rect x="25" y="35" width="70" height="50" rx="20" stroke="rgba(0, 240, 255, 0.2)" strokeWidth="1" />

                {/* Normal Tracking Eyes */}
                <motion.g
                    initial={false}
                    animate={{ opacity: isPasswordFocused ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Left Eye Whites */}
                    <circle cx="45" cy="60" r="8" fill="#FFF" />
                    {/* Left Pupil */}
                    <motion.circle
                        animate={{ cx: 45 + eyeX, cy: 60 + eyeY }}
                        r="4"
                        fill="#0D0F17"
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    />

                    {/* Right Eye Whites */}
                    <circle cx="75" cy="60" r="8" fill="#FFF" />
                    {/* Right Pupil */}
                    <motion.circle
                        animate={{ cx: 75 + eyeX, cy: 60 + eyeY }}
                        r="4"
                        fill="#0D0F17"
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    />
                </motion.g>

                {/* Closed Eyes Effect (Shy / Cute) & Blush */}
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                        opacity: isPasswordFocused ? 1 : 0,
                        scale: isPasswordFocused ? 1 : 0.8
                    }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Cute closed eyes: > < shape */}
                    <path d="M 40 56 L 50 60 L 40 64" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 80 56 L 70 60 L 80 64" stroke="#00f0ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Glowing shy cheeks */}
                    <ellipse cx="38" cy="68" rx="6" ry="3" fill="rgba(255, 105, 180, 0.7)" filter="blur(2px)" />
                    <ellipse cx="82" cy="68" rx="6" ry="3" fill="rgba(255, 105, 180, 0.7)" filter="blur(2px)" />
                </motion.g>

                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff" />
                        <stop offset="100%" stopColor="#ff00ff" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
