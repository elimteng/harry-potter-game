import * as PIXI from 'pixi.js';
import { GameObject } from './GameObject';
import { Logger } from '../utils/Logger';


/**
 * 咒语类型
 */
export enum SpellType {
    EXPELLIARMUS = 'expelliarmus', // 除你武器 - 哈利的标志性咒语
    STUPEFY = 'stupefy',          // 昏昏倒地 - 罗恩的咒语
    WINGARDIUM = 'wingardium',    // 漂浮咒 - 赫敏的咒语
    PATRONUS = 'patronus',        // 守护神咒 - 哈利的特殊技能，对摄魂怪有效
    AVADA = 'avada',              // 阿瓦达索命 - 食死徒咒语（绿色）
    LUCIUS_AVADA = 'lucius_avada', // 卢修斯的阿瓦达索命（蓝色）
    BELLATRIX_AVADA = 'bellatrix_avada', // 贝拉特里克斯的阿瓦达索命（红色）
    CRUCIO = 'crucio',            // 钻心咒 - 其他敌人咒语
    LUMOS = 'lumos',              // 荧光闪烁 - 基础咒语
    FLOATING_WEAPON = 'floating_weapon', // 漂浮武器 - 罗恩的漂浮咒产生的武器攻击
    ULTIMATE_ORB = 'ultimate_orb', // 大光球 - 大招技能
    BELLATRIX_TRACKING = 'bellatrix_tracking' // 贝拉特里克斯追踪魔法
}

/**
 * 咒语类
 * 处理游戏中的魔法攻击
 */
export class Spell extends GameObject {
    private spellType: SpellType | string;
    private damage: number;
    private lifespan: number; // 咒语存活时间（秒）
    private elapsedTime: number;
    private animationTextures: PIXI.Texture[] = [];
    private animationSpeed: number = 0.1; // 动画切换速度（秒）
    private lastAnimationTime: number = 0;
    private currentAnimationFrame: number = 0;
    
    // 追踪相关属性
    private trackingTarget: GameObject | null = null;
    private trackingSpeed: number = 200; // 追踪速度
    private isTracking: boolean = false;
    
    constructor(
        texture: PIXI.Texture,
        x: number,
        y: number,
        velocityX: number,
        velocityY: number,
        spellType: SpellType | string,
        damage: number = 1,
        lifespan: number = 2,
        trackingTarget?: GameObject // 可选的追踪目标
    ) {
        super(texture, x, y);
        
        this.velocity.set(velocityX, velocityY);
        this.spellType = spellType;
        this.damage = damage;
        this.lifespan = lifespan;
        this.elapsedTime = 0;
        this.trackingTarget = trackingTarget || null;
        this.isTracking = spellType === SpellType.BELLATRIX_TRACKING && this.trackingTarget !== null;
        
        // 设置咒语精灵
        this.sprite.anchor.set(0.5, 0.5);
        
        // 根据咒语类型设置不同的缩放
        if (spellType === SpellType.ULTIMATE_ORB) {
            // 大招图片保持原有大小或稍微放大
            this.sprite.scale.set(0.8, 0.8);
        } else if (spellType === SpellType.AVADA) {
            // 食死徒攻击纹理 - 更小的尺寸，保持原始比例
            this.sprite.scale.set(0.08, 0.08); // 比其他咒语更小
        } else {
        // 调整其他闪电图片大小 - 缩小尺寸
            this.sprite.scale.set(0.135, 0.18); // 进一步缩小闪电效果 (0.15*0.9, 0.2*0.9)
        }
        
        // 保持原始攻击效果的颜色，不应用任何颜色滤镜
        
        // 不添加任何滤镜效果，保持原始图片外观
        
        this.logger.info('Spell', `创建了咒语: ${spellType} 位置: (${x}, ${y}) 速度: (${velocityX}, ${velocityY})`);
    }
    
    /**
     * 更新咒语状态 - 移除所有纹理动画逻辑
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
        
        // 处理追踪逻辑
        if (this.isTracking && this.trackingTarget && this.trackingTarget.isActive()) {
            const targetPos = this.trackingTarget.getPosition();
            const currentPos = this.getPosition();
            
            // 计算到目标的向量
            const dx = targetPos.x - currentPos.x;
            const dy = targetPos.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) { // 如果距离大于5像素，继续追踪
                // 归一化方向向量
                const dirX = dx / distance;
                const dirY = dy / distance;
                
                // 设置追踪速度
                this.velocity.set(dirX * this.trackingSpeed, dirY * this.trackingSpeed);
                
                // 根据移动方向调整精灵旋转
                const angle = Math.atan2(dy, dx);
                this.sprite.rotation = angle + Math.PI / 2; // +90度因为精灵默认向上
            }
        }
        
        // 更新位置
        super.update(deltaTime);
        
        // 仅对玩家攻击咒语启用动画纹理切换（1.png和2.png之间切换）
        if (this.animationTextures.length > 1 && this.isPlayerSpell()) {
            this.lastAnimationTime += deltaTime;
            
            if (this.lastAnimationTime >= this.animationSpeed) {
                this.currentAnimationFrame = (this.currentAnimationFrame + 1) % this.animationTextures.length;
                
                // 使用 PixiJS 推荐的方式切换纹理
                const newTexture = this.animationTextures[this.currentAnimationFrame];
                if (newTexture && newTexture !== this.sprite.texture) {
                    this.sprite.texture = newTexture;
                    // PixiJS 会自动处理纹理更新
                }
                
                this.lastAnimationTime = 0;
            }
        }
        
        // 根据咒语类型设置不同的视觉效果
        if (this.spellType === SpellType.ULTIMATE_ORB) {
            // 大招特殊效果：发光
            const time = performance.now() / 1000;
            
            // 发光脉冲效果
            const pulse = Math.sin(time * 8) * 0.2 + 0.9; // 0.7 到 1.1 之间脉冲
            this.sprite.alpha = pulse;
            
            // 轻微的大小变化
            const scale = 0.8 + Math.sin(time * 4) * 0.1; // 0.7 到 0.9 之间变化
            this.sprite.scale.set(scale, scale);
        } else if (this.spellType === SpellType.BELLATRIX_TRACKING) {
            // 追踪魔法特殊效果：紫色闪烁
            const time = performance.now() / 1000;
            const pulse = Math.sin(time * 10) * 0.3 + 0.8; // 0.5 到 1.1 之间快速脉冲
            this.sprite.alpha = pulse;
            
            // 追踪魔法有淡紫色光芒
            this.sprite.tint = 0xCC00FF; // 紫色调
        } else {
            // 根据咒语类型设置不同的颜色 - PixiJS推荐的着色方法
            this.sprite.alpha = 1.0; // 固定透明度
            
            // 为不同敌人咒语设置不同颜色，避免纹理混乱
            switch (this.spellType) {
                case SpellType.AVADA:
                    // 食死徒的阿瓦达索命咒 - 保持原始纹理颜色，不添加任何着色
                    this.sprite.tint = 0xFFFFFF; // 保持原色
                    break;
                case SpellType.LUCIUS_AVADA:
                    // 卢修斯的阿瓦达索命咒 - 蓝色
                    this.sprite.tint = 0x0066FF; // 蓝色
                    break;
                case SpellType.BELLATRIX_AVADA:
                    // 贝拉特里克斯的阿瓦达索命咒 - 红色
                    this.sprite.tint = 0xFF0044; // 深红色
                    break;
                case SpellType.CRUCIO:
                    // 钻心咒 - 橙色
                    this.sprite.tint = 0xFF6600; // 橙色
                    break;
                case SpellType.EXPELLIARMUS:
                case SpellType.STUPEFY:
                case SpellType.WINGARDIUM:
                case SpellType.PATRONUS:
                    // 玩家咒语保持原色
                    this.sprite.tint = 0xFFFFFF; // 原色
                    break;
                default:
                    // 默认保持原色
                    this.sprite.tint = 0xFFFFFF;
            }
            
            // 保持垂直方向，不旋转（非追踪魔法）
            if (this.spellType !== SpellType.BELLATRIX_TRACKING) {
                this.sprite.rotation = 0;
            }
        }
    }
    
    /**
     * 设置动画纹理 - 重新启用用于玩家攻击的1.png和2.png动态切换
     */
    public setAnimationTextures(textures: PIXI.Texture[]): void {
        if (textures && textures.length > 0) {
            this.animationTextures = [...textures]; // 创建副本避免引用问题
            this.currentAnimationFrame = 0;
            this.lastAnimationTime = 0;
            this.logger.info('Spell', `设置动画纹理，共${textures.length}帧`);
        } else {
            this.logger.warn('Spell', '无效的动画纹理数组');
        }
    }
    
    /**
     * 判断是否是玩家咒语（用于动画纹理切换）
     */
    private isPlayerSpell(): boolean {
        return this.spellType === SpellType.EXPELLIARMUS ||
               this.spellType === SpellType.STUPEFY ||
               this.spellType === SpellType.WINGARDIUM ||
               this.spellType === SpellType.PATRONUS ||
               this.spellType === SpellType.LUMOS;
    }
    
    /**
     * 获取咒语类型
     */
    public getSpellType(): SpellType | string {
        return this.spellType;
    }
    
    /**
     * 获取咒语伤害值
     */
    public getDamage(): number {
        return this.damage;
    }
    
    /**
     * 咒语击中目标
     */
    public hit(): void {
        // 直接失效，不显示任何特效
        this.setActive(false);
        this.sprite.visible = false;
    }
    
    /**
     * 创建击中特效 (已废弃，保留方法以防其他地方调用)
     */
    private createHitEffect(): void {
        // 不再创建任何特效
    }

    /**
     * 替换精灵 - 用于支持动画精灵
     */
    public replaceSprite(newSprite: PIXI.Sprite | PIXI.AnimatedSprite): void {
        // 保存当前位置和属性
        const currentX = this.sprite.x;
        const currentY = this.sprite.y;
        const currentRotation = this.sprite.rotation;
        const currentAlpha = this.sprite.alpha;
        const currentTint = this.sprite.tint;
        
        // 设置新精灵的属性
        newSprite.x = currentX;
        newSprite.y = currentY;
        newSprite.rotation = currentRotation;
        newSprite.alpha = currentAlpha;
        newSprite.tint = currentTint;
        
        // 替换精灵引用
        this.sprite = newSprite as PIXI.Sprite;
        
        this.logger.info('Spell', `咒语精灵已替换为动画精灵`);
    }
}
