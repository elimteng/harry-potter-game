import * as Phaser from 'phaser';
import { PlayerCharacter } from '../../entities/Player';
import { EventBus } from '../EventBus';

export class PlayerSprite extends Phaser.Physics.Arcade.Sprite {
    private character: PlayerCharacter;
    private normalTexture: string;
    private attackTexture: string;
    private speed: number = 300;
    private lives: number = 5;
    private maxLives: number = 5;
    private ultimateSkillCharges: number = 0;
    private invincible: boolean = false;
    private invincibilityTimer: number = 0;
    private ronMode: boolean = false;
    private ronModeTimer: number = 0;
    private readonly RON_MODE_DURATION: number = 15000; // 15秒

    // 技能冷却时间
    private lastAttackTime: number = 0;
    private lastPatronusTime: number = 0;
    private lastStupefyTime: number = 0;
    private lastWingardiumTime: number = 0;
    private readonly ATTACK_COOLDOWN: number = 500; // 0.5秒
    private readonly PATRONUS_COOLDOWN: number = 30000; // 30秒
    private readonly STUPEFY_COOLDOWN: number = 15000; // 15秒
    private readonly WINGARDIUM_COOLDOWN: number = 20000; // 20秒

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        character: PlayerCharacter,
        normalTexture: string,
        attackTexture: string
    ) {
        super(scene, x, y, normalTexture);
        
        this.character = character;
        this.normalTexture = normalTexture;
        this.attackTexture = attackTexture;
        
        // 添加到场景
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置物理属性
        this.setCollideWorldBounds(true);
        this.setScale(0.09);
        this.setOrigin(0.5, 1);
        
        // 调整碰撞盒
        this.body!.setSize(
            this.width * 0.7,
            this.height * 0.8
        );
        
        // 初始化事件通知
        this.updateReactState();
    }

    public setCharacter(character: PlayerCharacter, normalTexture: string, attackTexture: string) {
        this.character = character;
        this.normalTexture = normalTexture;
        this.attackTexture = attackTexture;
        this.setTexture(normalTexture);
    }

    public update(delta: number) {
        // 更新无敌状态
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= delta;
            if (this.invincibilityTimer <= 0) {
                this.invincibilityTimer = 0;
                this.invincible = false;
            }
        }
        
        // 更新罗恩模式
        if (this.ronModeTimer > 0) {
            this.ronModeTimer -= delta;
            if (this.ronModeTimer <= 0) {
                this.ronModeTimer = 0;
                this.ronMode = false;
                this.invincible = false;
                this.invincibilityTimer = 0;
                EventBus.emit('ron-mode-end');
            }
        }
        
        // 视觉效果
        if (this.invincible || this.ronMode) {
            const time = this.scene.time.now / 1000;
            if (this.ronMode) {
                // 罗恩模式：金色闪烁
                const pulse = Math.sin(time * 8) * 0.3 + 0.8;
                this.setTint(0xFFD700);
                this.setAlpha(pulse);
            } else {
                // 普通无敌：蓝色闪烁
                const pulse = Math.sin(time * 6) * 0.4 + 0.7;
                this.setTint(0x4169E1);
                this.setAlpha(pulse);
            }
        } else {
            this.setTint(0xFFFFFF);
            this.setAlpha(1.0);
        }
        
        // 更新React状态
        this.updateSkillCooldowns();
    }

    public moveLeft() {
        this.setVelocityX(-this.speed);
    }

    public moveRight() {
        this.setVelocityX(this.speed);
    }

    public stopMovement() {
        this.setVelocityX(0);
    }

    public takeDamage(damage: number) {
        if (this.invincible || this.ronMode) {
            return;
        }
        
        this.lives -= damage;
        this.lives = Math.max(0, this.lives);
        
        // 短暂无敌
        this.setInvincible(2000); // 2秒无敌
        
        this.updateReactState();
        
        // 玩家受到伤害
    }

    public heal(amount: number) {
        this.lives += amount;
        this.lives = Math.min(this.maxLives, this.lives);
        this.updateReactState();
        
        // 玩家恢复生命
    }

    public setInvincible(duration: number) {
        this.invincible = true;
        this.invincibilityTimer = duration;
    }

    public activateRonMode() {
        this.ronMode = true;
        this.ronModeTimer = this.RON_MODE_DURATION;
        this.invincible = true;
        EventBus.emit('ron-mode-start', { duration: this.RON_MODE_DURATION });
    }

    public canAttack(): boolean {
        const currentTime = this.scene.time.now;
        return currentTime - this.lastAttackTime >= this.ATTACK_COOLDOWN;
    }

    public attack() {
        if (!this.canAttack()) return false;
        
        this.lastAttackTime = this.scene.time.now;
        return true;
    }

    public canUsePatronus(): boolean {
        if (this.character !== PlayerCharacter.HARRY) return false;
        const currentTime = this.scene.time.now;
        return currentTime - this.lastPatronusTime >= this.PATRONUS_COOLDOWN;
    }

    public usePatronus(): boolean {
        if (!this.canUsePatronus()) return false;
        
        this.lastPatronusTime = this.scene.time.now;
        return true;
    }

    public canUseStupefy(): boolean {
        if (this.character !== PlayerCharacter.HERMIONE) return false;
        const currentTime = this.scene.time.now;
        return currentTime - this.lastStupefyTime >= this.STUPEFY_COOLDOWN;
    }

    public useStupefy(): boolean {
        if (!this.canUseStupefy()) return false;
        
        this.lastStupefyTime = this.scene.time.now;
        return true;
    }

    public canUseWingardium(): boolean {
        if (this.character !== PlayerCharacter.RON) return false;
        const currentTime = this.scene.time.now;
        return currentTime - this.lastWingardiumTime >= this.WINGARDIUM_COOLDOWN;
    }

    public useWingardium(): boolean {
        if (!this.canUseWingardium()) return false;
        
        this.lastWingardiumTime = this.scene.time.now;
        return true;
    }

    public addUltimateSkillCharge() {
        this.ultimateSkillCharges++;
        this.updateReactState();
    }

    public canUseUltimateSkill(): boolean {
        return this.ultimateSkillCharges > 0;
    }

    public useUltimateSkill(): boolean {
        if (!this.canUseUltimateSkill()) return false;
        
        this.ultimateSkillCharges--;
        this.updateReactState();
        return true;
    }

    public getLives(): number {
        return this.lives;
    }

    public getCharacter(): PlayerCharacter {
        return this.character;
    }

    public getUltimateSkillCharges(): number {
        return this.ultimateSkillCharges;
    }

    public reset() {
        this.lives = this.maxLives;
        this.ultimateSkillCharges = 0;
        this.invincible = false;
        this.invincibilityTimer = 0;
        this.ronMode = false;
        this.ronModeTimer = 0;
        this.lastAttackTime = 0;
        this.lastPatronusTime = 0;
        this.lastStupefyTime = 0;
        this.lastWingardiumTime = 0;
        
        this.setTint(0xFFFFFF);
        this.setAlpha(1.0);
        
        this.updateReactState();
    }

    private updateReactState() {
        EventBus.emit('lives-updated', this.lives);
        EventBus.emit('ultimate-charges-updated', this.ultimateSkillCharges);
    }

    private updateSkillCooldowns() {
        const currentTime = this.scene.time.now;
        
        const patronusCooldown = Math.max(0, (this.PATRONUS_COOLDOWN - (currentTime - this.lastPatronusTime)) / 1000);
        const stupefyCooldown = Math.max(0, (this.STUPEFY_COOLDOWN - (currentTime - this.lastStupefyTime)) / 1000);
        const wingardiumCooldown = Math.max(0, (this.WINGARDIUM_COOLDOWN - (currentTime - this.lastWingardiumTime)) / 1000);
        
        EventBus.emit('skill-cooldowns-updated', {
            patronus: patronusCooldown,
            stupefy: stupefyCooldown,
            wingardium: wingardiumCooldown
        });
    }
} 