import { generateId } from '../utils/helpers.js';

export class RecordService {
    constructor(store) {
        this.store = store;
    }

    getAll() {
        return this.store.get('records');
    }

    getFiltered(filterType, filterMember) {
        let filtered = [...this.store.get('records')];
        if (filterType && filterType !== 'all') {
            filtered = filtered.filter(r => r.type === filterType);
        }
        if (filterMember && filterMember !== 'all') {
            filtered = filtered.filter(r => r.memberId === filterMember);
        }
        return filtered.sort((a, b) => b.date - a.date);
    }

    getByMonth(monthStart) {
        return this.store.get('records').filter(r => r.date >= monthStart);
    }

    getByMember(memberId) {
        return this.store.get('records').filter(r => r.memberId === memberId);
    }

    getByType(type) {
        return this.store.get('records').filter(r => r.type === type);
    }

    getLastByType(type) {
        return this.store.get('records')
            .filter(r => r.type === type)
            .sort((a, b) => b.date - a.date)[0] || null;
    }

    add(memberId, type, date, note = '') {
        const record = {
            id: generateId(),
            memberId,
            type,
            date,
            note
        };
        this.store.update('records', records => [...records, record]);
        return record;
    }

    delete(id) {
        this.store.update('records', records => records.filter(r => r.id !== id));
    }

    generateSampleRecords(members) {
        const records = [];
        const now = Date.now();
        members.forEach((member, i) => {
            records.push({
                id: generateId(),
                memberId: member.id,
                type: 'trash',
                date: now - 86400000 * (i + 1),
                note: ''
            });
            records.push({
                id: generateId(),
                memberId: member.id,
                type: 'paper',
                date: now - 86400000 * (i + 2),
                note: ''
            });
        });
        return records;
    }
}
