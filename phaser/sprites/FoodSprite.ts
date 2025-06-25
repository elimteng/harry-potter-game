import * as Phaser from 'phaser';
import { FoodType } from '../scenes/MainScene';

export class FoodSprite extends Phaser.Physics.Arcade.Sprite {
    private foodType: FoodType;
    private healAmount: number;
    private fallSpeed: number = 100;
    private lifespan: number = 15000; // 15秒生命周期
    private createdTime: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        foodType: FoodType,
        healAmount: number
    ) {
        super(scene, x, y, texture);
        
        this.foodType = foodType;
        this.healAmount = healAmount;
        this.createdTime = scene.time.now;
        
        // 添加到场景
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置物理属性
        this.setVelocityY(this.fallSpeed);
        this.setScale(this.getScaleForType(foodType));
        this.setOrigin(0.5, 0.5);
        
        // 调整碰撞盒
        this.body!.setSize(
            this.width * 0.8,
            this.height * 0.8
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

    public getHealAmount(): number {
        return this.healAmount;
    }

    public getFoodType(): FoodType {
        return this.foodType;
    }

    private getScaleForType(type: FoodType): number {
        switch (type) {
            case FoodType.CHOCOLATE_FROG:
                return 0.06;
            case FoodType.BUTTERBEER:
                return 0.08;
            case FoodType.CHICKEN:
                return 0.07;
            case FoodType.RON_MODE:
                return 0.09;
            default:
                return 0.06;
        }
    }

    private applySpecialEffects() {
        switch (this.foodType) {
            case FoodType.CHOCOLATE_FROG:
                // 巧克力蛙：棕色光效
                this.setTint(0x8B4513);
                this.createBounceEffect();
                break;
            case FoodType.BUTTERBEER:
                // 黄油啤酒：金色光效
                this.setTint(0xFFD700);
                this.createGlowEffect();
                break;
            case FoodType.CHICKEN:
                // 鸡肉：正常颜色
                this.setTint(0xFFFFFF);
                break;
            case FoodType.RON_MODE:
                // 罗恩模式：彩虹效果
                this.createRainbowEffect();
                break;
            default:
                this.setTint(0xFFFFFF);
        }
    }

    private updateSpecialEffects() {
        const time = this.scene.time.now / 1000;
        
        switch (this.foodType) {
            case FoodType.BUTTERBEER:
                // 黄油啤酒闪烁效果
                const glowIntensity = Math.sin(time * 4) * 0.3 + 0.8;
                this.setAlpha(glowIntensity);
                break;
            case FoodType.RON_MODE:
                // 罗恩模式彩虹循环
                const hue = (time * 2) % 1;
                const color = Phaser.Display.Color.HSVToRGB(hue, 1, 1);
                this.setTint(color.color);
                
                // 脉冲效果
                const pulseScale = Math.sin(time * 6) * 0.2 + 1.0;
                this.setScale(this.getScaleForType(this.foodType) * pulseScale);
                break;
            case FoodType.CHOCOLATE_FROG:
                // 巧克力蛙轻微摇摆
                const sway = Math.sin(time * 3) * 0.1;
                this.rotation = sway;
                break;
        }
    }

    private createBounceEffect() {
        // 巧克力蛙弹跳效果
        this.scene.tweens.add({
            targets: this,
            scaleY: this.scaleY * 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Bounce.easeOut'
        });
    }

    private createGlowEffect() {
        // 黄油啤酒发光效果
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.3,
            scaleY: this.scaleY * 1.3,
            alpha: 0.6,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createRainbowEffect() {
        // 罗恩模式彩虹光环效果
        this.scene.tweens.add({
            targets: this,
            scaleX: this.scaleX * 1.5,
            scaleY: this.scaleY * 1.5,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });
        
        // 旋转效果
        this.scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    public createCollectEffect() {
        // 创建收集特效
        const sparkles: Phaser.GameObjects.Graphics[] = [];
        
        // 创建闪光粒子
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30;
            const sparkleX = this.x + Math.cos(angle) * distance;
            const sparkleY = this.y + Math.sin(angle) * distance;
            
            const sparkle = this.scene.add.graphics();
            sparkle.fillStyle(0xFFD700, 1);
            // 创建星形效果
            sparkle.fillCircle(sparkleX, sparkleY, 4);
            sparkles.push(sparkle);
            
            // 闪光动画
            this.scene.tweens.add({
                targets: sparkle,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                x: sparkleX + Math.cos(angle) * 50,
                y: sparkleY + Math.sin(angle) * 50,
                duration: 600,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
        
        // 根据食物类型创建特殊收集效果
        switch (this.foodType) {
            case FoodType.BUTTERBEER:
                this.createHealingEffect();
                break;
            case FoodType.RON_MODE:
                this.createRonModeActivationEffect();
                break;
            case FoodType.CHOCOLATE_FROG:
                this.createChocolateEffect();
                break;
            case FoodType.CHICKEN:
                this.createNourishmentEffect();
                break;
        }
    }

    private createHealingEffect() {
        // 治疗效果：绿色加号
        const healSymbol = this.scene.add.graphics();
        healSymbol.lineStyle(4, 0x00FF00, 1);
        healSymbol.moveTo(this.x - 10, this.y);
        healSymbol.lineTo(this.x + 10, this.y);
        healSymbol.moveTo(this.x, this.y - 10);
        healSymbol.lineTo(this.x, this.y + 10);
        
        this.scene.tweens.add({
            targets: healSymbol,
            y: healSymbol.y - 50,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => healSymbol.destroy()
        });
    }

    private createRonModeActivationEffect() {
        // 罗恩模式激活效果：金色爆炸
        const explosion = this.scene.add.circle(this.x, this.y, 10, 0xFFD700, 0.8);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: 6,
            scaleY: 6,
            alpha: 0,
            duration: 800,
            ease: 'Power3',
            onComplete: () => explosion.destroy()
        });
        
        // 文字提示
        const text = this.scene.add.text(this.x, this.y - 30, 'RON MODE!', {
            fontSize: '20px',
            color: '#FFD700',
            fontFamily: 'Arial Black'
        });
        text.setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: text,
            y: text.y - 50,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }

    private createChocolateEffect() {
        // 巧克力效果：棕色心形
        const heart = this.scene.add.graphics();
        heart.fillStyle(0x8B4513, 0.8);
        heart.fillCircle(this.x - 5, this.y - 5, 8);
        heart.fillCircle(this.x + 5, this.y - 5, 8);
        heart.fillTriangle(this.x - 10, this.y, this.x + 10, this.y, this.x, this.y + 15);
        
        this.scene.tweens.add({
            targets: heart,
            y: heart.y - 40,
            alpha: 0,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => heart.destroy()
        });
    }

    private createNourishmentEffect() {
        // 营养效果：多彩粒子
        for (let i = 0; i < 6; i++) {
            const particle = this.scene.add.circle(
                this.x + (Math.random() - 0.5) * 20,
                this.y + (Math.random() - 0.5) * 20,
                3,
                [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFEDA77][Math.floor(Math.random() * 5)],
                0.9
            );
            
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 60,
                alpha: 0,
                duration: 1000 + Math.random() * 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
} 