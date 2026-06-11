import { TASK_TYPES, AVATAR_COLORS } from '../utils/constants.js';
import { getTodayStr } from '../utils/helpers.js';

export class FormField {
    static text(id, label, options = {}) {
        const { required, placeholder, value, maxlength } = options;
        return `
            <div class="form-group">
                <label>${label}</label>
                <input type="text" id="${id}" ${required ? 'required' : ''} ${placeholder ? `placeholder="${placeholder}"` : ''} ${value ? `value="${value}"` : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}>
            </div>
        `;
    }

    static date(id, label, options = {}) {
        const { required, min, value } = options;
        return `
            <div class="form-group">
                <label>${label}</label>
                <input type="date" id="${id}" ${required ? 'required' : ''} ${min ? `min="${min}"` : ''} ${value ? `value="${value}"` : ''}>
            </div>
        `;
    }

    static select(id, label, options, config = {}) {
        const { required } = config;
        const optionsHtml = options.map(o =>
            `<option value="${o.value}" ${o.selected ? 'selected' : ''}>${o.label}</option>`
        ).join('');
        return `
            <div class="form-group">
                <label>${label}</label>
                <select id="${id}" ${required ? 'required' : ''}>${optionsHtml}</select>
            </div>
        `;
    }

    static textarea(id, label, options = {}) {
        const { placeholder } = options;
        return `
            <div class="form-group">
                <label>${label}</label>
                <textarea id="${id}" ${placeholder ? `placeholder="${placeholder}"` : ''}></textarea>
            </div>
        `;
    }

    static hint(text) {
        return `<p class="form-hint">${text}</p>`;
    }

    static actions(cancelBtn, submitBtn) {
        return `
            <div class="form-actions">
                ${cancelBtn}
                ${submitBtn}
            </div>
        `;
    }

    static typeSelect(id, selectedType) {
        const options = Object.entries(TASK_TYPES).map(([key, val]) => ({
            value: key,
            label: `${val.emoji} ${val.name}`,
            selected: key === selectedType
        }));
        return FormField.select(id, '任务类型', options, { required: true });
    }

    static memberSelect(id, members) {
        const options = members.map(m => ({
            value: m.id,
            label: m.name
        }));
        return FormField.select(id, '完成人', options, { required: true });
    }

    static colorPicker(selectedColor) {
        return `
            <div class="form-group">
                <label>头像颜色</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${AVATAR_COLORS.map(color => `
                        <label style="cursor: pointer;">
                            <input type="radio" name="memberColor" value="${color}" ${selectedColor === color ? 'checked' : ''} style="display: none;">
                            <div style="width: 36px; height: 36px; border-radius: 50%; background: ${color}; border: 3px solid ${selectedColor === color ? 'var(--text-primary)' : 'transparent'}; transition: all 0.2s;"
                                onclick="this.previousElementSibling.checked = true; document.querySelectorAll('input[name=memberColor]').forEach(r => { r.nextElementSibling.style.borderColor = r.checked ? 'var(--text-primary)' : 'transparent'; });"></div>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    static recordForm(members, type) {
        const today = getTodayStr();
        return `
            <form onsubmit="window._app.handleSaveRecord(event)">
                ${FormField.typeSelect('recordType', type || 'trash')}
                ${FormField.memberSelect('recordMember', members)}
                ${FormField.date('recordDate', '完成日期', { required: true, value: today })}
                ${FormField.textarea('recordNote', '备注（可选）', { placeholder: '补充说明...' })}
                ${FormField.actions(
                    '<button type="button" class="btn btn-secondary" onclick="window._app.closeModal()">取消</button>',
                    '<button type="submit" class="btn btn-primary">保存</button>'
                )}
            </form>
        `;
    }

    static memberForm(member) {
        return `
            <form onsubmit="window._app.handleSaveMember(event, '${member ? member.id : ''}')">
                ${FormField.text('memberName', '姓名', { required: true, placeholder: '请输入姓名', value: member ? member.name : '' })}
                ${FormField.text('memberAvatar', '头像文字（1-2个字）', { maxlength: 2, placeholder: '如：小明 → 明', value: member ? member.avatar : '' })}
                ${FormField.hint('留空则自动取姓名首字')}
                ${FormField.colorPicker(member ? member.color : '')}
                ${FormField.actions(
                    '<button type="button" class="btn btn-secondary" onclick="window._app.closeModal()">取消</button>',
                    `<button type="submit" class="btn btn-primary">${member ? '保存' : '添加'}</button>`
                )}
            </form>
        `;
    }

    static scheduleForm(members) {
        const today = getTodayStr();
        return `
            <form onsubmit="window._app.handleSaveSchedule(event)">
                ${FormField.typeSelect('scheduleType', 'trash')}
                ${FormField.memberSelect('scheduleMember', members)}
                ${FormField.date('scheduleDate', '排定日期', { required: true, min: today, value: today })}
                ${FormField.actions(
                    '<button type="button" class="btn btn-secondary" onclick="window._app.closeModal()">取消</button>',
                    '<button type="submit" class="btn btn-primary">添加</button>'
                )}
            </form>
        `;
    }
}
