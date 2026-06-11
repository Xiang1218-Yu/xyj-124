import { TASK_TYPES } from '../utils/constants.js';
import { getDaysDiff, formatDate } from '../utils/helpers.js';
import { EmptyState } from '../components/EmptyState.js';
import { Avatar } from '../components/Avatar.js';
import { FormField } from '../components/FormField.js';

export class ScheduleModule {
    constructor(store, memberService, scheduleService, recordService, modal, toast) {
        this.store = store;
        this.memberService = memberService;
        this.scheduleService = scheduleService;
        this.recordService = recordService;
        this.modal = modal;
        this.toast = toast;
    }

    render() {
        Object.keys(TASK_TYPES).forEach(type => {
            this.renderScheduleColumn(type);
        });
    }

    renderScheduleColumn(type) {
        const container = document.getElementById('schedule' + type.charAt(0).toUpperCase() + type.slice(1));
        const schedules = this.scheduleService.getByType(type);

        if (schedules.length === 0) {
            container.innerHTML = EmptyState.render('暂无排班');
            return;
        }

        const now = Date.now();
        container.innerHTML = schedules.map(schedule => {
            const member = this.memberService.getById(schedule.memberId);
            const daysDiff = Math.ceil((schedule.date - now) / (1000 * 60 * 60 * 24));
            let statusClass = 'pending';
            let statusText = '待执行';
            let itemClass = '';

            if (schedule.completed) {
                statusClass = 'done';
                statusText = '已完成';
            } else if (daysDiff < 0) {
                statusClass = 'overdue';
                statusText = `逾期 ${Math.abs(daysDiff)} 天`;
                itemClass = 'overdue';
            } else if (daysDiff === 0) {
                statusText = '今天';
                itemClass = 'current';
            } else if (daysDiff === 1) {
                statusText = '明天';
                itemClass = 'current';
            } else {
                statusText = `${daysDiff} 天后`;
            }

            return `
                <div class="schedule-item ${itemClass}">
                    <div class="schedule-person">
                        ${Avatar.render(member, 'sm')}
                        <div>
                            <div class="schedule-name">${member ? member.name : '未知成员'}</div>
                            <div class="schedule-date">${formatDate(schedule.date)}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="schedule-status ${statusClass}">${statusText}</span>
                        <div class="schedule-actions">
                            ${!schedule.completed ? `
                                <button class="btn btn-success btn-sm" onclick="window._app.markScheduleDone('${schedule.id}')">✓</button>
                            ` : ''}
                            <button class="btn btn-danger btn-sm" onclick="window._app.deleteSchedule('${schedule.id}')">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    showAddModal() {
        const members = this.memberService.getAll();
        if (members.length === 0) {
            this.toast.show('请先添加成员');
            return;
        }
        this.modal.open('新建排班', FormField.scheduleForm(members));
    }

    saveSchedule(event) {
        event.preventDefault();
        const type = document.getElementById('scheduleType').value;
        const memberId = document.getElementById('scheduleMember').value;
        const dateStr = document.getElementById('scheduleDate').value;
        const date = new Date(dateStr).getTime();

        this.scheduleService.add(memberId, type, date);
        this.modal.close();
        this.toast.show('排班已添加');
    }

    markDone(scheduleId) {
        this.scheduleService.markDone(scheduleId, this.recordService);
        this.toast.show('已标记完成');
    }

    deleteSchedule(scheduleId) {
        if (!confirm('确定要删除这个排班吗？')) return;
        this.scheduleService.delete(scheduleId);
        this.toast.show('排班已删除');
    }
}
