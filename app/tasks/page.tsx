'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, LogOut, Trash2, Loader2, Filter, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import styles from './page.module.css';

interface Task {
    _id: string;
    title: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low' | 'none';
    category: string;
    aiAdvice?: string;
}

export default function TasksDashboard() {
    const router = useRouter();
    const { t } = useLanguage();

    const [username, setUsername] = useState('User');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Filters state
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    // Settings Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            try {
                const [userRes, tasksRes] = await Promise.all([
                    fetch('/api/auth/me'),
                    fetch('/api/tasks')
                ]);

                if (!userRes.ok) throw new Error('Not authenticated');
                const userData = await userRes.json();
                setUsername(userData.user.username);

                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json();
                    setTasks(tasksData);
                }
            } catch (err) {
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [router]);

    // Polling background AI updates every 5 seconds
    useEffect(() => {
        if (isLoading) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/tasks');
                if (res.ok) {
                    const tasksData = await res.json();
                    setTasks(tasksData);
                }
            } catch (err) {
                // Ignore silent errors for polling
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleLogout = () => {
        document.cookie = 'token=; Max-Age=0; path=/;';
        router.push('/');
    };

    const handleSavePassword = async () => {
        setModalError('');
        setModalSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setModalError((t.errors as any).required || "Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setModalError((t.tasks as any).settings?.errorMatch || "Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setModalError((t.tasks as any).settings?.errorLength || "Password too short");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/auth/me/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                setModalError(data.error === 'INCORRECT_PASSWORD'
                    ? "Incorrect current password."
                    : "Update failed, please try again.");
            } else {
                setModalSuccess((t.tasks as any).settings?.success || "Password updated successfully!");
                setTimeout(() => {
                    setIsModalOpen(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setModalSuccess('');
                }, 1500);
            }
        } catch (err) {
            setModalError("Network error. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const addTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTaskTitle.trim() && !isAdding) {
            const title = newTaskTitle.trim();
            setIsAdding(true);

            try {
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title })
                });

                if (res.ok) {
                    const newTask = await res.json();
                    setTasks([newTask, ...tasks]);
                    setNewTaskTitle('');
                    setFilterPriority('all');
                    setFilterCategory('all');
                }
            } catch (err) {
                console.error('Failed to add task', err);
            } finally {
                setIsAdding(false);
            }
        }
    };

    const toggleTask = async (id: string, currentStatus: boolean) => {
        setTasks(tasks.map(t => t._id === id ? { ...t, completed: !currentStatus } : t));
        try {
            await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus })
            });
        } catch (err) {
            setTasks(tasks.map(t => t._id === id ? { ...t, completed: currentStatus } : t));
        }
    };

    const deleteTask = async (id: string) => {
        setTasks(tasks.filter(t => t._id !== id));
        try {
            await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error('Failed to delete task', err);
        }
    };

    const categories = Array.from(new Set(tasks.map(t => t.category).filter(c => c && c !== 'Uncategorized')));
    const filteredTasks = tasks.filter(task => {
        if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
        if (filterCategory !== 'all' && task.category !== filterCategory) return false;
        return true;
    });

    const remainingCount = tasks.filter(t => !t.completed).length;

    if (isLoading) return null;

    return (
        <main className={styles.main}>
            <div className={styles.ambientGlow} />

            <div className={styles.container}>
                <header className={styles.header}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={styles.greeting}
                    >
                        <h1>{t.tasks.greeting}{username}</h1>
                        <p className={styles.subtitle}>
                            {remainingCount === 0
                                ? t.tasks.taskCount_zero
                                : <>{t.tasks.taskCount_has}<strong>{remainingCount}</strong>{t.tasks.taskCount_tasks}</>}
                        </p>
                    </motion.div>

                    <div className={styles.headerActions}>
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setIsModalOpen(true)}
                            className={styles.settingsBtn}
                            title={(t.tasks as any).settings?.changePassword || "Change Password"}
                        >
                            <Settings size={18} />
                        </motion.button>

                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleLogout}
                            className={styles.signOutBtn}
                        >
                            <LogOut size={16} />
                            {t.tasks.signOut}
                        </motion.button>
                    </div>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={styles.inputWrapper}
                >
                    <input
                        type="text"
                        className={styles.taskInput}
                        placeholder={isAdding ? (t.tasks as any).addingPlaceholder || "Adding..." : t.tasks.inputPlaceholder}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={addTask}
                        disabled={isAdding}
                        style={{ opacity: isAdding ? 0.7 : 1 }}
                    />
                    {isAdding && (
                        <div className={styles.inputSpinner}>
                            <Loader2 size={24} />
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginLeft: '4px' }}>
                        <Filter size={14} />
                    </div>
                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        style={{ background: 'rgba(20, 20, 25, 0.6)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                    >
                        <option value="all">{(t.tasks as any).filters?.allPriorities || 'All Priorities'}</option>
                        <option value="high">{(t.tasks as any).priority?.high || 'High'}</option>
                        <option value="medium">{(t.tasks as any).priority?.medium || 'Medium'}</option>
                        <option value="low">{(t.tasks as any).priority?.low || 'Low'}</option>
                        <option value="none">{(t.tasks as any).priority?.none || 'Normal'}</option>
                    </select>

                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        style={{ background: 'rgba(20, 20, 25, 0.6)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                    >
                        <option value="all">{(t.tasks as any).filters?.allCategories || 'All Categories'}</option>
                        <option value="Uncategorized">未分类 / Uncategorized</option>
                        {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </motion.div>

                <motion.div
                    className={styles.tasksList}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTasks.length === 0 ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                                className={styles.emptyState}
                            >
                                {t.tasks.emptyState}
                            </motion.div>
                        ) : (
                            filteredTasks.map((task) => (
                                <motion.div
                                    key={task._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: 50, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                                    className={styles.taskCard}
                                >
                                    <div
                                        className={`${styles.checkbox} ${task.completed ? styles.completed : ''}`}
                                        onClick={() => toggleTask(task._id, task.completed)}
                                    >
                                        <motion.div
                                            initial={false}
                                            animate={{ scale: task.completed ? 1 : 0 }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        >
                                            <Check size={14} color="#000" strokeWidth={3} />
                                        </motion.div>
                                    </div>

                                    <div className={styles.taskContent}>
                                        <span className={`${styles.taskTitle} ${task.completed ? styles.completedText : ''}`}>
                                            {task.title}
                                        </span>

                                        <div className={styles.taskMeta}>
                                            {task.priority !== 'none' && (
                                                <span className={`${styles.tag} ${styles['priority_' + task.priority]}`}>
                                                    {(t.tasks as any).priority?.[task.priority] || task.priority}
                                                </span>
                                            )}

                                            {task.category && task.category !== 'Uncategorized' && (
                                                <span className={styles.tag}>🏷️ {task.category}</span>
                                            )}

                                            {task.aiAdvice && (
                                                <span className={styles.aiTip}>✨ {task.aiAdvice}</span>
                                            )}
                                        </div>
                                    </div>

                                    <button className={styles.deleteBtn} onClick={() => deleteTask(task._id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.modalOverlay}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={styles.modal}
                        >
                            <h2 className={styles.modalTitle}>{(t.tasks as any).settings?.changePassword || "Change Password"}</h2>

                            {modalError && <div className={styles.errorMessage}>{modalError}</div>}
                            {modalSuccess && <div className={styles.successMessage}>{modalSuccess}</div>}

                            <div className={styles.inputGroup}>
                                <label className={styles.modalLabel}>{(t.tasks as any).settings?.currentPassword || "Current Password"}</label>
                                <input
                                    type="password"
                                    className={styles.modalInput}
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.modalLabel}>{(t.tasks as any).settings?.newPassword || "New Password"}</label>
                                <input
                                    type="password"
                                    className={styles.modalInput}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.modalLabel}>{(t.tasks as any).settings?.confirmPassword || "Confirm New Password"}</label>
                                <input
                                    type="password"
                                    className={styles.modalInput}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setModalError('');
                                        setModalSuccess('');
                                        setCurrentPassword('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                >
                                    {(t.tasks as any).settings?.cancel || "Cancel"}
                                </button>
                                <button
                                    className={`${styles.modalBtn} ${styles.modalBtnSave}`}
                                    onClick={handleSavePassword}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 size={18} className={styles.inputSpinner} style={{ position: 'static', animation: 'taskLoaderSpin 1s linear infinite', margin: '0 auto' }} /> : ((t.tasks as any).settings?.save || "Save")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
