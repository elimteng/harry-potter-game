/**
 * EventBus - React和Phaser之间的通信桥梁
 * 浏览器兼容的事件总线实现
 */
class EventBusClass {
    private events: { [key: string]: Function[] } = {};

    on(event: string, callback: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event: string, ...args: any[]) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for '${event}':`, error);
                }
            });
        }
    }

    off(event: string, callback?: Function) {
        if (!this.events[event]) return;
        
        if (callback) {
            const index = this.events[event].indexOf(callback);
            if (index > -1) {
                this.events[event].splice(index, 1);
            }
        } else {
            // 如果没有指定回调，移除所有该事件的监听器
            delete this.events[event];
        }
    }

    removeAllListeners() {
        this.events = {};
    }

    // 兼容原有的 removeAllListeners 调用
    once(event: string, callback: Function) {
        const onceCallback = (...args: any[]) => {
            callback(...args);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }
}

export const EventBus = new EventBusClass(); 