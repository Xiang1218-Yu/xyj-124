export class Store {
    constructor(initialState) {
        this._state = { ...initialState };
        this._listeners = {};
        this._globalListeners = [];
        this._batchDepth = 0;
        this._pendingNotifications = [];
    }

    getState() {
        return this._state;
    }

    get(key) {
        return this._state[key];
    }

    set(key, value) {
        const oldValue = this._state[key];
        this._state[key] = value;
        if (this._batchDepth > 0) {
            this._pendingNotifications.push({ key, value, oldValue });
        } else {
            this._notify(key, value, oldValue);
        }
    }

    update(key, updater) {
        const oldValue = this._state[key];
        const newValue = updater(oldValue);
        this._state[key] = newValue;
        if (this._batchDepth > 0) {
            this._pendingNotifications.push({ key, value: newValue, oldValue });
        } else {
            this._notify(key, newValue, oldValue);
        }
    }

    batch(fn) {
        this._batchDepth++;
        try {
            fn();
        } finally {
            this._batchDepth--;
            if (this._batchDepth === 0) {
                this._flushNotifications();
            }
        }
    }

    _flushNotifications() {
        const notifications = [...this._pendingNotifications];
        this._pendingNotifications = [];
        const notified = new Set();
        notifications.forEach(({ key, value, oldValue }) => {
            if (!notified.has(key)) {
                notified.add(key);
                this._notify(key, value, oldValue);
            }
        });
    }

    subscribe(key, callback) {
        if (!this._listeners[key]) {
            this._listeners[key] = [];
        }
        this._listeners[key].push(callback);
        return () => {
            this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
        };
    }

    onAny(callback) {
        this._globalListeners.push(callback);
        return () => {
            this._globalListeners = this._globalListeners.filter(cb => cb !== callback);
        };
    }

    _notify(key, value, oldValue) {
        (this._listeners[key] || []).forEach(cb => cb(value, oldValue));
        this._globalListeners.forEach(cb => cb(key, value, oldValue));
    }

    persist(key) {
        const data = {};
        const persistKeys = key || Object.keys(this._state);
        persistKeys.forEach(k => {
            data[k] = this._state[k];
        });
        localStorage.setItem('sharehouse_data', JSON.stringify(data));
    }

    restore() {
        const saved = localStorage.getItem('sharehouse_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.keys(parsed).forEach(key => {
                this._state[key] = parsed[key];
            });
            return true;
        }
        return false;
    }

    clear() {
        localStorage.removeItem('sharehouse_data');
    }
}
