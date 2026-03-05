'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, X, Volume2, VolumeX, CloudRain } from 'lucide-react';
import styles from './PomodoroTimer.module.css';

interface PomodoroTimerProps {
    task: any;
    onClose: () => void;
}

export default function PomodoroTimer({ task, onClose }: PomodoroTimerProps) {
    const defaultTime = 25 * 60; // 25 minutes
    const [timeLeft, setTimeLeft] = useState(defaultTime);
    const [isActive, setIsActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
            if (audioRef.current && !isMuted) audioRef.current.play().catch(() => { });
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (audioRef.current) audioRef.current.pause();
            // Optional: Play a ding sound here when finished
        } else {
            if (audioRef.current) audioRef.current.pause();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, isMuted]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(defaultTime);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
        if (audioRef.current) {
            if (!isMuted) audioRef.current.pause();
            else if (isActive) audioRef.current.play().catch(() => { });
        }
    };

    // Calculate progress for SVG circle
    const progress = ((defaultTime - timeLeft) / defaultTime) * 100;
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Free Rain Sound for White Noise */}
            <audio
                ref={audioRef}
                src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=heavy-rain-nature-sounds-8186.mp3"
                loop
            />

            <motion.div
                className={styles.container}
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.header}>
                    <span className={styles.badge}>🎯 Deep Focus</span>
                    <h2>{task.title}</h2>
                </div>

                <div className={styles.timerRing}>
                    <svg width="300" height="300" viewBox="0 0 300 300">
                        {/* Background Ring */}
                        <circle
                            cx="150"
                            cy="150"
                            r={radius}
                            className={styles.ringBg}
                            strokeWidth="12"
                            fill="transparent"
                        />
                        {/* Progress Ring */}
                        <motion.circle
                            cx="150"
                            cy="150"
                            r={radius}
                            className={styles.ringProgress}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: "linear" }}
                            strokeLinecap="round"
                            transform="rotate(-90 150 150)"
                        />
                    </svg>

                    <div className={styles.timeDisplay}>
                        <div className={styles.timeText}>{formatTime(timeLeft)}</div>
                        <div className={styles.statusText}>{isActive ? 'Focusing...' : 'Paused'}</div>
                    </div>
                </div>

                <div className={styles.controls}>
                    <button className={styles.iconBtn} onClick={toggleMute} title="Toggle White Noise">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        {!isMuted && <CloudRain size={14} className={styles.rainIcon} />}
                    </button>

                    <button className={styles.playBtn} onClick={toggleTimer}>
                        {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className={styles.playNudge} />}
                    </button>

                    <button className={styles.iconBtn} onClick={resetTimer} title="Reset">
                        <Square size={20} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
