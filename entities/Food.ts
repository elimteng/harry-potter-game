import * as PIXI from 'pixi.js';
import { GameObject } from './GameObject';
import { Logger } from '../utils/Logger';
import { EventManager } from '../events/EventManager';

/**
 * 食物类型
 */
export enum FoodType {
    CHOCOLATE_FROG = 'chocolate_frog',
    BUTTERBEER = 'butterbeer', 
    CHICKEN = 'chicken'
}

/**
 * 食物类
 * 处理游戏中的食物掉落和拾取
 */
export class Food extends GameObject {
    private foodType: FoodType;
    private healAmount: number;
    private lifespan: number; // 食物存活时间（秒）
    private elapsedTime: number;
    private eventManager: EventManager;
    private fallSpeed: number;
    
    constructor(
        texture: PIXI.Texture,
        x: number,
        y: number,
        foodType: FoodType,
        healAmount: number = 0.5,
        lifespan: number = 10 // 10秒后消失
    ) {
        super(texture, x, y);
        
        this.foodType = foodType;
        this.healAmount = healAmount;
        this.lifespan = lifespan;
        this.elapsedTime = 0;
        this.eventManager = EventManager.getInstance();
        this.fallSpeed = 100; // 食物掉落速度
        
        // 设置食物精灵
        this.sprite.anchor.set(0.5, 0.5);
        this.sprite.scale.set(0.08, 0.08); // 食物尺寸
        
        // 设置碰撞盒稍微小一点，更容易拾取
        this.width = this.sprite.width * 0.8;
        this.height = this.sprite.height * 0.8;
        
        // 食物有轻微的发光效果
        this.sprite.tint = 0xFFFFAA; // 淡黄色光芒
        
        this.logger.info('Food', `创建了食物: ${foodType} 位置: (${x}, ${y}) 治疗量: ${healAmount}`);
    }
    
    /**
     * 更新食物状态
     */
    public update(deltaTime: number): void {
        if (!this.active) return;
        
        // 更新存在时间
        this.elapsedTime += deltaTime;
        
        // 超过生命周期则失效
        if (this.elapsedTime >= this.lifespan) {
            this.setActive(false);
            return;
        }
        
        // 食物向下掉落
        this.velocity.set(0, this.fallSpeed);
        
        // 更新位置
        super.update(deltaTime);
        
        // 食物发光效果动画
        const time = performance.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.1 + 0.9; // 0.8 到 1.0 之间轻微脉冲
        this.sprite.alpha = pulse;
        
        // 轻微旋转动画
        this.sprite.rotation += deltaTime * 0.5; // 慢速旋转
    }
    
    /**
     * 食物被拾取
     */
    public pickup(playerCharacter: string): void {
        if (!this.active) return;
        
        this.setActive(false);
        this.sprite.visible = false;
        
        // 发送食物拾取事件
        this.eventManager.emit('foodPickup', {
            foodType: this.foodType,
            healAmount: this.healAmount,
            playerCharacter: playerCharacter,
            position: { x: this.position.x, y: this.position.y }
        });
        
        this.logger.info('Food', `${playerCharacter}拾取了${this.foodType}，治疗量: ${this.healAmount}`);
    }
    
    /**
     * 获取食物类型
     */
    public getFoodType(): FoodType {
        return this.foodType;
    }
    
    /**
     * 获取治疗量
     */
    public getHealAmount(): number {
        return this.healAmount;
    }
} 