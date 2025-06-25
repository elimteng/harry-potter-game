import * as PIXI from 'pixi.js';
import { Logger } from '../utils/Logger';

/**
 * 所有游戏对象的基类
 */
export abstract class GameObject {
    protected id: string;
    protected sprite: PIXI.Sprite;
    protected position: PIXI.Point;
    protected velocity: PIXI.Point;
    protected width: number;
    protected height: number;
    protected active: boolean;
    protected logger: Logger;
    
    constructor(texture: PIXI.Texture, x: number, y: number) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.sprite = new PIXI.Sprite(texture);
        this.position = new PIXI.Point(x, y);
        this.velocity = new PIXI.Point(0, 0);
        this.sprite.position.set(x, y);
        this.width = this.sprite.width;
        this.height = this.sprite.height;
        this.active = true;
        this.logger = Logger.getInstance();
    }
    
    /**
     * 更新游戏对象
     * @param deltaTime 帧时间间隔（秒）
     */
    public update(deltaTime: number): void {
        if (!this.active) return;
        
        // 基于速度更新位置
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        
        // 更新精灵位置
        this.sprite.position.set(this.position.x, this.position.y);
    }
    
    /**
     * 检测与其他游戏对象的碰撞
     */
    public isColliding(other: GameObject): boolean {
        if (!this.active || !other.active) return false;
        
        // 简单的矩形碰撞检测
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    }
    
    /**
     * 获取对象的边界矩形
     */
    public getBounds(): PIXI.Rectangle {
        // 考虑锚点的边界计算
        const anchorX = this.sprite.anchor.x;
        const anchorY = this.sprite.anchor.y;
        
        const actualWidth = this.sprite.width;
        const actualHeight = this.sprite.height;
        
        const x = this.position.x - (actualWidth * anchorX);
        const y = this.position.y - (actualHeight * anchorY);
        
        return new PIXI.Rectangle(x, y, actualWidth, actualHeight);
    }
    
    /**
     * 获取对象的精灵
     */
    public getSprite(): PIXI.Sprite {
        return this.sprite;
    }
    
    /**
     * 获取对象ID
     */
    public getId(): string {
        return this.id;
    }
    
    /**
     * 设置对象位置
     */
    public setPosition(x: number, y: number): void {
        this.position.set(x, y);
        this.sprite.position.set(x, y);
    }
    
    /**
     * 获取对象位置
     */
    public getPosition(): PIXI.Point {
        return this.position.clone();
    }
    
    /**
     * 设置对象速度
     */
    public setVelocity(x: number, y: number): void {
        this.velocity.set(x, y);
    }
    
    /**
     * 获取对象速度
     */
    public getVelocity(): PIXI.Point {
        return this.velocity.clone();
    }
    
    /**
     * 设置对象活跃状态
     */
    public setActive(active: boolean): void {
        this.active = active;
        this.sprite.visible = active;
    }
    
    /**
     * 获取对象活跃状态
     */
    public isActive(): boolean {
        return this.active;
    }
    
    /**
     * 对象被销毁时的清理
     */
    public destroy(): void {
        this.sprite.destroy();
    }
}
