import { formatDate, getTodayStr } from '../utils/helpers.js';
import { EmptyState } from '../components/EmptyState.js';
import { Avatar } from '../components/Avatar.js';
import { FormField } from '../components/FormField.js';

export class ScheduleModule {
    constructor(store, memberService, scheduleService, recordService, taskTypeService, modal, toast) {
        this.store = store;
        this.memberService = memberService;
        this.scheduleService = scheduleService;
        this.recordService = recordService;
        this.taskTypeService = taskTypeService;
        this.modal = modal;
        this.toast = toast;
        this.viewMode = 'list';
    }

    _lightenColor(hex) {
        const alpha = 0.2;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    render() {
        const enabledTypes = this.taskTypeService.getEnabled();
        const grid = document.getElementById('scheduleGrid');
        const rulesContainer = document.getElementById('scheduleRulesContainer');
        const actionsBar = document.getElementById('scheduleActionBar');

        if (!actionsBar) return;

        actionsBar.innerHTML = enabledTypes.length === 0 ? '' : `
            <div class="schedule-action-bar">
                <div class="schedule-view-toggle">
                    <button class="view-btn ${this.viewMode === 'list' ? 'active' : ''}" onclick="window._app.switchScheduleView('list')">📋 列表视图</button>
                    <button class="view-btn ${this.viewMode === 'rules' ? 'active' : ''}" onclick="window._app.switchScheduleView('rules')">⚙️ 规则管理</button>
                </div>
                <div class="schedule-action-btns">
                    ${this.viewMode === 'list' ? `
                        <button class="btn btn-secondary btn-sm" onclick="window._app.showBatchGenerateModal()">⚡ 批量生成</button>
                    ` : `
                        <button class="btn btn-secondary btn-sm" onclick="window._app.showAddRuleModal()">+ 新建规则</button>
                    `}
                </div>
            </div>
        `;

        if (enabledTypes.length === 0) {
            grid.innerHTML = EmptyState.render('请先在「任务配置」中启用任务类型');
            if (rulesContainer) rulesContainer.innerHTML = '';
            return;
        }

        if (this.viewMode === 'list') {
            grid.style.display = 'grid';
            if (rulesContainer) rulesContainer.style.display = 'none';
            grid.innerHTML = enabledTypes.map(type => `
                <div class="schedule-column">
                    <h3 class="schedule-type-header" style="background: ${this._lightenColor(type.color)};">
                        ${type.emoji} ${type.name}
                    </h3>
                    <div id="schedule-${type.id}" class="schedule-list"></div>
                </div>
            `).join('');

            enabledTypes.forEach(type => {
                this.renderScheduleColumn(type.id);
            });
        } else {
            grid.style.display = 'none';
            if (rulesContainer) {
                rulesContainer.style.display = 'block';
                this.renderRulesList();
            }
        }
    }

    renderScheduleColumn(typeId) {
        const container = document.getElementById(`schedule-${typeId}`);
        if (!container) return;

        const schedules = this.scheduleService.getByType(typeId);
        const typeObj = this.taskTypeService.getById(typeId);

        if (schedules.length === 0) {
            container.innerHTML = EmptyState.render('暂无排班');
            return;
        }

        const now = Date.now();
        container.innerHTML = schedules.map(schedule => {
            const member = this.memberService.getById(schedule.memberId);
            const originalMember = schedule.originalMemberId ? this.memberService.getById(schedule.originalMemberId) : null;
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

            const substituteBadge = schedule.substituteType
                ? `<span class="substitute-badge ${schedule.substituteType}">
                    ${schedule.substituteType === 'swap' ? '🔄 换值' : '👤 代值'}
                    ${originalMember ? `<span class="substitute-origin">原为 ${originalMember.name}</span>` : ''}
                   </span>`
                : '';

            const colorStyle = typeObj ? `border-left: 4px solid ${typeObj.color};` : '';
            return `
                <div class="schedule-item ${itemClass}" style="${colorStyle}">
                    <div class="schedule-person">
                        ${Avatar.render(member, 'sm')}
                        <div style="min-width:0;">
                            <div class="schedule-name-row">
                                <span class="schedule-name">${member ? member.name : '未知成员'}</span>
                                ${substituteBadge}
                            </div>
                            <div class="schedule-date">${formatDate(schedule.date)}</div>
                            ${schedule.substituteNote ? `<div class="schedule-note">📝 ${schedule.substituteNote}</div>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                        <span class="schedule-status ${statusClass}">${statusText}</span>
                        <div class="schedule-actions">
                            ${!schedule.completed ? `
                                <button class="btn btn-success btn-sm" title="标记完成" onclick="window._app.markScheduleDone('${schedule.id}')">✓</button>
                                <button class="btn btn-info btn-sm" title="换值" onclick="window._app.showSwapModal('${schedule.id}')">↔️</button>
                                <button class="btn btn-warning btn-sm" title="代值" onclick="window._app.showSubstituteModal('${schedule.id}')">👥</button>
                            ` : ''}
                            <button class="btn btn-danger btn-sm" title="删除" onclick="window._app.deleteSchedule('${schedule.id}')">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderRulesList() {
        const container = document.getElementById('scheduleRulesContainer');
        if (!container) return;
        const rules = this.scheduleService.getAllRules();
        const taskTypes = this.taskTypeService.getAllAsObject();
        const members = this.memberService.getAll();
        container.innerHTML = FormField.scheduleRulesList(rules, taskTypes, members, formatDate);
    }

    switchView(mode) {
        this.viewMode = mode;
        this.render();
    }

    showAddModal() {
        const members = this.memberService.getAll();
        if (members.length === 0) {
            this.toast.show('请先添加成员');
            return;
        }
        const taskTypes = this.taskTypeService.getAllAsObject();
        this.modal.open('新建排班', FormField.scheduleForm(members, taskTypes));
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
        this.scheduleService.markDone(scheduleId, this.recordService, this.taskTypeService);
        this.toast.show('已标记完成');
    }

    deleteSchedule(scheduleId) {
        if (!confirm('确定要删除这个排班吗？')) return;
        this.scheduleService.delete(scheduleId);
        this.toast.show('排班已删除');
    }

    showAddRuleModal() {
        const members = this.memberService.getAll();
        const taskTypes = this.taskTypeService.getAllAsObject();
        if (members.length === 0) {
            this.toast.show('请先添加成员');
            return;
        }
        this.modal.open('新建排班规则', FormField.scheduleRuleForm(null, taskTypes, members));
        setTimeout(() => this._initRuleFormInteractions(), 50);
    }

    showEditRuleModal(ruleId) {
        const rule = this.scheduleService.getRuleById(ruleId);
        if (!rule) {
            this.toast.show('规则不存在');
            return;
        }
        const members = this.memberService.getAll();
        const taskTypes = this.taskTypeService.getAllAsObject();
        this.modal.open('编辑排班规则', FormField.scheduleRuleForm(rule, taskTypes, members));
        setTimeout(() => this._initRuleFormInteractions(), 50);
    }

    _initRuleFormInteractions() {
        this._setupSortableMembers();
    }

    _setupSortableMembers() {
        const container = document.getElementById('ruleMemberList');
        if (!container) return;
        let draggedEl = null;

        container.querySelectorAll('.member-checkbox').forEach(item => {
            item.setAttribute('draggable', 'true');
            item.addEventListener('dragstart', (e) => {
                draggedEl = item;
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
                container.querySelectorAll('.member-checkbox').forEach(el => el.style.borderColor = '');
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (item !== draggedEl) {
                    const rect = item.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        item.style.borderTop = '2px solid var(--primary)';
                        item.style.borderBottom = '';
                    } else {
                        item.style.borderBottom = '2px solid var(--primary)';
                        item.style.borderTop = '';
                    }
                }
            });
            item.addEventListener('dragleave', () => {
                item.style.borderTop = '';
                item.style.borderBottom = '';
            });
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!draggedEl || item === draggedEl) return;
                const rect = item.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    container.insertBefore(draggedEl, item);
                } else {
                    container.insertBefore(draggedEl, item.nextSibling);
                }
                item.style.borderTop = '';
                item.style.borderBottom = '';
            });
        });
    }

    toggleRuleTypeFields() {
        const type = document.querySelector('input[name="ruleType"]:checked').value;
        document.getElementById('ruleIntervalFields').style.display = type === 'interval' ? 'block' : 'none';
        document.getElementById('ruleWeeklyFields').style.display = type === 'weekly' ? 'block' : 'none';
        document.getElementById('ruleMonthlyFields').style.display = type === 'monthly' ? 'block' : 'none';
        document.querySelectorAll('.rule-type-tab').forEach(tab => {
            const input = tab.querySelector('input');
            tab.classList.toggle('active', input && input.checked);
        });
    }

    saveScheduleRule(event, ruleId) {
        event.preventDefault();
        const taskTypeId = document.getElementById('ruleTaskType').value;
        if (!taskTypeId) {
            this.toast.show('请选择任务类型');
            return;
        }
        const type = document.querySelector('input[name="ruleType"]:checked').value;
        const startDate = new Date(document.getElementById('ruleStartDate').value).getTime();
        const enabled = document.getElementById('ruleEnabled').checked;

        const memberEl = document.getElementById('ruleMemberList');
        const memberOrder = [];
        memberEl.querySelectorAll('.member-checkbox').forEach(el => {
            const input = el.querySelector('input[name="ruleMember"]');
            if (input && input.checked) {
                memberOrder.push(input.value);
            }
        });

        if (memberOrder.length === 0) {
            this.toast.show('请至少选择一名成员');
            return;
        }

        const ruleData = {
            type,
            taskTypeId,
            memberOrder,
            startDate,
            enabled
        };

        switch (type) {
            case 'interval':
                ruleData.intervalDays = parseInt(document.getElementById('ruleIntervalDays').value) || 3;
                ruleData.weekdays = [];
                ruleData.monthDays = [];
                break;
            case 'weekly':
                ruleData.weekdays = Array.from(document.querySelectorAll('input[name="ruleWeekday"]:checked')).map(i => parseInt(i.value));
                ruleData.monthDays = [];
                ruleData.intervalDays = 7;
                if (ruleData.weekdays.length === 0) {
                    this.toast.show('请至少选择一个星期');
                    return;
                }
                break;
            case 'monthly':
                ruleData.monthDays = Array.from(document.querySelectorAll('input[name="ruleMonthday"]:checked')).map(i => parseInt(i.value));
                ruleData.weekdays = [];
                ruleData.intervalDays = 30;
                if (ruleData.monthDays.length === 0) {
                    this.toast.show('请至少选择一个日期');
                    return;
                }
                break;
        }

        if (ruleId) {
            this.scheduleService.updateRule(ruleId, ruleData);
            this.toast.show('规则已更新');
        } else {
            this.scheduleService.addRule(ruleData);
            this.toast.show('规则已创建');
        }
        this.modal.close();
    }

    toggleRuleEnabled(ruleId) {
        this.scheduleService.toggleRuleEnabled(ruleId);
        const rule = this.scheduleService.getRuleById(ruleId);
        this.toast.show(rule && rule.enabled ? '规则已启用' : '规则已停用');
    }

    deleteScheduleRule(ruleId) {
        if (!confirm('确定要删除这条规则吗？由该规则生成的排班不会被删除。')) return;
        this.scheduleService.deleteRule(ruleId);
        this.toast.show('规则已删除');
    }

    showBatchGenerateModal() {
        const rules = this.scheduleService.getAllRules();
        if (rules.length === 0) {
            if (!confirm('还没有创建排班规则，现在去创建吗？')) return;
            this.showAddRuleModal();
            return;
        }
        const taskTypes = this.taskTypeService.getAllAsObject();
        const members = this.memberService.getAll();
        this.modal.open('⚡ 智能批量生成排班', FormField.scheduleBatchForm(taskTypes, members));
    }

    handleBatchGenerate(event) {
        event.preventDefault();
        const days = Math.min(365, Math.max(1, parseInt(document.getElementById('batchDays').value) || 30));
        const startFrom = new Date(document.getElementById('batchStartDate').value).getTime();
        const taskTypeIds = Array.from(document.querySelectorAll('input[name="batchType"]:checked')).map(i => i.value);
        const clearExisting = document.getElementById('batchClearExisting').checked;

        if (taskTypeIds.length === 0) {
            this.toast.show('请至少选择一个任务类型');
            return;
        }

        const rules = this.scheduleService.getAllRules().filter(r => taskTypeIds.includes(r.taskTypeId));
        if (rules.length === 0) {
            this.toast.show('所选任务类型还没有排班规则');
            return;
        }

        try {
            const generated = this.scheduleService.generateSchedulesForDays(days, {
                taskTypeIds,
                clearExisting,
                startFrom
            });
            this.modal.close();
            this.toast.show(`✅ 成功生成 ${generated.length} 条排班（未来 ${days} 天）`);
        } catch (e) {
            this.toast.show('生成失败：' + e.message);
        }
    }

    showSwapModal(scheduleId) {
        const schedule = this.scheduleService.getById(scheduleId);
        if (!schedule) return;
        const candidates = this.scheduleService.getSwapCandidates(scheduleId);
        const members = this.memberService.getAll();
        this.modal.open('🔄 换值（互换排班）', FormField.scheduleSwapForm(schedule, candidates, members, formatDate));
    }

    handleScheduleSwap(event, scheduleId) {
        event.preventDefault();
        const targetId = document.getElementById('swapTargetId').value;
        const note = document.getElementById('swapNote')?.value?.trim() || '';
        try {
            this.scheduleService.swapSchedules(scheduleId, targetId, note);
            this.modal.close();
            this.toast.show('✅ 换值成功');
        } catch (e) {
            this.toast.show('换值失败：' + e.message);
        }
    }

    showSubstituteModal(scheduleId) {
        const schedule = this.scheduleService.getById(scheduleId);
        if (!schedule) return;
        const members = this.memberService.getAll();
        this.modal.open('👥 代值（指定他人代班）', FormField.scheduleSubstituteForm(schedule, members, formatDate));
        setTimeout(() => {
            const revertBox = document.getElementById('substituteRevert');
            const memberSection = document.getElementById('substituteMemberSection');
            if (revertBox && memberSection) {
                const toggle = () => {
                    memberSection.style.display = revertBox.checked ? 'none' : 'block';
                    memberSection.querySelectorAll('select, textarea').forEach(el => {
                        el.disabled = revertBox.checked;
                        el.required = !revertBox.checked;
                    });
                };
                revertBox.addEventListener('change', toggle);
                toggle();
            }
        }, 50);
    }

    handleScheduleSubstitute(event, scheduleId) {
        event.preventDefault();
        const revertBox = document.getElementById('substituteRevert');
        if (revertBox && revertBox.checked) {
            try {
                this.scheduleService.revertSubstitute(scheduleId);
                this.modal.close();
                this.toast.show('✅ 已恢复原值班人');
            } catch (e) {
                this.toast.show('操作失败：' + e.message);
            }
            return;
        }
        const substituteMemberId = document.getElementById('substituteMemberId').value;
        const note = document.getElementById('substituteNote')?.value?.trim() || '';
        try {
            this.scheduleService.substituteSchedule(scheduleId, substituteMemberId, note);
            this.modal.close();
            this.toast.show('✅ 代值成功');
        } catch (e) {
            this.toast.show('代值失败：' + e.message);
        }
    }
}
