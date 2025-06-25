export type EventCallback = (...args: any[]) => void;

/**
 * 事件管理器 - 单例模式
 * A classic event emitter implementation.
 */
export class EventManager {
    private static instance: EventManager;
    private listeners: Map<string, EventCallback[]> = new Map();

    private constructor() {}

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    /**
     * Register an event listener.
     * @param eventName The event name.
     * @param callback The callback function.
     */
    public on(eventName: string, callback: EventCallback): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName)!.push(callback);
    }

    /**
     * Remove an event listener.
     * @param eventName The event name.
     * @param callback The callback function.
     */
    public off(eventName: string, callback: EventCallback): void {
        if (!this.listeners.has(eventName)) {
            return;
        }

        const callbacks = this.listeners.get(eventName)!;
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Dispatch an event.
     * @param eventName The event name.
     * @param args The arguments to pass to the listeners.
     */
    public emit(eventName: string, ...args: any[]): void {
        if (!this.listeners.has(eventName)) {
            return;
        }

        const callbacks = this.listeners.get(eventName)!;
        // Create a copy of the array in case a callback modifies the listeners array while iterating.
        for (const callback of [...callbacks]) {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener for '${eventName}':`, error);
            }
        }
    }

    /**
     * Subscribe to an event (alias for 'on')
     */
    public subscribe(eventName: string, callback: EventCallback): void {
        this.on(eventName, callback);
    }

    /**
     * Publish an event (alias for 'emit')
     */
    public publish(event: any): void {
        if (event && event.type) {
            this.emit(event.type, event);
        }
    }

    /**
     * Update method for game loop compatibility
     */
    public update(): void {
        // Event manager update logic if needed
    }
}

