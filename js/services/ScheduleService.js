import { generateId } from '../utils/helpers.js';
import { TASK_TYPES } from '../utils/constants.js';

export class ScheduleService {
    constructor(store) {
        this.store = store;
    }

    getAll() {
        return this.store.get('schedules');
    }

    getByType(type) {
        return this.store.get('schedules')
            .filter(s => s.type === type)
            .sort((a, b) => a.date - b.date);
    }

    getPending() {
        const now = Date.now();
        return this.store.get('schedules')
            .filter(s => !s.completed)
            .map(s => ({ ...s, daysDiff: Math.ceil((s.date - now) / (1000 * 60 * 60 * 24)) }))
            .filter(s => s.daysDiff <= 2)
            .sort((a, b) => a.daysDiff - b.daysDiff);
    }

    add(memberId, type, date) {
        const schedule = {
            id: generateId(),
            memberId,
            type,
            date,
            completed: false,
            completedDate: null
        };
        this.store.update('schedules', schedules => [...schedules, schedule]);
        return schedule;
    }

    markDone(id, recordService) {
        const schedule = this.store.get('schedules').find(s => s.id === id);
        if (!schedule) return;

        this.store.batch(() => {
            this.store.update('schedules', schedules =>
                schedules.map(s => s.id === id ? { ...s, completed: true, completedDate: Date.now() } : s)
            );

            recordService.add(schedule.memberId, schedule.type, Date.now(), '（轮值完成）');
            this.autoAdvance(schedule.type, schedule.memberId);
        });
    }

    delete(id) {
        this.store.update('schedules', schedules => schedules.filter(s => s.id !== id));
    }

    autoAdvance(type, lastMemberId) {
        const schedules = this.store.get('schedules');
        const members = this.store.get('members');

        const typeMemberIds = schedules
            .filter(s => s.type === type)
            .map(s => s.memberId);

        const allMemberIds = members.map(m => m.id);
        const pool = typeMemberIds.length >= 2 ? typeMemberIds : allMemberIds;

        const currentIndex = pool.indexOf(lastMemberId);
        const nextIndex = (currentIndex + 1) % pool.length;
        const nextMemberId = pool[nextIndex];

        const interval = TASK_TYPES[type].defaultInterval;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + interval);
        nextDate.setHours(0, 0, 0, 0);

        const existingPending = schedules.find(
            s => s.type === type && s.memberId === nextMemberId && !s.completed
        );

        if (!existingPending) {
            this.add(nextMemberId, type, nextDate.getTime());
        }
    }

    generateDefaultSchedules(members) {
        const schedules = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        Object.keys(TASK_TYPES).forEach(type => {
            members.forEach((member, index) => {
                const date = new Date(now);
                date.setDate(date.getDate() + index * TASK_TYPES[type].defaultInterval);
                schedules.push({
                    id: generateId(),
                    memberId: member.id,
                    type: type,
                    date: date.getTime(),
                    completed: false,
                    completedDate: null
                });
            });
        });

        return schedules;
    }
}
