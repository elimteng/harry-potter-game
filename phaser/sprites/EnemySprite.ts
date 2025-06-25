import * as Phaser from 'phaser';
import { EnemyType } from '../scenes/MainScene';
import { SpellSprite } from './SpellSprite';
import { SpellType } from '../scenes/MainScene';

export class EnemySprite extends Phaser.Physics.Arcade.Sprite {
    private enemyType: EnemyType;
    private health: number;
    private maxHealth: number;
    private speed: number;
    private scoreValue: number;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 3000; // 3秒
    private stunned: boolean = false;
    private stunTimer: number = 0;
    private healthBar: Phaser.GameObjects.Graphics | null = null;
    private healthBarBackground: Phaser.GameObjects.Graphics | null = null;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        enemyType: EnemyType,
        health: number,
        speed: number
    ) {
        super(scene, x, y, texture);
        
        this.enemyType = enemyType;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.scoreValue = this.getScoreValueForType(enemyType);
        
        // 添加到场景
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置物理属性
        this.setVelocityY(speed);
        this.setScale(this.getScaleForType(enemyType));
        this.setOrigin(0.5, 1);
        
        // 调整碰撞盒
        this.body!.setSize(
            this.width * 0.8,
            this.height * 0.8
        );
        
        // 为多血量敌人创建血条
        if (this.maxHealth > 1) {
            this.createHealthBar();
        }
    }

    public update(delta: number) {
        // 更新眩晕状态
        if (this.stunTimer > 0) {
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.stunTimer = 0;
                this.stunned = false;
                this.setTint(0xFFFFFF);
                this.setVelocityY(this.speed);
            } else {
                // 眩晕时闪烁并停止移动
                const flash = Math.sin(this.scene.time.now / 100) > 0;
                this.setTint(flash ? 0x00FFFF : 0xFFFFFF);
                this.setVelocityY(0);
            }
        }
        
        // 更新血条位置
        if (this.healthBar && this.healthBarBackground) {
            this.healthBar.x = this.x - 30;
            this.healthBar.y = this.y - this.height * this.scaleY - 20;
            this.healthBarBackground.x = this.x - 30;
            this.healthBarBackground.y = this.y - this.height * this.scaleY - 20;
        }
    }

    public takeDamage(damage: number): boolean {
        this.health -= damage;
        
        // 更新血条
        if (this.healthBar && this.maxHealth > 1) {
            this.updateHealthBar();
        }
        
        // 检查是否被击败
        if (this.health <= 0) {
            this.destroyHealthBar();
            return true; // 敌人被击败
        }
        
        return false; // 敌人仍然存活
    }

    public stupefy(duration: number) {
        this.stunned = true;
        this.stunTimer = duration;
    }

    public canAttack(): boolean {
        if (this.stunned) return false;
        const currentTime = this.scene.time.now;
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }

    public attack(target: Phaser.GameObjects.GameObject): SpellSprite | null {
        if (!this.canAttack()) return null;
        
        this.lastAttackTime = this.scene.time.now;
        
        // 根据敌人类型决定攻击方式
        const spellX = this.x;
        const spellY = this.y;
        let spellType: SpellType;
        let texture: string;
        let damage: number;
        
        switch (this.enemyType) {
            case EnemyType.BELLATRIX:
                spellType = SpellType.AVADA;
                texture = 'spell_attack_2';
                damage = 2;
                break;
            case EnemyType.LUCIUS:
                spellType = SpellType.AVADA;
                texture = 'spell_attack_2';
                damage = 1;
                break;
            default:
                spellType = SpellType.EXPELLIARMUS;
                texture = 'spell_attack';
                damage = 1;
        }
        
        const spell = new SpellSprite(
            this.scene,
            spellX,
            spellY,
            texture,
            spellType,
            0,
            300, // 向下移动
            damage,
            'enemy'
        );
        
        return spell;
    }

    public getEnemyType(): EnemyType {
        return this.enemyType;
    }

    public getScoreValue(): number {
        return this.scoreValue;
    }

    private getScoreValueForType(type: EnemyType): number {
        switch (type) {
            case EnemyType.DEATH_EATER:
                return 100;
            case EnemyType.TROLL:
                return 800;
            case EnemyType.DEMENTOR:
                return 1000;
            case EnemyType.LUCIUS:
                return 1200;
            case EnemyType.BELLATRIX:
                return 1500;
            default:
                return 100;
        }
    }

    private getScaleForType(type: EnemyType): number {
        switch (type) {
            case EnemyType.DEATH_EATER:
                return 0.08;
            case EnemyType.TROLL:
                return 0.15;
            case EnemyType.DEMENTOR:
                return 0.12;
            case EnemyType.LUCIUS:
                return 0.1;
            case EnemyType.BELLATRIX:
                return 0.1;
            default:
                return 0.08;
        }
    }

    private createHealthBar() {
        // 创建血条背景
        this.healthBarBackground = this.scene.add.graphics();
        this.healthBarBackground.fillStyle(0x000000, 0.8);
        this.healthBarBackground.fillRect(0, 0, 60, 8);
        this.healthBarBackground.lineStyle(1, 0xFFFFFF, 1);
        this.healthBarBackground.strokeRect(0, 0, 60, 8);
        
        // 创建血条
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar();
    }

    private updateHealthBar() {
        if (!this.healthBar) return;
        
        this.healthBar.clear();
        
        const healthPercentage = this.health / this.maxHealth;
        const barWidth = 58 * healthPercentage;
        
        // 根据血量百分比选择颜色
        let color: number;
        if (healthPercentage > 0.6) {
            color = 0x00FF00; // 绿色
        } else if (healthPercentage > 0.3) {
            color = 0xFFFF00; // 黄色
        } else {
            color = 0xFF0000; // 红色
        }
        
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(1, 1, barWidth, 6);
    }

    private destroyHealthBar() {
        if (this.healthBar) {
            this.healthBar.destroy();
            this.healthBar = null;
        }
        if (this.healthBarBackground) {
            this.healthBarBackground.destroy();
            this.healthBarBackground = null;
        }
    }

    public destroy() {
        this.destroyHealthBar();
        super.destroy();
    }
} 