import { Logger } from './utils/Logger';

/**
 * 游戏计时器
 * 管理游戏帧率和时间间隔计算
 */
export class Timer {
    private targetFPS: number;
    private frameTimes: number[];
    private lastFrameTime: number;
    private frameCount: number;
    private totalTime: number;
    private logger: Logger;
    
    constructor(targetFPS: number = 60) {
        this.targetFPS = targetFPS;
        this.frameTimes = [];
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.totalTime = 0;
        this.logger = Logger.getInstance();
    }
    
    /**
     * 更新计时器，记录帧时间
     */
    public update(): number {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000; // 转换为秒
        this.lastFrameTime = currentTime;
        
        // 保存最近30帧的时间以计算平均帧率
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > 30) {
            this.frameTimes.shift();
        }
        
        this.frameCount++;
        this.totalTime += deltaTime;
        
        return deltaTime;
    }
    
    /**
     * 获取当前帧率
     */
    public getFPS(): number {
        if (this.frameTimes.length === 0) return this.targetFPS;
        
        const averageFrameTime = this.getAverageFrameTime();
        return Math.round(1 / averageFrameTime);
    }
    
    /**
     * 获取平均帧时间（秒）
     */
    public getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 1 / this.targetFPS;
        
        const sum = this.frameTimes.reduce((acc, time) => acc + time, 0);
        return sum / this.frameTimes.length;
    }
    
    /**
     * 获取游戏运行总时间（秒）
     */
    public getTotalTime(): number {
        return this.totalTime;
    }
    
    /**
     * 获取总帧数
     */
    public getFrameCount(): number {
        return this.frameCount;
    }
    
    /**
     * 重置计时器
     */
    public reset(): void {
        this.frameTimes = [];
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.totalTime = 0;
        this.logger.info('Timer', 'Timer reset');
    }

    /**
     * 开始帧计时
     */
    public startFrame(): void {
        this.update();
    }

    /**
     * 等待帧结束（用于维持目标帧率）
     */
    public waitForFrameEnd(): void {
        // 在浏览器环境中，这个方法主要用于计时记录
        // 实际的帧率控制由 requestAnimationFrame 处理
    }
}
