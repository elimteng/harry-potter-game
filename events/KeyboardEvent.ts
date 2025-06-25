/**
 * 自定义键盘事件类
 * 封装原生键盘事件信息
 */
export class KeyboardEvent {
    public readonly key: string;
    public readonly code: string;
    public readonly keyCode: number;
    public readonly type: 'keydown' | 'keyup';
    public readonly altKey: boolean;
    public readonly ctrlKey: boolean;
    public readonly shiftKey: boolean;
    public readonly timestamp: number;
    
    constructor(keyOrEvent: string | globalThis.KeyboardEvent, code?: string, isPressed?: boolean) {
        if (typeof keyOrEvent === 'string') {
            // 自定义构造函数用于GameEngine
            this.key = keyOrEvent;
            this.code = code || keyOrEvent;
            this.keyCode = this.getKeyCode(keyOrEvent);
            this.type = isPressed ? 'keydown' : 'keyup';
            this.altKey = false;
            this.ctrlKey = false;
            this.shiftKey = false;
            this.timestamp = Date.now();
        } else {
            // 原生事件构造函数
            const nativeEvent = keyOrEvent;
        this.key = nativeEvent.key;
        this.code = nativeEvent.code;
        this.keyCode = nativeEvent.keyCode;
        this.type = nativeEvent.type as 'keydown' | 'keyup';
        this.altKey = nativeEvent.altKey;
        this.ctrlKey = nativeEvent.ctrlKey;
        this.shiftKey = nativeEvent.shiftKey;
        this.timestamp = Date.now();
        }
    }

    private getKeyCode(key: string): number {
        const keyCodeMap: { [key: string]: number } = {
            'space': 32,
            'arrowleft': 37,
            'arrowup': 38,
            'arrowright': 39,
            'arrowdown': 40,
            'enter': 13,
            'escape': 27,
            'a': 65, 'd': 68, 's': 83, 'w': 87,
            '1': 49, '2': 50, '3': 51,
            'F1': 112, 'F2': 113, 'F3': 114, 'F4': 115
        };
        return keyCodeMap[key.toLowerCase()] || key.charCodeAt(0);
    }
    
    /**
     * 检查是否按下了方向键
     */
    public isDirectionKey(): boolean {
        return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(this.key);
    }
    
    /**
     * 检查是否按下了动作键（如空格、回车等）
     */
    public isActionKey(): boolean {
        return ['Space', ' ', 'Enter'].includes(this.key);
    }
}
