import * as PIXI from 'pixi.js';
import { GameObject } from './GameObject';
import { EventManager } from '../events/EventManager';

// 玩家角色类型
export enum PlayerCharacter {
    HARRY = 'harry',
    RON = 'ron',
    HERMIONE = 'hermione'
}

/**
 * 玩家角色类
 * 处理玩家移动、攻击和状态
 */
export class Player extends GameObject {
    private character: PlayerCharacter;
    private normalTexture: PIXI.Texture;
    private attackTexture: PIXI.Texture;
    private speed: number;
    private attackCooldown: number;
    private lastAttackTime: number;
    private lastPatronusTime: number; // 守护神咒专用冷却时间
    private lastStupefyTime: number; // 昏迷咒专用冷却时间
    private lastWingardiumTime: number; // 漂浮咒专用冷却时间
    private lives: number;
    private score: number;
    private ultimateSkillCharges: number = 0; // 大招次数
    private attackSound: HTMLAudioElement | null;
    private patronusSound: HTMLAudioElement | null; // 守护神咒专用音效

    private eventManager: EventManager;
    private invincible: boolean = false;
    private invincibilityTimer: number = 0; // 无敌时间计时器
    private ronMode: boolean = false; // 罗恩模式状态
    private ronModeTimer: number = 0; // 罗恩模式计时器
    private readonly RON_MODE_DURATION: number = 15; // 罗恩模式持续15秒
    private maxLives: number = 5; // 最大生命值
    private initialPosition: { x: number, y: number };
    private blinkTimers: (number | NodeJS.Timeout)[] = []; // 存储闪烁定时器，确保能正确清理

    constructor(
        character: PlayerCharacter,
        normalTexture: PIXI.Texture,
        attackTexture: PIXI.Texture,
        x: number,
        y: number,
        speed: number = 300
    ) {
        super(normalTexture, x, y);

        this.character = character;
        this.normalTexture = normalTexture;
        this.attackTexture = attackTexture;
        this.speed = speed;
        this.attackCooldown = 0.5; // 攻击冷却时间（秒）
        this.lastAttackTime = 0;
        this.lastPatronusTime = 0; // 初始化守护神咒冷却时间
        this.lastStupefyTime = 0; // 初始化昏迷咒冷却时间
        this.lastWingardiumTime = 0; // 初始化漂浮咒冷却时间
        this.lives = 5;
        this.score = 0;
        this.eventManager = EventManager.getInstance();
        this.initialPosition = { x, y };

        this.sprite.anchor.set(0.5, 1);
        this.sprite.scale.set(0.09, 0.09); // 缩放到9%大小 (0.1 * 0.9)
        this.width = this.sprite.width * 0.7;
        this.height = this.sprite.height * 0.8;

        try {
            this.attackSound = new Audio('/sound/Stupefy.mp3');
            this.attackSound.volume = 0.45; // 调高普通攻击音量
        } catch (error) {
            this.logger.warn('Player', `无法加载攻击音效: ${error}`);
            this.attackSound = null;
        }

        try {
            this.patronusSound = new Audio('/sound/Patronum.mp3');
            this.patronusSound.volume = 0.85; // 调高守护神咒音量
        } catch (error) {
            this.logger.warn('Player', `无法加载守护神咒音效: ${error}`);
            this.patronusSound = null;
        }

        this.logger.info('Player', `创建了角色: ${character}`);
    }

    public update(deltaTime: number): void {
        super.update(deltaTime);
        
        // 更新无敌状态计时器
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) {
                this.invincibilityTimer = 0;
                this.invincible = false;
                this.logger.info('Player', '无敌状态结束');
            }
        }
        
        // 更新罗恩模式计时器
        if (this.ronModeTimer > 0) {
            this.ronModeTimer -= deltaTime;
            if (this.ronModeTimer <= 0) {
                this.ronModeTimer = 0;
                this.ronMode = false;
                this.invincible = false;
                this.invincibilityTimer = 0;
                
                // 发送罗恩模式结束事件
                this.eventManager.emit('ronModeEnd');
                this.logger.info('Player', '罗恩模式结束');
            }
        }
        
        // 无敌状态的视觉效果
        if (this.invincible || this.ronMode) {
            const time = performance.now() / 1000;
            if (this.ronMode) {
                // 罗恩模式：金色闪烁效果
                const pulse = Math.sin(time * 8) * 0.3 + 0.8; // 快速金色脉冲
                this.sprite.tint = 0xFFD700; // 金色
                this.sprite.alpha = pulse;
            } else {
                // 普通无敌：蓝色闪烁效果
                const pulse = Math.sin(time * 6) * 0.4 + 0.7; // 蓝色脉冲
                this.sprite.tint = 0x4169E1; // 蓝色
                this.sprite.alpha = pulse;
            }
        } else {
            // 恢复正常外观
            this.sprite.tint = 0xFFFFFF; // 白色（无着色）
            this.sprite.alpha = 1.0;
        }
    }

    public move(direction: 'left' | 'right', deltaTime: number, screenWidth?: number): void {
        if (!this.active) return;
        const speed = this.speed * deltaTime;
        const spriteWidth = this.sprite.width;
        
        if (direction === 'left') {
            this.position.x = Math.max(spriteWidth / 2, this.position.x - speed);
        } else {
            const maxX = screenWidth ? screenWidth - spriteWidth / 2 : this.position.x + speed;
            this.position.x = Math.min(maxX, this.position.x + speed);
        }
        this.sprite.position.set(this.position.x, this.position.y);
    }

    public attack(): void {
        const currentTime = performance.now() / 1000;
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return;
        }

        this.lastAttackTime = currentTime;
        // 移除纹理切换逻辑，保持攻击姿势

        if (this.attackSound) {
            this.attackSound.currentTime = 0;
            this.attackSound.play().catch(err => {
                this.logger.error('Player', `播放攻击音效失败: ${err}`);
            });
        }

        // 攻击效果位置往右移动一点
        const spellX = this.position.x + 15; // 适应缩小后的角色大小
        // 从角色图片的顶部发出光束
        // 锚点在底部(0.5, 1)，所以角色顶部是position.y减去实际高度
        const actualHeight = this.sprite.height; // 使用sprite的实际高度
        const spellY = this.position.y - actualHeight;
        this.eventManager.emit('playerAttack', { spellX, spellY, character: this.character });
    }
    
    /**
     * 哈利的特殊攻击 - 守护神咒（对摄魂怪有效）
     */
    public usePatronus(): void {
        if (this.character !== PlayerCharacter.HARRY) {
            this.logger.warn('Player', '只有哈利可以使用守护神咒');
            return;
        }
        
        const currentTime = performance.now() / 1000;
        if (this.lastPatronusTime > 0 && currentTime - this.lastPatronusTime < 30) { // 守护神咒30秒冷却时间，首次使用不冷却
            return;
        }

        this.lastPatronusTime = currentTime;
        
        if (this.patronusSound) {
            this.patronusSound.currentTime = 0;
            this.patronusSound.play().catch(err => {
                this.logger.error('Player', `播放守护神咒音效失败: ${err}`);
            });
        }

        // 守护神咒从玩家位置发出
        const spellX = this.position.x + 15;
        const actualHeight = this.sprite.height;
        const spellY = this.position.y - actualHeight;
        this.eventManager.emit('patronusAttack', { spellX, spellY });
    }

    /**
     * 赫敏的特殊攻击 - 昏迷咒（全屏AOE，定住所有敌人）
     */
    public useStupefy(): void {
        if (this.character !== PlayerCharacter.HERMIONE) {
            this.logger.warn('Player', '只有赫敏可以使用昏迷咒');
            return;
        }
        
        const currentTime = performance.now() / 1000;
        if (this.lastStupefyTime > 0 && currentTime - this.lastStupefyTime < 20) { // 昏迷咒20秒冷却时间
            return;
        }

        this.lastStupefyTime = currentTime; // 使用独立的昏迷咒冷却时间
        
        // 昏迷咒音效在GameWorld中统一处理

        // 发射昏迷咒事件
        this.eventManager.emit('stupefyAttack');
    }

    /**
     * 罗恩的特殊攻击 - 漂浮咒（使敌人飞起来并缓慢下落）
     */
    public useWingardium(): void {
        if (this.character !== PlayerCharacter.RON) {
            this.logger.warn('Player', '只有罗恩可以使用漂浮咒');
            return;
        }
        
        const currentTime = performance.now() / 1000;
        if (this.lastWingardiumTime > 0 && currentTime - this.lastWingardiumTime < 15) { // 漂浮咒15秒冷却时间
            return;
        }

        this.lastWingardiumTime = currentTime; // 使用独立的漂浮咒冷却时间
        
        // 漂浮咒音效在GameWorld中统一处理

        // 发射漂浮咒事件
        this.eventManager.emit('wingardiumAttack');
    }

    /**
     * 使用大招 - 大光球攻击
     */
    public useUltimateSkill(): void {
        if (this.ultimateSkillCharges <= 0) {
            this.logger.warn('Player', '没有大招次数');
            return;
        }

        this.ultimateSkillCharges--;
        this.eventManager.emit('ultimateSkillChargesChanged', this.ultimateSkillCharges);
        
        if (this.attackSound) {
            this.attackSound.currentTime = 0;
            this.attackSound.play().catch(err => {
                this.logger.error('Player', `播放大招音效失败: ${err}`);
            });
        }

        // 发射大光球从玩家位置
        const spellX = this.position.x;
        const actualHeight = this.sprite.height;
        const spellY = this.position.y - actualHeight;
        this.eventManager.emit('ultimateAttack', { spellX, spellY });
        
        this.logger.info('Player', `使用大招，剩余次数: ${this.ultimateSkillCharges}`);
    }

    /**
     * 玩家受到伤害
     */
    public takeDamage(damage: number): void {
        
        // 无敌状态或罗恩模式下不受伤害
        if (!this.active || this.invincible || this.ronMode) {
            return;
        }

        this.lives -= damage;
        // 确保生命值不低于0
        this.lives = Math.max(0, this.lives);
        this.eventManager.emit('playerHealthChanged', this.lives);

        if (this.lives <= 0) {
            this.die();
        } else {
            this.setInvincible(1.5); // 受伤后1.5秒无敌
            this.blink();
        }
    }

    /**
     * 治疗玩家
     */
    public heal(amount: number): void {
        if (!this.active) return;
        
        const oldLives = this.lives;
        this.lives = Math.min(this.maxLives, this.lives + amount);
        
        if (oldLives !== this.lives) {
            this.eventManager.emit('playerHealthChanged', this.lives);
            this.logger.info('Player', `玩家治疗 ${amount} 格血，生命值: ${oldLives} -> ${this.lives}`);
            
            // 治疗特效
            this.createHealEffect();
        }
    }
    
    /**
     * 设置无敌状态
     */
    public setInvincible(duration: number): void {
        this.invincible = true;
        this.invincibilityTimer = duration;
        this.logger.info('Player', `设置无敌状态 ${duration} 秒`);
    }
    
    /**
     * 激活罗恩模式
     */
    public activateRonMode(): void {
        if (this.character !== PlayerCharacter.RON) {
            this.logger.warn('Player', '只有罗恩可以激活罗恩模式');
            return;
        }
        
        this.ronMode = true;
        this.ronModeTimer = this.RON_MODE_DURATION;
        this.invincible = true; // 罗恩模式期间无敌
        this.invincibilityTimer = this.RON_MODE_DURATION;
        
        // 发送罗恩模式开始事件
        this.eventManager.emit('ronModeStart', {
            duration: this.RON_MODE_DURATION,
            position: { x: this.position.x, y: this.position.y }
        });
        
        this.logger.info('Player', `罗恩激活无敌模式，持续 ${this.RON_MODE_DURATION} 秒`);
    }
    
    /**
     * 创建治疗特效
     */
    private createHealEffect(): void {
        // 治疗时闪绿光
        const originalTint = this.sprite.tint;
        this.sprite.tint = 0x00FF00; // 绿色
        
        setTimeout(() => {
            if (this.sprite) {
                this.sprite.tint = originalTint;
            }
        }, 300);
    }
    
    /**
     * 取消罗恩模式
     */
    public cancelRonMode(): void {
        if (this.ronMode) {
            this.ronMode = false;
            this.ronModeTimer = 0;
            this.invincible = false;
            this.invincibilityTimer = 0;
            
            this.logger.info('Player', '罗恩模式被手动取消');
        }
    }
    
    /**
     * 检查是否在罗恩模式
     */
    public isInRonMode(): boolean {
        return this.ronMode;
    }
    
    /**
     * 获取罗恩模式剩余时间
     */
    public getRonModeTimeRemaining(): number {
        return this.ronModeTimer;
    }

    /**
     * 玩家死亡
     */
    private die(): void {
        this.logger.info('Player', `Player died with score: ${this.score}, lives: ${this.lives}`);
        this.active = false;
        this.eventManager.emit('gameOver');
    }

    /**
     * 闪烁效果
     */
    private blink(): void {
        // 清理之前的闪烁定时器，防止重复闪烁
        this.clearBlinkTimers();
        
        let blinkCount = 0;
        const maxBlinks = 6;
        const blinkInterval = setInterval(() => {
            this.sprite.visible = !this.sprite.visible;
            blinkCount++;
            if (blinkCount >= maxBlinks) {
                clearInterval(blinkInterval);
                this.sprite.visible = true;
                // 从定时器数组中移除
                const index = this.blinkTimers.indexOf(blinkInterval);
                if (index > -1) {
                    this.blinkTimers.splice(index, 1);
                }
            }
        }, 100);
        
        // 记录定时器以便后续清理
        this.blinkTimers.push(blinkInterval);
    }

    /**
     * 清理所有定时器（包括闪烁和无敌定时器）
     */
    private clearBlinkTimers(): void {
        for (const timer of this.blinkTimers) {
            clearInterval(timer as number);
            clearTimeout(timer as NodeJS.Timeout); // 也清理setTimeout定时器
        }
        this.blinkTimers = [];
        this.sprite.visible = true; // 确保角色可见
        this.invincible = false; // 重置无敌状态
    }

    /**
     * 增加分数
     */
    public addScore(points: number): void {
        const oldScore = this.score;
        this.score += points;
        this.logger.debug('Player', `Score updated: ${oldScore} + ${points} = ${this.score}`);
        this.eventManager.emit('scoreUpdated', this.score);
    }

    /**
     * 获取玩家生命值
     */
    public isAlive(): boolean {
        return this.lives > 0;
    }

    /**
     * 获取玩家生命值
     */
    public getHealth(): number {
        return this.lives;
    }

    /**
     * 获取玩家分数
     */
    public getScore(): number {
        this.logger.debug('Player', `getScore() called, returning: ${this.score}`);
        return this.score;
    }

    /**
     * 获取角色类型
     */
    public getCharacter(): PlayerCharacter {
        return this.character;
    }

    /**
     * 获取玩家生命数
     */
    public getLives(): number {
        return this.lives;
    }

    /**
     * 获取守护神咒剩余冷却时间
     */
    public getPatronusCooldown(): number {
        if (this.lastPatronusTime === 0) return 0; // 首次使用无冷却
        const currentTime = performance.now() / 1000;
        const remainingTime = 30 - (currentTime - this.lastPatronusTime);
        return Math.max(0, remainingTime);
    }

    /**
     * 获取昏迷咒剩余冷却时间
     */
    public getStupefyCooldown(): number {
        if (this.lastStupefyTime === 0) return 0; // 首次使用无冷却
        const currentTime = performance.now() / 1000;
        const remainingTime = 20 - (currentTime - this.lastStupefyTime);
        return Math.max(0, remainingTime);
    }

    /**
     * 获取漂浮咒剩余冷却时间
     */
    public getWingardiumCooldown(): number {
        if (this.lastWingardiumTime === 0) return 0; // 首次使用无冷却
        const currentTime = performance.now() / 1000;
        const remainingTime = 15 - (currentTime - this.lastWingardiumTime);
        return Math.max(0, remainingTime);
    }

    /**
     * 获取大招次数
     */
    public getUltimateSkillCharges(): number {
        return this.ultimateSkillCharges;
    }

    /**
     * 增加大招次数
     */
    public addUltimateSkillCharge(): void {
        this.ultimateSkillCharges++;
        this.eventManager.emit('ultimateSkillChargesChanged', this.ultimateSkillCharges);
        this.logger.info('Player', `获得大招次数，当前次数: ${this.ultimateSkillCharges}`);
    }

    /**
     * 设置角色
     */
    public setCharacter(character: PlayerCharacter, normalTexture: PIXI.Texture, attackTexture: PIXI.Texture): void {
        this.character = character;
        this.normalTexture = normalTexture;
        this.attackTexture = attackTexture;
        this.sprite.texture = normalTexture; // 使用普通纹理作为默认显示
        this.sprite.scale.set(0.09, 0.09); // 确保新角色也应用缩放 (0.1 * 0.9)
        this.logger.info('Player', `角色设置为: ${character}`);
    }

    /**
     * 设置位置
     */
    public setPosition(x: number, y: number): void {
        this.position.set(x, y);
        this.sprite.position.set(x, y);
    }

    /**
     * 重置玩家状态
     */
    public reset(): void {
        // 清理闪烁定时器
        this.clearBlinkTimers();
        
        this.position.set(this.initialPosition.x, this.initialPosition.y);
        this.sprite.position.set(this.initialPosition.x, this.initialPosition.y);
        this.velocity.set(0, 0);
        this.lives = 5;
        this.score = 0;
        this.active = true;
        this.invincible = false;
        this.sprite.visible = true;
        this.sprite.texture = this.normalTexture; // 使用普通纹理作为默认显示
        this.lastPatronusTime = 0; // 重置守护神咒冷却时间
        this.lastStupefyTime = 0; // 重置昏迷咒冷却时间
        this.lastWingardiumTime = 0; // 重置漂浮咒冷却时间
        this.ultimateSkillCharges = 0; // 重置大招次数
        this.eventManager.emit('ultimateSkillChargesChanged', this.ultimateSkillCharges);

        this.eventManager.emit('stateChange', { lives: this.lives, score: this.score });
        this.eventManager.emit('playerHealthChanged', this.lives); // 确保血条更新
    }

    /**
     * 重写destroy方法，确保清理定时器
     */
    public destroy(): void {
        this.clearBlinkTimers();
        super.destroy();
    }
}
