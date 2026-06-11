import { generateId } from '../utils/helpers.js';

export class BillService {
    constructor(store) {
        this.store = store;
    }

    getAll() {
        return this.store.get('bills') || [];
    }

    getById(id) {
        return this.getAll().find(b => b.id === id);
    }

    getByMonth(monthStart) {
        return this.getAll().filter(b => b.date >= monthStart);
    }

    getFiltered(filterCategory, filterMember, monthStart) {
        let filtered = this.getAll();
        if (monthStart) {
            filtered = filtered.filter(b => b.date >= monthStart);
        }
        if (filterCategory && filterCategory !== 'all') {
            filtered = filtered.filter(b => b.category === filterCategory);
        }
        if (filterMember && filterMember !== 'all') {
            filtered = filtered.filter(b => b.payerId === filterMember);
        }
        return filtered.sort((a, b) => b.date - a.date);
    }

    getMonthTotal(monthStart) {
        return this.getByMonth(monthStart).reduce((sum, b) => sum + b.amount, 0);
    }

    getCategoryTotal(monthStart) {
        const bills = this.getByMonth(monthStart);
        const result = {};
        bills.forEach(b => {
            if (!result[b.category]) result[b.category] = 0;
            result[b.category] += b.amount;
        });
        return result;
    }

    calculateSettlement(members) {
        const bills = this.getAll().filter(b => !b.settled);
        if (bills.length === 0 || members.length === 0) return [];

        const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0);
        const perPerson = Math.round((totalAmount / members.length) * 100) / 100;

        const balances = {};
        members.forEach(m => { balances[m.id] = -perPerson; });

        bills.forEach(b => {
            if (balances[b.payerId] !== undefined) {
                balances[b.payerId] += b.amount;
            }
        });

        const debtors = [];
        const creditors = [];
        Object.entries(balances).forEach(([memberId, balance]) => {
            const member = members.find(m => m.id === memberId);
            if (!member) return;
            if (balance < -0.01) {
                debtors.push({ memberId, name: member.name, amount: Math.abs(balance) });
            } else if (balance > 0.01) {
                creditors.push({ memberId, name: member.name, amount: balance });
            }
        });

        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const settlements = [];
        let i = 0, j = 0;
        while (i < debtors.length && j < creditors.length) {
            const payAmount = Math.min(debtors[i].amount, creditors[j].amount);
            if (payAmount > 0.01) {
                settlements.push({
                    from: debtors[i].name,
                    fromId: debtors[i].memberId,
                    to: creditors[j].name,
                    toId: creditors[j].memberId,
                    amount: Math.round(payAmount * 100) / 100
                });
            }
            debtors[i].amount -= payAmount;
            creditors[j].amount -= payAmount;
            if (debtors[i].amount < 0.01) i++;
            if (creditors[j].amount < 0.01) j++;
        }

        return settlements;
    }

    add(data) {
        const bill = {
            id: generateId(),
            category: data.category,
            amount: parseFloat(data.amount),
            payerId: data.payerId,
            date: data.date,
            note: data.note || '',
            evidence: data.evidence || null,
            settled: false,
            createdAt: Date.now()
        };
        this.store.update('bills', bills => [...(bills || []), bill]);
        return bill;
    }

    update(id, data) {
        this.store.update('bills', bills =>
            (bills || []).map(b => b.id === id ? { ...b, ...data } : b)
        );
    }

    delete(id) {
        this.store.update('bills', bills => (bills || []).filter(b => b.id !== id));
    }

    markSettled(id) {
        this.update(id, { settled: true });
    }

    markAllSettled() {
        this.store.update('bills', bills =>
            (bills || []).map(b => ({ ...b, settled: true }))
        );
    }

    getUnsettledTotal() {
        return this.getAll().filter(b => !b.settled).reduce((sum, b) => sum + b.amount, 0);
    }

    getSettledTotal() {
        return this.getAll().filter(b => b.settled).reduce((sum, b) => sum + b.amount, 0);
    }
}
