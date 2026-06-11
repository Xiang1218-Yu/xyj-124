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

export const BILL_CATEGORIES = {
    rent: { name: '房租', emoji: '🏠' },
    water: { name: '水费', emoji: '💧' },
    electricity: { name: '电费', emoji: '⚡' },
    gas: { name: '燃气费', emoji: '🔥' },
    internet: { name: '网费', emoji: '📶' },
    grocery: { name: '日用品', emoji: '🛒' },
    cleaning: { name: '清洁用品', emoji: '🧹' },
    repair: { name: '维修', emoji: '🔧' },
    other: { name: '其他', emoji: '📋' }
};

export const INVENTORY_CATEGORIES = {
    paper: { name: '纸品卫生', emoji: '🧻', billCategory: 'cleaning' },
    cleaning: { name: '清洁用品', emoji: '🧹', billCategory: 'cleaning' },
    grocery: { name: '日常消耗', emoji: '🛒', billCategory: 'grocery' },
    kitchen: { name: '厨房用品', emoji: '🍳', billCategory: 'grocery' },
    appliance: { name: '家电耗材', emoji: '🔌', billCategory: 'repair' },
    other: { name: '其他物品', emoji: '📦', billCategory: 'other' }
};

export const INVENTORY_LOG_TYPES = {
    consume: { name: '消耗', emoji: '➖', color: '#ef4444' },
    restock: { name: '补货', emoji: '➕', color: '#10b981' },
    adjust: { name: '调整', emoji: '🔄', color: '#6366f1' },
    purchase: { name: '购买', emoji: '🛒', color: '#f59e0b' }
};

export const TAB_CONFIG = [
    { id: 'dashboard', label: '📊 概览' },
    { id: 'members', label: '👥 成员管理' },
    { id: 'records', label: '📝 事务记录' },
    { id: 'schedule', label: '📅 轮值排班' },
    { id: 'inventory', label: '📦 物品库存' },
    { id: 'bills', label: '💰 账单管理' },
    { id: 'reminders', label: '⏰ 逾期提醒' }
];
