import { TASK_TYPES } from '../utils/constants.js';
import { formatDateTime } from '../utils/helpers.js';
import { EmptyState } from '../components/EmptyState.js';
import { FormField } from '../components/FormField.js';

export class RecordsModule {
    constructor(store, memberService, recordService, modal, toast) {
        this.store = store;
        this.memberService = memberService;
        this.recordService = recordService;
        this.modal = modal;
        this.toast = toast;
    }

    render() {
        this.renderRecords();
        this.updateMemberFilter();
    }

    renderRecords() {
        const container = document.getElementById('recordsList');
        const filterType = document.getElementById('filterType').value;
        const filterMember = document.getElementById('filterMember').value;
        const filtered = this.recordService.getFiltered(filterType, filterMember);

        if (filtered.length === 0) {
            container.innerHTML = EmptyState.render('暂无记录');
            return;
        }

        container.innerHTML = filtered.map(record => {
            const member = this.memberService.getById(record.memberId);
            const type = TASK_TYPES[record.type];
            return `
                <div class="record-item">
                    <div class="record-info">
                        <span class="record-emoji">${type.emoji}</span>
                        <div class="record-details">
                            <h4>${type.name}</h4>
                            <p>${member ? member.name : '未知成员'} · ${formatDateTime(record.date)}</p>
                        </div>
                    </div>
                    <button class="record-delete" onclick="window._app.deleteRecord('${record.id}')" title="删除">🗑️</button>
                </div>
            `;
        }).join('');
    }

    updateMemberFilter() {
        const select = document.getElementById('filterMember');
        const currentValue = select.value;
        const members = this.memberService.getAll();
        select.innerHTML = '<option value="all">全部成员</option>' +
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        select.value = currentValue;
    }

    showAddModal(type) {
        const members = this.memberService.getAll();
        if (members.length === 0) {
            this.toast.show('请先添加成员');
            return;
        }
        const title = type ? '快速记录' : '添加记录';
        this.modal.open(title, FormField.recordForm(members, type));
    }

    saveRecord(event) {
        event.preventDefault();
        const type = document.getElementById('recordType').value;
        const memberId = document.getElementById('recordMember').value;
        const dateStr = document.getElementById('recordDate').value;
        const note = document.getElementById('recordNote').value.trim();
        const date = new Date(dateStr).getTime();

        this.recordService.add(memberId, type, date, note);
        this.modal.close();
        this.toast.show('记录已添加');
    }

    deleteRecord(recordId) {
        if (!confirm('确定要删除这条记录吗？')) return;
        this.recordService.delete(recordId);
        this.toast.show('记录已删除');
    }
}
