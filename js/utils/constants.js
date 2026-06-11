export const TASK_TYPES = {
    trash: { name: '倒垃圾', emoji: '🗑️', defaultInterval: 2 },
    paper: { name: '续厕纸', emoji: '🧻', defaultInterval: 3 },
    clean: { name: '公区卫生', emoji: '🧹', defaultInterval: 7 }
};

export const AVATAR_COLORS = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'
];

export const STORAGE_KEY = 'sharehouse_data';

export const TAB_CONFIG = [
    { id: 'dashboard', label: '📊 概览' },
    { id: 'members', label: '👥 成员管理' },
    { id: 'records', label: '📝 事务记录' },
    { id: 'schedule', label: '📅 轮值排班' },
    { id: 'reminders', label: '⏰ 逾期提醒' }
];
