'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, LogOut, Trash2, Loader2, Filter, Settings, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import PomodoroTimer from '@/components/PomodoroTimer';
import DatePicker, { registerLocale } from 'react-datepicker';
import { zhCN } from 'date-fns/locale/zh-CN';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './page.module.css';

registerLocale('zh-CN', zhCN);

interface Task {
    _id: string;
    title: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low' | 'none';
    category: string;
    dueDate?: string | Date;
    isReminderEnabled?: boolean;
    reminderTime?: string | Date;
    aiAdvice?: string;
}

export default function TasksDashboard() {
    const router = useRouter();
    const { t } = useLanguage();

    const [username, setUsername] = useState('User');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Advanced Features State
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [nlpParsed, setNlpParsed] = useState<{ title: string, category: string | null, priority: string | null, dueDate: Date | null }>({ title: '', category: null, priority: null, dueDate: null });
    const [isReminderEnabled, setIsReminderEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState<Date | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    // --- NLP Parser ---
    useEffect(() => {
        const parseInput = (text: string) => {
            let parsedTitle = text;
            let category: string | null = null;
            let priority: string | null = null;
            let dueDate: Date | null = null;

            // Extract Tags (#tagname)
            const tagMatch = text.match(/#(\S+)/);
            if (tagMatch) {
                category = tagMatch[1];
                parsedTitle = parsedTitle.replace(tagMatch[0], '');
            }

            // Extract Priority (!! for high, ! for medium)
            if (text.includes('!!')) {
                priority = 'high';
                parsedTitle = parsedTitle.replace('!!', '');
            } else if (text.includes('!')) {
                priority = 'medium';
                parsedTitle = parsedTitle.replace('!', '');
            }

            // Extract Date Mentions (simple keyword matching for demo)
            const lowerText = text.toLowerCase();
            const today = new Date();
            if (lowerText.includes('tomorrow') || lowerText.includes('明天')) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                dueDate = tomorrow;
                parsedTitle = parsedTitle.replace(/tomorrow|明天/i, '');
            } else if (lowerText.includes('today') || lowerText.includes('今天')) {
                dueDate = today;
                parsedTitle = parsedTitle.replace(/today|今天/i, '');
            }

            setNlpParsed({
                title: parsedTitle.trim().replace(/\s+/g, ' '),
                category,
                priority,
                dueDate
            });
        };

        parseInput(newTaskTitle);
    }, [newTaskTitle]);
    const [isAdding, setIsAdding] = useState(false);

    // Filters state
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');

    // Settings Modal State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [activeReminderTask, setActiveReminderTask] = useState<Task | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [modalSuccess, setModalSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Pomodoro State
    const [activePomodoroTask, setActivePomodoroTask] = useState<any | null>(null);

    // Email Reminder State
    const [userEmail, setUserEmail] = useState('');
    const [isEmailSaving, setIsEmailSaving] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');
    const [emailError, setEmailError] = useState('');

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
                setUserEmail(userData.user.email || '');

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

    // Polling background AI updates every 5 seconds — merges AI data without overwriting user changes
    useEffect(() => {
        if (isLoading) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/tasks');
                if (res.ok) {
                    const tasksData = await res.json();
                    // Merge: trust server for most fields, but preserve local reminder state
                    // to avoid race conditions where poll fires just after save.
                    setTasks(prev => tasksData.map((serverTask: any) => {
                        const localTask = prev.find(t => t._id === serverTask._id);
                        if (!localTask) return serverTask;
                        return {
                            ...serverTask,
                            // Preserve local reminder state to prevent UI blinking back to stale data 
                            // before the PUT request from handleSaveTaskReminder finishes saving.
                            isReminderEnabled: localTask.isReminderEnabled,
                            reminderTime: localTask.reminderTime,
                        };
                    }));
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

    const handleSaveEmail = async () => {
        setEmailError('');
        setEmailSuccess('');
        if (!userEmail.trim() || !/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(userEmail)) {
            setEmailError('请输入有效的邮箱地址');
            return;
        }
        setIsEmailSaving(true);
        try {
            const res = await fetch('/api/auth/me/email', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
            if (res.ok) {
                setEmailSuccess('✅ 邮箱保存成功！将按照您为每个任务独立设置的时间进行提醒');
            } else {
                setEmailError('保存失败，请重试');
            }
        } catch { setEmailError('网络错误，请重试'); }
        finally { setIsEmailSaving(false); }
    };

    const handleSaveTaskReminder = async (taskId: string, isEnabled: boolean, time: string) => {
        // Optimistic UI update
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, isReminderEnabled: isEnabled, reminderTime: time } : t));
        setIsReminderModalOpen(false);
        setActiveReminderTask(null);

        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isReminderEnabled: isEnabled,
                    reminderTime: (isEnabled && time) ? new Date(time).toISOString() : null
                })
            });

            if (res.ok) {
                const updatedTask = await res.json();
                // Confirm with server truth
                setTasks(prev => prev.map(t => t._id === taskId ? updatedTask : t));
            }
        } catch (err) {
            console.error('Failed to update task reminder', err);
        }
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
                    setIsPasswordModalOpen(false);
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
                    body: JSON.stringify({
                        title: nlpParsed.title || title,
                        category: nlpParsed.category,
                        priority: nlpParsed.priority,
                        dueDate: nlpParsed.dueDate,
                        isReminderEnabled: isReminderEnabled,
                        reminderTime: (isReminderEnabled && reminderTime) ? reminderTime : null
                    })
                });

                if (res.ok) {
                    const newTask = await res.json();
                    setTasks([newTask, ...tasks]);
                    setNewTaskTitle('');
                    setIsReminderEnabled(false);
                    setReminderTime(null);
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

    // --- Smart Focus Logic & Filtering ---
    let filteredTasks = tasks.map(t => ({ ...t, dueDate: t.dueDate ? new Date(t.dueDate) : null }));

    if (isFocusMode) {
        // In Focus Mode, we only care about uncompleted tasks that matter most
        filteredTasks = filteredTasks.filter(t => !t.completed);

        // Complex Sort: Priority > Due Date (earliest first)
        filteredTasks.sort((a, b) => {
            const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1, none: 0 };
            const pA = priorityWeight[a.priority] || 0;
            const pB = priorityWeight[b.priority] || 0;

            if (pA !== pB) return pB - pA; // Higher priority first

            if (a.dueDate && b.dueDate) {
                return a.dueDate.getTime() - b.dueDate.getTime(); // Earliest due date first
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;

            return 0; // Fallback to creation order (default from DB)
        });

        // Take Top 3
        filteredTasks = filteredTasks.slice(0, 3);
    } else {
        // Standard View Filters
        filteredTasks = filteredTasks.filter(task => {
            if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
            if (filterCategory !== 'all' && task.category !== filterCategory) return false;
            return true;
        });
    }

    const remainingCount = tasks.filter(t => !t.completed).length;

    return (
        <main className={styles.main}>
            {/* Ambient Backgrounds */}
            <div className={styles.ambientGlow} />

            {/* Left Sidebar */}
            <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={styles.sidebar}
            >
                <div className={styles.userProfile}>
                    <div className={styles.avatarCircle}>
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.greeting}>
                        <h1>{t.tasks.greeting}{username}</h1>
                        <p className={styles.subtitle}>
                            {remainingCount === 0
                                ? t.tasks.taskCount_zero
                                : <>{t.tasks.taskCount_has}<strong>{remainingCount}</strong>{t.tasks.taskCount_tasks}</>}
                        </p>
                    </div>
                </div>

                <div className={styles.sidebarSections}>
                    <div>
                        <div className={styles.sectionTitle}>Views</div>
                        <div
                            className={`${styles.navItem} ${filterPriority === 'all' && filterCategory === 'all' ? styles.active : ''}`}
                            onClick={() => { setFilterPriority('all'); setFilterCategory('all'); }}
                        >
                            <span>📝</span> All Tasks
                        </div>
                        <div
                            className={`${styles.navItem} ${filterPriority === 'high' ? styles.active : ''}`}
                            onClick={() => setFilterPriority('high')}
                        >
                            <span>🔥</span> High Priority
                        </div>
                    </div>

                    <div>
                        <div className={styles.sectionTitle}>Categories</div>
                        <div
                            className={`${styles.navItem} ${filterCategory === 'Uncategorized' ? styles.active : ''}`}
                            onClick={() => setFilterCategory('Uncategorized')}
                        >
                            <span>📁</span> Uncategorized
                        </div>
                        {categories.map(c => (
                            <div
                                key={c}
                                className={`${styles.navItem} ${filterCategory === c ? styles.active : ''}`}
                                onClick={() => setFilterCategory(c)}
                            >
                                <span>🏷️</span> {c}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.sidebarFooter}>
                    <button
                        className={styles.secondaryActionBtn}
                        onClick={() => setIsEmailModalOpen(true)}
                    >
                        <div className={styles.navItemIcon}><Settings size={18} /></div>
                        <span>Email Reminders</span>
                    </button>
                    <button
                        className={styles.secondaryActionBtn}
                        onClick={() => setIsPasswordModalOpen(true)}
                    >
                        <div className={styles.navItemIcon}><Settings size={18} /></div>
                        <span>{(t.tasks as any).sidebar?.settings || "Settings"}</span>
                    </button>
                    <button className={`${styles.secondaryActionBtn} ${styles.signOutBtn}`} onClick={handleLogout}>
                        <div className={styles.navItemIcon}><LogOut size={18} /></div>
                        <span>{(t.tasks as any).sidebar?.logout || "Log Out"}</span>
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className={styles.contentArea}>
                <div className={styles.topBar}>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.pageTitle}
                    >
                        <span className="gradientText">{isFocusMode ? "Deep Focus" : "Today's Focus"}</span>
                    </motion.h1>

                    <button
                        className={`${styles.focusBtn} ${isFocusMode ? styles.focusBtnActive : ''}`}
                        onClick={() => setIsFocusMode(!isFocusMode)}
                    >
                        {isFocusMode ? '✨ Exit Focus' : '🎯 Smart Focus'}
                    </button>
                </div>

                {/* Command Palette Input */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={styles.inputWrapper}
                >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'transparent' }}>
                        <input
                            type="text"
                            className={styles.taskInput}
                            placeholder={isAdding ? "Generating magic..." : "Press Enter to create a new task..."}
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={addTask}
                            disabled={isAdding}
                            style={{ opacity: isAdding ? 0.7 : 1, flex: 1 }}
                        />

                        {/* Reminder Settings */}
                        <div className={`${styles.reminderWrapper} ${isReminderEnabled ? styles.reminderActive : ''}`}>
                            <button
                                className={styles.reminderToggleBtn}
                                onClick={() => setIsReminderEnabled(!isReminderEnabled)}
                                title={isReminderEnabled ? "取消提醒" : "开启邮件提醒"}
                            >
                                {isReminderEnabled ? '🔔' : '🔕'}
                            </button>
                            {isReminderEnabled && (
                                <DatePicker
                                    selected={reminderTime}
                                    onChange={(date: Date | null) => setReminderTime(date)}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    timeCaption="时间"
                                    dateFormat="yyyy/MM/dd HH:mm"
                                    minDate={new Date()}
                                    locale="zh-CN"
                                    placeholderText="选择时间 (可选)"
                                    className={`${styles.manualDateInput} ${styles.reminderTimeInput}`}
                                    disabled={isAdding}
                                    wrapperClassName={styles.datePickerWrapper}
                                />
                            )}
                        </div>
                    </div>
                    {isAdding && (
                        <div className={styles.inputSpinner}>
                            <Loader2 size={24} />
                        </div>
                    )}
                    {/* NLP Real-time Visual Feedback */}
                    <AnimatePresence>
                        {(nlpParsed.category || nlpParsed.priority || nlpParsed.dueDate) && !isAdding && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={styles.nlpFeedbackRow}
                            >
                                <span className={styles.nlpHint}>✨ Auto-detected:</span>
                                {nlpParsed.category && (
                                    <span className={styles.nlpTag}>🏷️ {nlpParsed.category}</span>
                                )}
                                {nlpParsed.priority && (
                                    <span className={`${styles.nlpTag} ${styles['priority_' + nlpParsed.priority]}`}>
                                        {(t.tasks as any).priority?.[nlpParsed.priority] || nlpParsed.priority}
                                    </span>
                                )}
                                {nlpParsed.dueDate && (
                                    <span className={styles.nlpTag}>📅 {nlpParsed.dueDate.toLocaleDateString()}</span>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Tasks Masonry/Grid View */}
                <motion.div
                    className={styles.tasksList}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence>
                        {filteredTasks.length === 0 ? (
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.1 } }}
                                className={styles.emptyState}
                            >
                                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.8 }}>✨</div>
                                {t.tasks.emptyState || "Your space is clear. What's next?"}
                            </motion.div>
                        ) : (
                            filteredTasks.map((task, index) => (
                                <motion.div
                                    key={task._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                                    className={styles.taskCardWrapper}
                                >
                                    <div className={styles.taskCard}>
                                        <div className={styles.taskCardHeader}>
                                            <div
                                                className={`${styles.checkbox} ${task.completed ? styles.completed : ''}`}
                                                onClick={() => toggleTask(task._id, task.completed)}
                                            >
                                                <motion.div
                                                    initial={false}
                                                    animate={{ scale: task.completed ? 1 : 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                >
                                                    <Check size={16} color="#ffffff" strokeWidth={3} />
                                                </motion.div>
                                            </div>

                                            <div className={styles.taskContent}>
                                                <span className={`${styles.taskTitle} ${task.completed ? styles.completedText : ''}`}>
                                                    {task.title}
                                                </span>

                                                {task.aiAdvice && (
                                                    <div className={styles.aiTip}>
                                                        {task.aiAdvice}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.taskBottomRow}>
                                            <div className={styles.taskMeta}>
                                                <button
                                                    className={styles.pomodoroPlayBtn}
                                                    onClick={() => setActivePomodoroTask(task)}
                                                    title="Start Focus Timer"
                                                >
                                                    <PlayCircle size={18} />
                                                    <span>Focus</span>
                                                </button>

                                                {task.priority !== 'none' && (
                                                    <span className={`${styles.tag} ${styles['priority_' + task.priority]}`}>
                                                        {(t.tasks as any).priority?.[task.priority] || task.priority}
                                                    </span>
                                                )}

                                                {task.category && task.category !== 'Uncategorized' && (
                                                    <span className={styles.tag}>{task.category}</span>
                                                )}

                                                {task.isReminderEnabled ? (
                                                    <button
                                                        className={styles.tag}
                                                        style={{ cursor: 'pointer', background: 'rgba(9, 132, 227, 0.1)', color: '#0984e3', border: 'none' }}
                                                        title={task.reminderTime ? `Reminder set for ${new Date(task.reminderTime).toLocaleString()}` : 'Reminder enabled'}
                                                        onClick={() => { setActiveReminderTask(task); setIsReminderModalOpen(true); }}
                                                    >
                                                        🔔 提醒已开启
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={styles.tag}
                                                        style={{ cursor: 'pointer', background: 'rgba(223, 230, 233, 0.5)', color: '#636e72', border: 'none' }}
                                                        title="设置任务提醒"
                                                        onClick={() => { setActiveReminderTask(task); setIsReminderModalOpen(true); }}
                                                    >
                                                        🔕 设为提醒
                                                    </button>
                                                )}
                                            </div>

                                            <button className={styles.deleteBtn} onClick={() => deleteTask(task._id)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Glass Modal for Task Reminders */}
            <AnimatePresence>
                {isReminderModalOpen && activeReminderTask && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={styles.modalOverlay}
                        style={{ zIndex: 100 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={styles.modal}
                        >
                            <h2 className={styles.modalTitle}>🔔 设置任务提醒</h2>

                            <div className={styles.modalSection}>
                                <div className={styles.sectionDividerLabel}>{activeReminderTask.title}</div>
                                <p className={styles.sectionHint}>开启后系统将在您设定的时间自动发送邮件提醒。</p>

                                <div className={styles.inputGroup} style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <label className={styles.modalLabel} style={{ marginBottom: 0 }}>开启独立提醒</label>
                                    <div
                                        className={`${styles.checkbox} ${activeReminderTask.isReminderEnabled ? styles.completed : ''}`}
                                        style={{ width: '24px', height: '24px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                        onClick={() => setActiveReminderTask({ ...activeReminderTask, isReminderEnabled: !activeReminderTask.isReminderEnabled })}
                                    >
                                        <motion.div initial={false} animate={{ scale: activeReminderTask.isReminderEnabled ? 1 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}>
                                            <Check size={14} color="#ffffff" strokeWidth={3} />
                                        </motion.div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {activeReminderTask.isReminderEnabled && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={styles.inputGroup}
                                            style={{ marginTop: '16px', overflow: 'hidden' }}
                                        >
                                            <label className={styles.modalLabel}>提醒发送时间</label>
                                            <DatePicker
                                                selected={activeReminderTask.reminderTime ? new Date(activeReminderTask.reminderTime) : null}
                                                onChange={(date: Date | null) => setActiveReminderTask({ ...activeReminderTask, reminderTime: date ? date.toISOString() : undefined })}
                                                showTimeSelect
                                                timeFormat="HH:mm"
                                                timeIntervals={15}
                                                timeCaption="时间"
                                                dateFormat="yyyy/MM/dd HH:mm"
                                                minDate={new Date()}
                                                locale="zh-CN"
                                                placeholderText="选择时间"
                                                className={styles.modalInput}
                                                wrapperClassName={styles.datePickerWrapperModal}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                                    onClick={() => {
                                        setIsReminderModalOpen(false);
                                        setActiveReminderTask(null);
                                    }}
                                >
                                    取消
                                </button>
                                <button
                                    className={`${styles.modalBtn} ${styles.modalBtnSave}`}
                                    onClick={() => handleSaveTaskReminder(activeReminderTask._id, activeReminderTask.isReminderEnabled || false, activeReminderTask.reminderTime as string || '')}
                                >
                                    保存设置
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Glass Modal for Password Settings */}
            <AnimatePresence>
                {isPasswordModalOpen && (
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

                            {/* --- Password Section --- */}
                            <div className={styles.modalSection}>
                                <div className={styles.sectionDividerLabel}>🔐 修改密码</div>
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
                                            setIsPasswordModalOpen(false);
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
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Glass Modal for Email Settings */}
            <AnimatePresence>
                {isEmailModalOpen && (
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
                            <h2 className={styles.modalTitle}>📬 Email Reminders</h2>

                            <div className={styles.modalSection}>
                                <div className={styles.sectionDividerLabel}>设置提醒邮箱</div>
                                <p className={styles.sectionHint}>设置后，只要任务设定了到期时间，系统会在到期前 1 小时自动发送邮件提醒您的任务。</p>

                                {emailError && <div className={styles.errorMessage}>{emailError}</div>}
                                {emailSuccess && <div className={styles.successMessage}>{emailSuccess}</div>}

                                <div className={styles.inputGroup} style={{ marginTop: '12px' }}>
                                    <label className={styles.modalLabel}>📧 您的邮箱</label>
                                    <input
                                        type="email"
                                        className={styles.modalInput}
                                        placeholder="your@email.com"
                                        value={userEmail}
                                        onChange={e => { setUserEmail(e.target.value); setEmailSuccess(''); setEmailError(''); }}
                                    />
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button
                                    className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                                    onClick={() => {
                                        setIsEmailModalOpen(false);
                                        setEmailError('');
                                        setEmailSuccess('');
                                    }}
                                >
                                    {(t.tasks as any).settings?.cancel || "Cancel"}
                                </button>
                                <button
                                    className={`${styles.modalBtn} ${styles.modalBtnSave}`}
                                    onClick={handleSaveEmail}
                                    disabled={isEmailSaving}
                                >
                                    {isEmailSaving ? <Loader2 size={18} className={styles.inputSpinner} style={{ position: 'static', animation: 'taskLoaderSpin 1s linear infinite', margin: '0 auto' }} /> : ((t.tasks as any).settings?.save || "Save")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Screen Pomodoro Overlay */}
            <AnimatePresence>
                {activePomodoroTask && (
                    <PomodoroTimer
                        task={activePomodoroTask}
                        onClose={() => setActivePomodoroTask(null)}
                    />
                )}
            </AnimatePresence>
        </main>
    );
}
