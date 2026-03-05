'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AvatarProps {
    isPasswordFocused: boolean;
    isTyping?: boolean; // Toggles whenever user presses a key in username field
}

export default function Avatar({ isPasswordFocused, isTyping }: AvatarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Smooth pararlax values
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 25, stiffness: 150 };
    const pX = useSpring(mouseX, springConfig);
    const pY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isPasswordFocused || !containerRef.current) return;

            const { left, top, width, height } = containerRef.current.getBoundingClientRect();
            const centerX = left + width / 2;
            const centerY = top + height / 2;

            const maxDistance = window.innerWidth / 2;
            const dx = Math.max(-1, Math.min(1, (e.clientX - centerX) / maxDistance));
            const dy = Math.max(-1, Math.min(1, (e.clientY - centerY) / maxDistance));

            setMousePos({ x: dx, y: dy });
            mouseX.set(dx);
            mouseY.set(dy);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isPasswordFocused, mouseX, mouseY]);

    const eyeX = mousePos.x * 12;
    const eyeY = mousePos.y * 12;

    const characters = [
        { id: 1, cx: 100, cy: 110, r: 60, color: '#FFD32A', blush: '#FFA801', eyeOffset: -15, type: 'blob', parallaxFactor: 10 },
        { id: 2, cx: 250, cy: 90, r: 75, color: '#48DBFB', blush: '#0ABDE3', eyeOffset: -5, type: 'round', parallaxFactor: 20 },
        { id: 3, cx: 400, cy: 120, r: 50, color: '#FF9FF3', blush: '#F368E0', eyeOffset: -10, type: 'triangle', parallaxFactor: 15 },
    ];

    const renderShape = (char: any) => {
        switch (char.type) {
            case 'blob':
                return <rect x={char.cx - char.r * 0.9} y={char.cy - char.r * 0.8} width={char.r * 1.8} height={char.r * 1.6} rx={char.r * 0.4} fill={char.color} />;
            case 'triangle':
                return (
                    <path
                        d={`M ${char.cx} ${char.cy - char.r * 0.75} L ${char.cx + char.r * 0.75} ${char.cy + char.r * 0.6} L ${char.cx - char.r * 0.75} ${char.cy + char.r * 0.6} Z`}
                        fill={char.color}
                        stroke={char.color}
                        strokeWidth={char.r * 0.4}
                        strokeLinejoin="round"
                    />
                );
            case 'round':
            default:
                return <circle cx={char.cx} cy={char.cy} r={char.r} fill={char.color} />;
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                maxWidth: '500px',
                aspectRatio: '25/11',
                zIndex: 10,
                margin: '0 auto',
                perspective: 1000 // Enable 3D perspective
            }}
        >
            <svg viewBox="0 0 500 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {characters.map((char, index) => {
                    // Parallax transforms based on mouse spring position (reduced intensity for smoothness)
                    const translateX = useTransform(pX, [-1, 1], [-char.parallaxFactor, char.parallaxFactor]);
                    const translateY = useTransform(pY, [-1, 1], [-char.parallaxFactor, char.parallaxFactor]);
                    const rotateY = useTransform(pX, [-1, 1], [-6, 6]);
                    const rotateX = useTransform(pY, [-1, 1], [6, -6]);

                    // Typing reactivity: smooth bop down when typing
                    const ySpring = isTyping ? 8 : 0;
                    // Fix: Spring doesn't support 3 keyframes. If typing, scale down. If not, normal.
                    const scaleY = isTyping ? 0.9 : 1;
                    const scaleX = isTyping ? 1.05 : 1;

                    return (
                        <motion.g
                            key={char.id}
                            style={{
                                x: translateX,
                                y: translateY,
                                rotateX,
                                rotateY,
                                originX: `${char.cx}px`,
                                originY: `${char.cy}px`
                            }}
                            transition={{
                                type: 'spring',
                                damping: 14,
                                stiffness: 200,
                                mass: 0.8
                            }}
                        >
                            {/* Inner breathing animation layer (separated from physics hover layer to prevent conflict/jitter) */}
                            <motion.g
                                animate={{
                                    y: [ySpring, -8 + ySpring, ySpring],
                                    scaleY: scaleY,
                                    scaleX: scaleX
                                }}
                                transition={{
                                    y: { repeat: Infinity, duration: 4 + index * 0.5, ease: "easeInOut", delay: index * 0.4 },
                                    scaleY: { type: 'spring', damping: 12, stiffness: 250 },
                                    scaleX: { type: 'spring', damping: 12, stiffness: 250 }
                                }}
                                style={{
                                    originX: `${char.cx}px`,
                                    originY: `${char.cy + char.r}px` // scale from bottom
                                }}
                            >
                                {/* Body shadow - stays relative to parent slightly offset by parallax */}
                                <motion.ellipse
                                    style={{ x: useTransform(pX, [-1, 1], [char.parallaxFactor * 0.5, -char.parallaxFactor * 0.5]) }}
                                    cx={char.cx}
                                    cy={char.cy + char.r + 10}
                                    rx={char.r * 0.8} ry="8"
                                    fill="rgba(0,0,0,0.06)"
                                />

                                {/* Invisible hit box for stable hover preventing jitter between avatars */}
                                <rect x={char.cx - char.r - 10} y={char.cy - char.r - 20} width={char.r * 2 + 20} height={char.r * 2 + 40} fill="transparent" />

                                {/* Body Shape */}
                                {renderShape(char)}

                                {/* Top Highlights for depth */}
                                {char.type === 'round' && (
                                    <path d={`M ${char.cx - char.r * 0.5} ${char.cy - char.r * 0.5} Q ${char.cx} ${char.cy - char.r * 0.8} ${char.cx + char.r * 0.5} ${char.cy - char.r * 0.5}`} stroke="rgba(255,255,255,0.5)" strokeWidth="6" strokeLinecap="round" fill="none" />
                                )}
                                {char.type === 'blob' && (
                                    <path d={`M ${char.cx - char.r * 0.5} ${char.cy - char.r * 0.5} L ${char.cx + char.r * 0.3} ${char.cy - char.r * 0.5}`} stroke="rgba(255,255,255,0.5)" strokeWidth="6" strokeLinecap="round" fill="none" />
                                )}
                                {char.type === 'triangle' && (
                                    <path d={`M ${char.cx - char.r * 0.2} ${char.cy - char.r * 0.5} L ${char.cx + char.r * 0.2} ${char.cy - char.r * 0.1}`} stroke="rgba(255,255,255,0.5)" strokeWidth="5" strokeLinecap="round" fill="none" />
                                )}

                                {/* Eyes (Tracking logic applies only if NOT password focused) */}
                                <motion.g animate={{ opacity: isPasswordFocused ? 0 : 1 }} transition={{ duration: 0.2 }}>
                                    {/* Whites */}
                                    <circle cx={char.cx - 18} cy={char.cy + char.eyeOffset} r="14" fill="#FFF" />
                                    <circle cx={char.cx + 18} cy={char.cy + char.eyeOffset} r="14" fill="#FFF" />

                                    {/* Pupils tracking */}
                                    <motion.circle
                                        animate={{
                                            cx: char.cx - 18 + (!isPasswordFocused ? eyeX : 0),
                                            cy: char.cy + char.eyeOffset + (!isPasswordFocused ? eyeY : 0)
                                        }}
                                        r="6" fill="#2D3436"
                                        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.5 }}
                                    />
                                    <motion.circle
                                        animate={{
                                            cx: char.cx + 18 + (!isPasswordFocused ? eyeX : 0),
                                            cy: char.cy + char.eyeOffset + (!isPasswordFocused ? eyeY : 0)
                                        }}
                                        r="6" fill="#2D3436"
                                        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.5 }}
                                    />
                                </motion.g>

                                {/* Closed Eyes / Happy Eyes */}
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: (isPasswordFocused || isTyping) ? 1 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <path d={`M ${char.cx - 28} ${char.cy + char.eyeOffset + 5} Q ${char.cx - 18} ${char.cy + char.eyeOffset - 12} ${char.cx - 8} ${char.cy + char.eyeOffset + 5}`} stroke="#2D3436" strokeWidth="4" strokeLinecap="round" fill="none" />
                                    <path d={`M ${char.cx + 8} ${char.cy + char.eyeOffset + 5} Q ${char.cx + 18} ${char.cy + char.eyeOffset - 12} ${char.cx + 28} ${char.cy + char.eyeOffset + 5}`} stroke="#2D3436" strokeWidth="4" strokeLinecap="round" fill="none" />
                                </motion.g>

                                {/* Mouth */}
                                {!isPasswordFocused ? (
                                    <motion.g
                                        animate={{ scaleY: isTyping ? 0.3 : 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        style={{ originX: `${char.cx}px`, originY: `${char.cy + char.eyeOffset + 25}px` }}
                                    >
                                        <path
                                            d={`M ${char.cx - 12} ${char.cy + char.eyeOffset + 25} Q ${char.cx} ${char.cy + char.eyeOffset + 40} ${char.cx + 12} ${char.cy + char.eyeOffset + 25}`}
                                            stroke="#2D3436" strokeWidth="4" strokeLinecap="round" fill="none"
                                        />
                                    </motion.g>
                                ) : (
                                    // 'o' shaped mouth when password focused
                                    <motion.ellipse
                                        animate={{ rx: isTyping ? 8 : 6, ry: isTyping ? 10 : 8 }}
                                        cx={char.cx} cy={char.cy + char.eyeOffset + 28}
                                        fill="#2D3436"
                                    />
                                )}

                                {/* Blushes */}
                                <ellipse cx={char.cx - 32} cy={char.cy + char.eyeOffset + 15} rx="10" ry="5" fill={char.blush} opacity="0.6" />
                                <ellipse cx={char.cx + 32} cy={char.cy + char.eyeOffset + 15} rx="10" ry="5" fill={char.blush} opacity="0.6" />
                            </motion.g>
                        </motion.g>
                    );
                })}
            </svg>
        </div>
    );
}
