import { Store } from './store/Store.js';
import { MemberService } from './services/MemberService.js';
import { RecordService } from './services/RecordService.js';
import { ScheduleService } from './services/ScheduleService.js';
import { ReminderService } from './services/ReminderService.js';
import { BillService } from './services/BillService.js';
import { Modal } from './components/Modal.js';
import { Toast } from './components/Toast.js';
import { TabNav } from './components/TabNav.js';
import { DashboardModule } from './modules/DashboardModule.js';
import { MembersModule } from './modules/MembersModule.js';
import { RecordsModule } from './modules/RecordsModule.js';
import { ScheduleModule } from './modules/ScheduleModule.js';
import { BillsModule } from './modules/BillsModule.js';
import { RemindersModule } from './modules/RemindersModule.js';
import { getCurrentDateDisplay } from './utils/helpers.js';

class App {
    constructor() {
        this.store = new Store({
            members: [],
            records: [],
            schedules: [],
            bills: []
        });

        this.memberService = new MemberService(this.store);
        this.recordService = new RecordService(this.store);
        this.scheduleService = new ScheduleService(this.store);
        this.reminderService = new ReminderService(this.store);
        this.billService = new BillService(this.store);

        this.modal = new Modal();
        this.toast = new Toast();

        this.dashboardModule = new DashboardModule(
            this.store, this.memberService, this.recordService, this.scheduleService, this.billService
        );
        this.membersModule = new MembersModule(
            this.store, this.memberService, this.modal, this.toast
        );
        this.recordsModule = new RecordsModule(
            this.store, this.memberService, this.recordService, this.modal, this.toast
        );
        this.scheduleModule = new ScheduleModule(
            this.store, this.memberService, this.scheduleService, this.recordService, this.modal, this.toast
        );
        this.billsModule = new BillsModule(
            this.store, this.memberService, this.billService, this.modal, this.toast
        );
        this.remindersModule = new RemindersModule(
            this.store, this.memberService, this.reminderService
        );

        this._setupStoreSubscriptions();
        this._exposeGlobalHandlers();
    }

    init() {
        this._loadData();
        this._renderCurrentDate();
        this._bindEvents();
        this._renderAll();
        this._startReminderCheck();
    }

    _loadData() {
        const restored = this.store.restore();
        if (!restored) {
            this._initSampleData();
        }
    }

    _initSampleData() {
        this.store.batch(() => {
            const members = this.memberService.generateSampleMembers();
            this.store.set('members', members);

            const records = this.recordService.generateSampleRecords(members);
            this.store.set('records', records);

            const schedules = this.scheduleService.generateDefaultSchedules(members);
            this.store.set('schedules', schedules);
        });
        this.store.persist();
    }

    _setupStoreSubscriptions() {
        this.store.onAny(() => {
            this.store.persist();
            this._renderAll();
        });
    }

    _renderCurrentDate() {
        document.getElementById('currentDate').textContent = getCurrentDateDisplay();
    }

    _bindEvents() {
        this.tabNav = new TabNav('.tabs', (tabId) => {
            this._renderAll();
        });

        document.getElementById('addMemberBtn').addEventListener('click', () => {
            this.membersModule.showAddModal();
        });
        document.getElementById('addRecordBtn').addEventListener('click', () => {
            this.recordsModule.showAddModal();
        });
        document.getElementById('addScheduleBtn').addEventListener('click', () => {
            this.scheduleModule.showAddModal();
        });
        document.getElementById('addBillBtn').addEventListener('click', () => {
            this.billsModule.showAddModal();
        });

        document.getElementById('filterType').addEventListener('change', () => {
            this.recordsModule.renderRecords();
        });
        document.getElementById('filterMember').addEventListener('change', () => {
            this.recordsModule.renderRecords();
        });

        document.getElementById('billFilterCategory').addEventListener('change', () => {
            this.billsModule.renderBills();
        });
        document.getElementById('billFilterMember').addEventListener('change', () => {
            this.billsModule.renderBills();
        });
    }

    _renderAll() {
        this.dashboardModule.render();
        this.membersModule.render();
        this.recordsModule.render();
        this.scheduleModule.render();
        this.billsModule.render();
        this.remindersModule.render();
    }

    _startReminderCheck() {
        setInterval(() => {
            this.remindersModule.render();
            this.dashboardModule.renderPendingTasks();
        }, 60000);
    }

    _exposeGlobalHandlers() {
        window._app = {
            handleSaveMember: (event, memberId) => this.membersModule.saveMember(event, memberId),
            editMember: (memberId) => this.membersModule.showEditModal(memberId),
            deleteMember: (memberId) => this.membersModule.deleteMember(memberId),

            handleSaveRecord: (event) => {
                this.recordsModule.saveRecord(event);
            },
            quickAddRecord: (type) => this.recordsModule.showAddModal(type),
            deleteRecord: (recordId) => this.recordsModule.deleteRecord(recordId),

            handleSaveSchedule: (event) => this.scheduleModule.saveSchedule(event),
            markScheduleDone: (scheduleId) => {
                this.scheduleModule.markDone(scheduleId);
            },
            deleteSchedule: (scheduleId) => this.scheduleModule.deleteSchedule(scheduleId),

            handleSaveBill: (event) => this.billsModule.saveBill(event),
            editBill: (billId) => this.billsModule.showEditModal(billId),
            deleteBill: (billId) => this.billsModule.deleteBill(billId),
            settleBill: (billId) => this.billsModule.settleBill(billId),
            settleAllBills: () => this.billsModule.settleAllBills(),
            viewBillEvidence: (billId) => this.billsModule.viewBillEvidence(billId),

            closeModal: () => this.modal.close()
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
