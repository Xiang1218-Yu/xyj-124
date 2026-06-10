const App = {
    data: {
        members: [],
        records: [],
        schedules: []
    },

    taskTypes: {
        trash: { name: '倒垃圾', emoji: '🗑️', defaultInterval: 2 },
        paper: { name: '续厕纸', emoji: '🧻', defaultInterval: 3 },
        clean: { name: '公区卫生', emoji: '🧹', defaultInterval: 7 }
    },

    avatarColors: [
        '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'
    ],

    init() {
        this.loadData();
        this.renderCurrentDate();
        this.bindEvents();
        this.renderAll();
        this.checkReminders();
    },

    loadData() {
        const saved = localStorage.getItem('sharehouse_data');
        if (saved) {
            this.data = JSON.parse(saved);
        } else {
            this.initSampleData();
        }
    },

    saveData() {
        localStorage.setItem('sharehouse_data', JSON.stringify(this.data));
    },

    initSampleData() {
        const sampleMembers = [
            { id: this.generateId(), name: '小明', avatar: '明', color: this.avatarColors[0], joinDate: Date.now() - 86400000 * 30 },
            { id: this.generateId(), name: '小红', avatar: '红', color: this.avatarColors[1], joinDate: Date.now() - 86400000 * 30 },
            { id: this.generateId(), name: '小刚', avatar: '刚', color: this.avatarColors[2], joinDate: Date.now() - 86400000 * 20 }
        ];
        this.data.members = sampleMembers;

        const sampleRecords = [];
        const now = Date.now();
        sampleMembers.forEach((member, i) => {
            sampleRecords.push({
                id: this.generateId(),
                memberId: member.id,
                type: 'trash',
                date: now - 86400000 * (i + 1),
                note: ''
            });
            sampleRecords.push({
                id: this.generateId(),
                memberId: member.id,
                type: 'paper',
                date: now - 86400000 * (i + 2),
                note: ''
            });
        });
        this.data.records = sampleRecords;

        this.data.schedules = this.generateDefaultSchedules(sampleMembers);
        this.saveData();
    },

    generateDefaultSchedules(members) {
        const schedules = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        Object.keys(this.taskTypes).forEach(type => {
            members.forEach((member, index) => {
                const date = new Date(now);
                date.setDate(date.getDate() + index * this.taskTypes[type].defaultInterval);
                schedules.push({
                    id: this.generateId(),
                    memberId: member.id,
                    type: type,
                    date: date.getTime(),
                    completed: false,
                    completedDate: null
                });
            });
        });

        return schedules;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    renderCurrentDate() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-CN', options);
    },

    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.getElementById('addMemberBtn').addEventListener('click', () => this.showMemberModal());
        document.getElementById('addRecordBtn').addEventListener('click', () => this.showRecordModal());
        document.getElementById('addScheduleBtn').addEventListener('click', () => this.showScheduleModal());

        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') this.closeModal();
        });

        document.getElementById('filterType').addEventListener('change', () => this.renderRecords());
        document.getElementById('filterMember').addEventListener('change', () => this.renderRecords());
    },

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    },

    renderAll() {
        this.renderDashboard();
        this.renderMembers();
        this.renderRecords();
        this.renderSchedules();
        this.renderReminders();
        this.updateMemberFilter();
    },

    renderDashboard() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const monthRecords = this.data.records.filter(r => r.date >= monthStart);
        document.getElementById('trashCount').textContent = monthRecords.filter(r => r.type === 'trash').length;
        document.getElementById('paperCount').textContent = monthRecords.filter(r => r.type === 'paper').length;
        document.getElementById('cleanCount').textContent = monthRecords.filter(r => r.type === 'clean').length;
        document.getElementById('memberCount').textContent = this.data.members.length;

        this.renderPendingTasks();
        this.renderRecentActivity();
        this.renderRanking();
    },

    renderPendingTasks() {
        const container = document.getElementById('pendingTasks');
        const now = Date.now();
        const pending = [];

        this.data.schedules.forEach(schedule => {
            if (!schedule.completed) {
                const daysDiff = Math.ceil((schedule.date - now) / (1000 * 60 * 60 * 24));
                if (daysDiff <= 2) {
                    pending.push({ ...schedule, daysDiff });
                }
            }
        });

        pending.sort((a, b) => a.daysDiff - b.daysDiff);

        if (pending.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无待处理事项 🎉</p>';
            return;
        }

        container.innerHTML = pending.slice(0, 5).map(task => {
            const member = this.data.members.find(m => m.id === task.memberId);
            const type = this.taskTypes[task.type];
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
                            <p>${this.formatDate(task.date)} · ${timeText}</p>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-success btn-sm" onclick="App.markScheduleDone('${task.id}')">已完成</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        const sorted = [...this.data.records].sort((a, b) => b.date - a.date).slice(0, 8);

        if (sorted.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无记录</p>';
            return;
        }

        container.innerHTML = sorted.map(record => {
            const member = this.data.members.find(m => m.id === record.memberId);
            const type = this.taskTypes[record.type];
            return `
                <div class="activity-item">
                    <span class="activity-emoji">${type.emoji}</span>
                    <div class="activity-content">
                        <p><strong>${member ? member.name : '未知成员'}</strong> 完成了 ${type.name}</p>
                        <span class="activity-time">${this.formatDateTime(record.date)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderRanking() {
        const container = document.getElementById('ranking');
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const stats = this.data.members.map(member => {
            const monthRecords = this.data.records.filter(
                r => r.memberId === member.id && r.date >= monthStart
            );
            return {
                member,
                count: monthRecords.length
            };
        }).sort((a, b) => b.count - a.count);

        if (stats.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无数据</p>';
            return;
        }

        container.innerHTML = stats.map((stat, index) => `
            <div class="ranking-item">
                <span class="ranking-number">${index + 1}</span>
                <span class="ranking-name">${stat.member.name}</span>
                <span class="ranking-score">${stat.count} 次</span>
            </div>
        `).join('');
    },

    renderMembers() {
        const container = document.getElementById('membersList');

        if (this.data.members.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无成员，点击上方按钮添加</p>';
            return;
        }

        container.innerHTML = this.data.members.map(member => {
            const trashCount = this.data.records.filter(r => r.memberId === member.id && r.type === 'trash').length;
            const paperCount = this.data.records.filter(r => r.memberId === member.id && r.type === 'paper').length;
            const cleanCount = this.data.records.filter(r => r.memberId === member.id && r.type === 'clean').length;
            const joinDate = this.formatDate(member.joinDate);

            return `
                <div class="member-card">
                    <div class="member-header">
                        <div class="member-avatar" style="background: ${member.color}">${member.avatar}</div>
                        <div class="member-info">
                            <h3>${member.name}</h3>
                            <p>入住：${joinDate}</p>
                        </div>
                    </div>
                    <div class="member-stats">
                        <div class="member-stat">
                            <div class="member-stat-value">${trashCount}</div>
                            <div class="member-stat-label">倒垃圾</div>
                        </div>
                        <div class="member-stat">
                            <div class="member-stat-value">${paperCount}</div>
                            <div class="member-stat-label">续厕纸</div>
                        </div>
                        <div class="member-stat">
                            <div class="member-stat-value">${cleanCount}</div>
                            <div class="member-stat-label">公区卫生</div>
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="btn btn-secondary btn-sm" onclick="App.editMember('${member.id}')">编辑</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteMember('${member.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderRecords() {
        const container = document.getElementById('recordsList');
        const filterType = document.getElementById('filterType').value;
        const filterMember = document.getElementById('filterMember').value;

        let filtered = [...this.data.records];
        if (filterType !== 'all') {
            filtered = filtered.filter(r => r.type === filterType);
        }
        if (filterMember !== 'all') {
            filtered = filtered.filter(r => r.memberId === filterMember);
        }
        filtered.sort((a, b) => b.date - a.date);

        if (filtered.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无记录</p>';
            return;
        }

        container.innerHTML = filtered.map(record => {
            const member = this.data.members.find(m => m.id === record.memberId);
            const type = this.taskTypes[record.type];
            return `
                <div class="record-item">
                    <div class="record-info">
                        <span class="record-emoji">${type.emoji}</span>
                        <div class="record-details">
                            <h4>${type.name}</h4>
                            <p>${member ? member.name : '未知成员'} · ${this.formatDateTime(record.date)}</p>
                        </div>
                    </div>
                    <button class="record-delete" onclick="App.deleteRecord('${record.id}')" title="删除">🗑️</button>
                </div>
            `;
        }).join('');
    },

    updateMemberFilter() {
        const select = document.getElementById('filterMember');
        const currentValue = select.value;
        select.innerHTML = '<option value="all">全部成员</option>' +
            this.data.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        select.value = currentValue;
    },

    renderSchedules() {
        Object.keys(this.taskTypes).forEach(type => {
            const container = document.getElementById('schedule' + type.charAt(0).toUpperCase() + type.slice(1));
            const schedules = this.data.schedules
                .filter(s => s.type === type)
                .sort((a, b) => a.date - b.date);

            if (schedules.length === 0) {
                container.innerHTML = '<p class="empty-state">暂无排班</p>';
                return;
            }

            const now = Date.now();
            container.innerHTML = schedules.map(schedule => {
                const member = this.data.members.find(m => m.id === schedule.memberId);
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
                            <div class="schedule-avatar" style="background: ${member ? member.color : '#94a3b8'}">
                                ${member ? member.avatar : '?'}
                            </div>
                            <div>
                                <div class="schedule-name">${member ? member.name : '未知成员'}</div>
                                <div class="schedule-date">${this.formatDate(schedule.date)}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="schedule-status ${statusClass}">${statusText}</span>
                            <div class="schedule-actions">
                                ${!schedule.completed ? `
                                    <button class="btn btn-success btn-sm" onclick="App.markScheduleDone('${schedule.id}')">✓</button>
                                ` : ''}
                                <button class="btn btn-danger btn-sm" onclick="App.deleteSchedule('${schedule.id}')">×</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        });
    },

    renderReminders() {
        const container = document.getElementById('remindersList');
        const now = Date.now();
        const reminders = [];

        this.data.schedules.forEach(schedule => {
            if (!schedule.completed) {
                const daysDiff = Math.ceil((schedule.date - now) / (1000 * 60 * 60 * 24));
                if (daysDiff <= 1) {
                    reminders.push({ ...schedule, daysDiff });
                }
            }
        });

        Object.keys(this.taskTypes).forEach(type => {
            const lastRecord = this.data.records
                .filter(r => r.type === type)
                .sort((a, b) => b.date - a.date)[0];

            if (lastRecord) {
                const daysSinceLast = Math.floor((now - lastRecord.date) / (1000 * 60 * 60 * 24));
                const interval = this.taskTypes[type].defaultInterval;
                if (daysSinceLast >= interval) {
                    reminders.push({
                        id: 'auto_' + type,
                        type: type,
                        auto: true,
                        daysSinceLast,
                        lastMemberId: lastRecord.memberId,
                        lastDate: lastRecord.date
                    });
                }
            } else {
                reminders.push({
                    id: 'auto_' + type,
                    type: type,
                    auto: true,
                    neverDone: true
                });
            }
        });

        if (reminders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
                    <h3 style="color: var(--text-primary); margin-bottom: 8px;">一切正常！</h3>
                    <p style="color: var(--text-muted);">当前没有逾期或即将到期的任务</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reminders.map(reminder => {
            const type = this.taskTypes[reminder.type];
            const isOverdue = reminder.daysDiff < 0 || reminder.auto;
            const isWarning = reminder.daysDiff === 0 || reminder.daysDiff === 1;

            if (reminder.auto) {
                const lastMember = reminder.lastMemberId
                    ? this.data.members.find(m => m.id === reminder.lastMemberId)
                    : null;
                const timeText = reminder.neverDone
                    ? '还没有人完成过这项任务'
                    : `上次完成是 ${reminder.daysSinceLast} 天前${lastMember ? '（' + lastMember.name + '）' : ''}`;

                return `
                    <div class="reminder-item">
                        <span class="reminder-icon">${type.emoji}</span>
                        <div class="reminder-content">
                            <h3>${type.name} 需要处理了！</h3>
                            <p>${timeText}</p>
                            <p class="reminder-time">建议尽快安排人员处理</p>
                        </div>
                        <div class="reminder-actions">
                            <button class="btn btn-primary btn-sm" onclick="App.quickAddRecord('${reminder.type}')">记录完成</button>
                        </div>
                    </div>
                `;
            }

            const member = this.data.members.find(m => m.id === reminder.memberId);
            const timeText = reminder.daysDiff < 0
                ? `已逾期 ${Math.abs(reminder.daysDiff)} 天`
                : reminder.daysDiff === 0
                    ? '今天需要完成'
                    : '明天需要完成';

            return `
                <div class="reminder-item ${isWarning ? 'warning' : ''}">
                    <span class="reminder-icon">${type.emoji}</span>
                    <div class="reminder-content">
                        <h3>${type.name} - ${member ? member.name : '未知成员'}</h3>
                        <p>排定日期：${this.formatDate(reminder.date)}</p>
                        <p class="reminder-time">${timeText}</p>
                    </div>
                    <div class="reminder-actions">
                        <button class="btn btn-success btn-sm" onclick="App.markScheduleDone('${reminder.id}')">已完成</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    showMemberModal(memberId = null) {
        const member = memberId ? this.data.members.find(m => m.id === memberId) : null;
        const title = member ? '编辑成员' : '添加成员';

        const body = `
            <form onsubmit="App.saveMember(event, '${memberId || ''}')">
                <div class="form-group">
                    <label>姓名</label>
                    <input type="text" id="memberName" required placeholder="请输入姓名" value="${member ? member.name : ''}">
                </div>
                <div class="form-group">
                    <label>头像文字（1-2个字）</label>
                    <input type="text" id="memberAvatar" maxlength="2" placeholder="如：小明 → 明" value="${member ? member.avatar : ''}">
                    <p class="form-hint">留空则自动取姓名首字</p>
                </div>
                <div class="form-group">
                    <label>头像颜色</label>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${this.avatarColors.map(color => `
                            <label style="cursor: pointer;">
                                <input type="radio" name="memberColor" value="${color}" ${member && member.color === color ? 'checked' : ''} style="display: none;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${color}; border: 3px solid ${member && member.color === color ? 'var(--text-primary)' : 'transparent'}; transition: all 0.2s;"
                                    onclick="this.previousElementSibling.checked = true; document.querySelectorAll('input[name=memberColor]').forEach(r => { r.nextElementSibling.style.borderColor = r.checked ? 'var(--text-primary)' : 'transparent'; });"></div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">${member ? '保存' : '添加'}</button>
                </div>
            </form>
        `;

        this.openModal(title, body);
    },

    saveMember(event, memberId) {
        event.preventDefault();
        const name = document.getElementById('memberName').value.trim();
        let avatar = document.getElementById('memberAvatar').value.trim();
        const colorInput = document.querySelector('input[name="memberColor"]:checked');
        const color = colorInput ? colorInput.value : this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];

        if (!name) {
            this.showToast('请输入姓名');
            return;
        }

        if (!avatar) {
            avatar = name.charAt(0);
        }

        if (memberId) {
            const member = this.data.members.find(m => m.id === memberId);
            if (member) {
                member.name = name;
                member.avatar = avatar;
                member.color = color;
                this.showToast('成员已更新');
            }
        } else {
            this.data.members.push({
                id: this.generateId(),
                name,
                avatar,
                color,
                joinDate: Date.now()
            });
            this.showToast('成员已添加');
        }

        this.saveData();
        this.closeModal();
        this.renderAll();
    },

    editMember(memberId) {
        this.showMemberModal(memberId);
    },

    deleteMember(memberId) {
        if (!confirm('确定要删除该成员吗？相关的记录和排班也会被移除。')) return;

        this.data.members = this.data.members.filter(m => m.id !== memberId);
        this.data.records = this.data.records.filter(r => r.memberId !== memberId);
        this.data.schedules = this.data.schedules.filter(s => s.memberId !== memberId);

        this.saveData();
        this.renderAll();
        this.showToast('成员已删除');
    },

    showRecordModal() {
        if (this.data.members.length === 0) {
            this.showToast('请先添加成员');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const body = `
            <form onsubmit="App.saveRecord(event)">
                <div class="form-group">
                    <label>任务类型</label>
                    <select id="recordType" required>
                        ${Object.entries(this.taskTypes).map(([key, val]) =>
                            `<option value="${key}">${val.emoji} ${val.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>完成人</label>
                    <select id="recordMember" required>
                        ${this.data.members.map(m =>
                            `<option value="${m.id}">${m.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>完成日期</label>
                    <input type="date" id="recordDate" required value="${today}">
                </div>
                <div class="form-group">
                    <label>备注（可选）</label>
                    <textarea id="recordNote" placeholder="补充说明..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `;

        this.openModal('添加记录', body);
    },

    saveRecord(event) {
        event.preventDefault();
        const type = document.getElementById('recordType').value;
        const memberId = document.getElementById('recordMember').value;
        const dateStr = document.getElementById('recordDate').value;
        const note = document.getElementById('recordNote').value.trim();

        const date = new Date(dateStr).getTime();

        this.data.records.push({
            id: this.generateId(),
            memberId,
            type,
            date,
            note
        });

        this.autoAdvanceSchedule(type, memberId);

        this.saveData();
        this.closeModal();
        this.renderAll();
        this.showToast('记录已添加');
    },

    quickAddRecord(type) {
        if (this.data.members.length === 0) {
            this.showToast('请先添加成员');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const body = `
            <form onsubmit="App.saveRecord(event)">
                <div class="form-group">
                    <label>任务类型</label>
                    <select id="recordType" required>
                        ${Object.entries(this.taskTypes).map(([key, val]) =>
                            `<option value="${key}" ${key === type ? 'selected' : ''}>${val.emoji} ${val.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>完成人</label>
                    <select id="recordMember" required>
                        ${this.data.members.map(m =>
                            `<option value="${m.id}">${m.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>完成日期</label>
                    <input type="date" id="recordDate" required value="${today}">
                </div>
                <div class="form-group">
                    <label>备注（可选）</label>
                    <textarea id="recordNote" placeholder="补充说明..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">保存</button>
                </div>
            </form>
        `;

        this.openModal('快速记录', body);
    },

    deleteRecord(recordId) {
        if (!confirm('确定要删除这条记录吗？')) return;
        this.data.records = this.data.records.filter(r => r.id !== recordId);
        this.saveData();
        this.renderAll();
        this.showToast('记录已删除');
    },

    showScheduleModal() {
        if (this.data.members.length === 0) {
            this.showToast('请先添加成员');
            return;
        }

        const today = new Date().toISOString().split('T')[0];

        const body = `
            <form onsubmit="App.saveSchedule(event)">
                <div class="form-group">
                    <label>任务类型</label>
                    <select id="scheduleType" required>
                        ${Object.entries(this.taskTypes).map(([key, val]) =>
                            `<option value="${key}">${val.emoji} ${val.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>负责人</label>
                    <select id="scheduleMember" required>
                        ${this.data.members.map(m =>
                            `<option value="${m.id}">${m.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>排定日期</label>
                    <input type="date" id="scheduleDate" required min="${today}" value="${today}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary">添加</button>
                </div>
            </form>
        `;

        this.openModal('新建排班', body);
    },

    saveSchedule(event) {
        event.preventDefault();
        const type = document.getElementById('scheduleType').value;
        const memberId = document.getElementById('scheduleMember').value;
        const dateStr = document.getElementById('scheduleDate').value;
        const date = new Date(dateStr).getTime();

        this.data.schedules.push({
            id: this.generateId(),
            memberId,
            type,
            date,
            completed: false,
            completedDate: null
        });

        this.saveData();
        this.closeModal();
        this.renderAll();
        this.showToast('排班已添加');
    },

    markScheduleDone(scheduleId) {
        const schedule = this.data.schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        schedule.completed = true;
        schedule.completedDate = Date.now();

        this.data.records.push({
            id: this.generateId(),
            memberId: schedule.memberId,
            type: schedule.type,
            date: Date.now(),
            note: '（轮值完成）'
        });

        this.autoAdvanceSchedule(schedule.type, schedule.memberId);

        this.saveData();
        this.renderAll();
        this.showToast('已标记完成');
    },

    autoAdvanceSchedule(type, lastMemberId) {
        const typeMembers = this.data.schedules
            .filter(s => s.type === type)
            .map(s => s.memberId);

        const allMembers = this.data.members.map(m => m.id);
        const memberPool = typeMembers.length >= 2 ? typeMembers : allMembers;

        const currentIndex = memberPool.indexOf(lastMemberId);
        const nextIndex = (currentIndex + 1) % memberPool.length;
        const nextMemberId = memberPool[nextIndex];

        const interval = this.taskTypes[type].defaultInterval;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + interval);
        nextDate.setHours(0, 0, 0, 0);

        const existingPending = this.data.schedules.find(
            s => s.type === type && s.memberId === nextMemberId && !s.completed
        );

        if (!existingPending) {
            this.data.schedules.push({
                id: this.generateId(),
                memberId: nextMemberId,
                type: type,
                date: nextDate.getTime(),
                completed: false,
                completedDate: null
            });
        }
    },

    deleteSchedule(scheduleId) {
        if (!confirm('确定要删除这个排班吗？')) return;
        this.data.schedules = this.data.schedules.filter(s => s.id !== scheduleId);
        this.saveData();
        this.renderAll();
        this.showToast('排班已删除');
    },

    checkReminders() {
        setInterval(() => {
            this.renderReminders();
            this.renderPendingTasks();
        }, 60000);
    },

    openModal(title, body) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('modalOverlay').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.add('hidden');
    },

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    },

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
