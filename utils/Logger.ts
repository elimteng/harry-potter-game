export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

/**
 * 日志记录器 - 单例模式
 * 用于游戏中统一记录调试信息
 */
export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel;
    
    private constructor() {
        this.logLevel = LogLevel.INFO; // 默认日志级别
    }
    
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }
    
    public getLogLevel(): LogLevel {
        return this.logLevel;
    }
    
    public debug(tag: string, ...messages: any[]): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            console.debug(`[DEBUG][${tag}]`, ...messages);
        }
    }
    
    public info(tag: string, ...messages: any[]): void {
        if (this.logLevel <= LogLevel.INFO) {
            console.info(`[INFO][${tag}]`, ...messages);
        }
    }
    
    public warn(tag: string, ...messages: any[]): void {
        if (this.logLevel <= LogLevel.WARN) {
            console.warn(`[WARN][${tag}]`, ...messages);
        }
    }
    
    public error(tag: string, ...messages: any[]): void {
        if (this.logLevel <= LogLevel.ERROR) {
            console.error(`[ERROR][${tag}]`, ...messages);
        }
    }

    public setLevel(level: LogLevel): void {
        this.logLevel = level;
        console.info(`Logger level set to: ${LogLevel[level]}`);
    }

    public cycleLogLevel(): void {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.NONE];
        const currentIndex = levels.indexOf(this.logLevel);
        const nextIndex = (currentIndex + 1) % levels.length;
        this.setLevel(levels[nextIndex]);
    }
}
