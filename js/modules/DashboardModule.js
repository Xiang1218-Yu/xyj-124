import { TASK_TYPES } from '../utils/constants.js';
import { getMonthStart, getDaysDiff, formatDate, formatDateTime } from '../utils/helpers.js';
import { StatCard } from '../components/StatCard.js';
import { EmptyState } from '../components/EmptyState.js';
import { Avatar } from '../components/Avatar.js';

export class DashboardModule {
    constructor(store, memberService, recordService, scheduleService, billService) {
        this.store = store;
        this.memberService = memberService;
        this.recordService = recordService;
        this.scheduleService = scheduleService;
        this.billService = billService;
    }

    render() {
        this.renderStats();
        this.renderPendingTasks();
        this.renderRecentActivity();
        this.renderRanking();
    }

    renderStats() {
        const monthStart = getMonthStart();
        const monthRecords = this.recordService.getByMonth(monthStart);
        const members = this.memberService.getAll();
        const monthExpense = this.billService.getMonthTotal(monthStart);

        const grid = document.querySelector('#dashboard .stats-grid');
        grid.innerHTML = StatCard.renderGrid([
            StatCard.render('trash-icon', '🗑️', '倒垃圾', monthRecords.filter(r => r.type === 'trash').length, '本月完成次数'),
            StatCard.render('paper-icon', '🧻', '续厕纸', monthRecords.filter(r => r.type === 'paper').length, '本月完成次数'),
            StatCard.render('clean-icon', '🧹', '公区卫生', monthRecords.filter(r => r.type === 'clean').length, '本月完成次数'),
            StatCard.render('member-icon', '👥', '合租成员', members.length, '当前人数'),
            StatCard.render('bill-icon', '💰', '本月支出', `¥${monthExpense.toFixed(0)}`, '本月账单总额')
        ]);
    }

    renderPendingTasks() {
        const container = document.getElementById('pendingTasks');
        const pending = this.scheduleService.getPending();

        if (pending.length === 0) {
            container.innerHTML = EmptyState.render('暂无待处理事项 🎉');
            return;
        }

        container.innerHTML = pending.slice(0, 5).map(task => {
            const member = this.memberService.getById(task.memberId);
            const type = TASK_TYPES[task.type];
            const isOverdue = task.daysDiff < 0;
            const timeText = isOverdue
                ? `已逾期 ${Math.abs(task.daysDiff)} 天`
                : task.daysDiff === 0
                    ? '今天'
                    : `还剩 ${task.daysDiff} 天`;

            return `
                <div class="task-item ${!isOverdue && task.daysDiff <= 1 ? 'warning' : ''}">
                    <div class="task-info">
                        <span class="task-emoji">${type.emoji}</span>
                        <div class="task-details">
                            <h4>${type.name} - ${member ? member.name : '未知成员'}</h4>
                            <p>${formatDate(task.date)} · ${timeText}</p>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-success btn-sm" onclick="window._app.markScheduleDone('${task.id}')">已完成</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        const sorted = [...this.recordService.getAll()].sort((a, b) => b.date - a.date).slice(0, 8);

        if (sorted.length === 0) {
            container.innerHTML = EmptyState.render('暂无记录');
            return;
        }

        container.innerHTML = sorted.map(record => {
            const member = this.memberService.getById(record.memberId);
            const type = TASK_TYPES[record.type];
            return `
                <div class="activity-item">
                    <span class="activity-emoji">${type.emoji}</span>
                    <div class="activity-content">
                        <p><strong>${member ? member.name : '未知成员'}</strong> 完成了 ${type.name}</p>
                        <span class="activity-time">${formatDateTime(record.date)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRanking() {
        const container = document.getElementById('ranking');
        const monthStart = getMonthStart();
        const members = this.memberService.getAll();

        const stats = members.map(member => {
            const monthRecords = this.recordService.getByMonth(monthStart)
                .filter(r => r.memberId === member.id);
            return { member, count: monthRecords.length };
        }).sort((a, b) => b.count - a.count);

        if (stats.length === 0) {
            container.innerHTML = EmptyState.render('暂无数据');
            return;
        }

        container.innerHTML = stats.map((stat, index) => `
            <div class="ranking-item">
                <span class="ranking-number">${index + 1}</span>
                <span class="ranking-name">${stat.member.name}</span>
                <span class="ranking-score">${stat.count} 次</span>
            </div>
        `).join('');
    }
}
