import * as Phaser from 'phaser';
import { SpellType } from '../scenes/MainScene';

export class SpellSprite extends Phaser.Physics.Arcade.Sprite {
    private spellType: SpellType;
    private damage: number;
    private caster: string; // 'player' 或 'enemy'
    private lifespan: number = 5000; // 5秒生命周期
    private createdTime: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        spellType: SpellType,
        velocityX: number,
        velocityY: number,
        damage: number,
        caster: string
    ) {
        super(scene, x, y, texture);
        
        this.spellType = spellType;
        this.damage = damage;
        this.caster = caster;
        this.createdTime = scene.time.now;
        
        // 添加到场景
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置物理属性
        this.setVelocity(velocityX, velocityY);
        this.setScale(this.getScaleForType(spellType));
        this.setOrigin(0.5, 0.5);
        
        // 调整碰撞盒
        this.body!.setSize(
            this.width * 0.6,
            this.height * 0.6
        );
        
        // 设置特殊效果
        this.applySpecialEffects();
    }

    public update(delta: number) {
        // 检查生命周期
        if (this.scene.time.now - this.createdTime > this.lifespan) {
            this.destroy();
            return;
        }
        
        // 更新特殊效果
        this.updateSpecialEffects();
    }

    public hit() {
        // 创建击中效果
        this.createHitEffect();
        this.destroy();
    }

    public getDamage(): number {
        return this.damage;
    }

    public getSpellType(): SpellType {
        return this.spellType;
    }

    public getCaster(): string {
        return this.caster;
    }

    private getScaleForType(type: SpellType): number {
        switch (type) {
            case SpellType.EXPELLIARMUS:
                return 0.05;
            case SpellType.STUPEFY:
                return 0.06;
            case SpellType.WINGARDIUM:
                return 0.07;
            case SpellType.PATRONUS:
                return 0.08;
            case SpellType.AVADA:
                return 0.06;
            case SpellType.ULTIMATE_ORB:
                return 0.1;
            default:
                return 0.05;
        }
    }

    private applySpecialEffects() {
        switch (this.spellType) {
            case SpellType.PATRONUS:
                // 守护神咒语发光效果
                this.setTint(0xFFFFFF);
                this.createGlowEffect();
                break;
            case SpellType.AVADA:
                // 阿瓦达咒语绿色效果
                this.setTint(0x00FF00);
                break;
            case SpellType.STUPEFY:
                // 昏迷咒红色效果
                this.setTint(0xFF0000);
                break;
            case SpellType.WINGARDIUM:
                // 漂浮咒蓝色效果
                this.setTint(0x0099FF);
                break;
            case SpellType.ULTIMATE_ORB:
                // 终极技能金色效果
                this.setTint(0xFFD700);
                this.createPulseEffect();
                break;
            default:
                this.setTint(0xFFFFFF);
        }
    }

    private updateSpecialEffects() {
        const time = this.scene.time.now / 1000;
        
        switch (this.spellType) {
            case SpellType.PATRONUS:
                // 守护神闪烁效果
                const glowIntensity = Math.sin(time * 6) * 0.2 + 0.8;
                this.setAlpha(glowIntensity);
                break;
            case SpellType.ULTIMATE_ORB:
                // 终极技能脉冲效果
                const pulseScale = Math.sin(time * 8) * 0.2 + 1.0;
                this.setScale(this.getScaleForType(this.spellType) * pulseScale);
                break;
            case SpellType.AVADA:
                // 阿瓦达咒语旋转效果
                this.rotation += 0.1;
                break;
        }
    }

    private createGlowEffect() {
        // 为守护神咒语创建光晕效果
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.5,
            scaleY: this.scaleY * 1.5,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createPulseEffect() {
        // 为终极技能创建脉冲效果
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.3,
            scaleY: this.scaleY * 1.3,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
    }

    private createHitEffect() {
        // 创建击中特效
        const explosion = this.scene.add.circle(this.x, this.y, 20, 0xFFFFFF, 0.8);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // 根据咒语类型创建不同的击中效果
        switch (this.spellType) {
            case SpellType.STUPEFY:
                this.createStupefyHitEffect();
                break;
            case SpellType.WINGARDIUM:
                this.createWingardiumHitEffect();
                break;
            case SpellType.PATRONUS:
                this.createPatronusHitEffect();
                break;
        }
    }

    private createStupefyHitEffect() {
        // 昏迷咒击中效果：红色闪光
        const flash = this.scene.add.circle(this.x, this.y, 30, 0xFF0000, 0.6);
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    private createWingardiumHitEffect() {
        // 漂浮咒击中效果：蓝色粒子
        for (let i = 0; i < 5; i++) {
            const particle = this.scene.add.circle(
                this.x + (Math.random() - 0.5) * 40,
                this.y + (Math.random() - 0.5) * 40,
                5,
                0x0099FF,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 50,
                alpha: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    private createPatronusHitEffect() {
        // 守护神咒击中效果：白色光芒
        const light = this.scene.add.circle(this.x, this.y, 40, 0xFFFFFF, 0.9);
        this.scene.tweens.add({
            targets: light,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 500,
            ease: 'Power3',
            onComplete: () => light.destroy()
        });
    }
} 