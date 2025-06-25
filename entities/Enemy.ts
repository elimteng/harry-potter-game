// 使用与 GameWorld.ts 相同的导入方式
import * as PIXI from 'pixi.js';
import { GameObject } from './GameObject';
import { Spell, SpellType } from './Spell';
import { Logger } from '../utils/Logger';
import { EventManager } from '../events/EventManager';

// 敌人类型
export enum EnemyType {
    DEMENTOR = 'dementor',
    DEATH_EATER = 'death_eater',
    LUCIUS = 'lucius',
    BELLATRIX = 'bellatrix',
    VOLDEMORT = 'voldemort',
    BASILISK = 'basilisk',
    TROLL = 'troll'
}

/**
 * 敌人类
 * 处理敌人AI、移动和攻击
 */
export class Enemy extends GameObject {
    private enemyType: EnemyType;
    private health: number;
    private maxHealth: number; // 添加最大生命值，用于血条显示
    private speed: number;
    private attackCooldown: number;
    private lastAttackTime: number;
    private scoreValue: number;
    private eventManager: EventManager;
    private movementPattern: 'horizontal' | 'vertical' | 'zigzag' | 'follow' | 'dementor';
    private movementTimer: number = 0;
    private movementDirection: number = 1; // 1 是右边, -1 是左边
    
    // 血条系统改为使用 Sprite 避免 Graphics 污染
    private healthBarContainer: PIXI.Container | null = null;
    private healthBarBackground: PIXI.Sprite | null = null;
    private healthBarFill: PIXI.Sprite | null = null;
    private healthBarBorder: PIXI.Sprite | null = null;

    // 摄魂怪相关属性
    private dementorState: 'approaching' | 'draining' | 'retreating' = 'approaching';
    private dmentorTargetDistance: number = 100; // 摄魂怪目标距离
    private dementorDrainTimer: number = 0; // 摄魂怪吸取生命计时器
    private dementorRetreatTimer: number = 0; // 摄魂怪撤退计时器
    private immuneToNormalAttacks: boolean = false; // 是否免疫普通攻击
    private stunned: boolean = false; // 是否被昏迷
    private stunnedTimer: number = 0; // 昏迷剩余时间
    private floating: boolean = false; // 是否在漂浮
    private floatingTimer: number = 0; // 漂浮剩余时间
    private originalY: number = 0; // 原始Y坐标
    
    // Troll相关属性
    private trollDefeated: boolean = false; // troll是否被击败（漂浮咒击中后）
    private trollDefeatedTexture: PIXI.Texture | null = null; // troll被击败时的纹理
    private trollFloatingHits: number = 0; // troll在漂浮状态下被击中的次数
    private readonly TROLL_FLOATING_HITS_TO_KILL: number = 5; // 击败troll需要的漂浮武器攻击次数
    private trollFleeing: boolean = false; // troll是否在逃跑
    private trollFleeSpeed: number = 120; // troll逃跑速度减慢 (原150) // troll逃跑速度
    
    constructor(
        texture: PIXI.Texture,
        enemyType: EnemyType,
        x: number,
        y: number,
        health: number = 1,
        speed: number = 100,
        movementPattern: 'horizontal' | 'vertical' | 'zigzag' | 'follow' | 'dementor' = 'horizontal'
    ) {
        super(texture, x, y);
        
        this.enemyType = enemyType;
        this.health = health;
        this.maxHealth = health; // 设置最大生命值
        this.speed = speed;
        this.attackCooldown = 2.0; // 攻击冷却时间（秒）
        this.lastAttackTime = Math.random() * 2; // 随机初始化上次攻击时间，避免所有敌人同时攻击
        this.scoreValue = this.calculateScoreValue();
        this.eventManager = EventManager.getInstance();
        this.movementPattern = movementPattern;
        
        // 设置锚点到精灵中心
        this.sprite.anchor.set(0.5, 0.5);
        
        // 调整大小
        if (this.enemyType === EnemyType.DEMENTOR) {
            this.sprite.scale.set(0.108, 0.108); // 摄魂怪较小尺寸 (0.12 * 0.9)
        } else {
            this.sprite.scale.set(0.63, 0.63); // 0.7 * 0.9
        }
        
        // 调整碰撞盒大小
        this.width = this.sprite.width * 0.8;
        this.height = this.sprite.height * 0.8;
        
        // 设置摄魂怪特殊属性
        if (this.enemyType === EnemyType.DEMENTOR) {
            this.immuneToNormalAttacks = true;
            this.movementPattern = 'dementor';
        }
        
        // 设置troll特殊属性
        if (this.enemyType === EnemyType.TROLL) {
            // troll有大量血量，移动较慢
            this.health = Math.max(health, 8); // 至少8点血量
            this.maxHealth = this.health;
            this.speed = Math.min(speed, 25); // 移动速度较慢 (原30减慢)
        }
        
        // 如果是BOSS敌人或troll，创建血条
        if (this.enemyType === EnemyType.LUCIUS || this.enemyType === EnemyType.BELLATRIX || this.enemyType === EnemyType.TROLL) {
            this.createHealthBar();
        }
        
        this.logger.info('Enemy', `创建了敌人: ${enemyType} 位置: (${x}, ${y}) 健康值: ${health}`);
    }
    
    /**
     * 根据敌人类型计算分数价值
     */
    private calculateScoreValue(): number {
        switch (this.enemyType) {
            case EnemyType.VOLDEMORT:
                return 1000;
            case EnemyType.LUCIUS:
                return 1000; // 卢修斯的分数价值
            case EnemyType.BELLATRIX:
                return 2000; // 贝拉特里克斯的分数价值
            case EnemyType.DEATH_EATER:
                return 500;
            case EnemyType.BASILISK:
                return 300;
            case EnemyType.DEMENTOR:
                return 200;
            case EnemyType.TROLL:
                return 100;
            default:
                return 50;
        }
    }

    /**
     * 创建血条显示（仅用于BOSS敌人）
     */
    private createHealthBar(): void {
        this.healthBarContainer = new PIXI.Container();
        this.healthBarBackground = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.healthBarFill = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.healthBarBorder = new PIXI.Sprite(PIXI.Texture.WHITE);
        
        this.healthBarContainer.addChild(this.healthBarBackground);
        this.healthBarContainer.addChild(this.healthBarFill);
        this.healthBarContainer.addChild(this.healthBarBorder);
        
        this.healthBarBackground.width = 60;
        this.healthBarBackground.height = 6;
        this.healthBarBackground.tint = 0x333333;
        
        this.healthBarFill.width = 60;
        this.healthBarFill.height = 6;
        this.healthBarFill.tint = 0x00FF00;
        
        this.healthBarBorder.width = 60;
        this.healthBarBorder.height = 6;
        this.healthBarBorder.tint = 0xFFFFFF;
        
        this.healthBarContainer.position.set(this.position.x, this.position.y);
        this.healthBarContainer.visible = false;
        
        this.healthBarBackground.y = -this.sprite.height / 2 - 15;
        this.healthBarFill.y = -this.sprite.height / 2 - 15;
        this.healthBarBorder.y = -this.sprite.height / 2 - 15;
        
        this.healthBarContainer.visible = true;
        this.updateHealthBar();
    }

    /**
     * 更新血条显示
     */
    private updateHealthBar(): void {
        if (!this.healthBarContainer || !this.healthBarFill || !this.healthBarBackground || !this.healthBarBorder) return;
        
        // 根据敌人类型调整血条长度
        let barWidth = 60;
        if (this.enemyType === EnemyType.TROLL) {
            barWidth = 100; // troll的血条更长
        } else if (this.enemyType === EnemyType.BELLATRIX) {
            barWidth = 80; // 贝拉特里克斯血条稍长
        }
        
        const healthPercent = this.health / this.maxHealth;
        
        // 更新背景尺寸
        this.healthBarBackground.width = barWidth;
        
        // 血条填充颜色和尺寸
        const fillColor = healthPercent > 0.5 ? 0x00FF00 : healthPercent > 0.25 ? 0xFFFF00 : 0xFF0000;
        this.healthBarFill.width = barWidth * healthPercent;
        this.healthBarFill.tint = fillColor;
        
        // 血条边框尺寸
        this.healthBarBorder.width = barWidth;
        
        // 更新血条位置
        this.healthBarContainer.position.set(this.position.x, this.position.y);
    }
    
    /**
     * 更新敌人状态
     */
    public update(deltaTime: number, playerPosition?: PIXI.Point): void {
        if (!this.active) return;
        
        // 更新昏迷状态
        if (this.stunned) {
            this.stunnedTimer -= deltaTime;
            if (this.stunnedTimer <= 0) {
                this.stunned = false;
                this.sprite.rotation = 0; // 恢复正常姿态
                this.sprite.tint = 0xFFFFFF; // 恢复正常颜色
            } else {
                // 昏迷期间不移动，保持横倒状态
                this.sprite.rotation = Math.PI / 2; // 横倒90度
                this.sprite.tint = 0xCCCCCC; // 灰色表示昏迷
                return;
            }
        }
        
        // 更新漂浮状态
        if (this.floating) {
            this.floatingTimer -= deltaTime;
            if (this.floatingTimer <= 0) {
                this.floating = false;
                this.position.y = this.originalY; // 恢复原始位置
                this.sprite.tint = 0xFFFFFF; // 恢复正常颜色
            } else {
                // 漂浮期间缓慢下降，不水平移动
                const floatHeight = 100; // 漂浮高度
                const progress = 1 - (this.floatingTimer / 5); // 5秒漂浮时间
                this.position.y = this.originalY - floatHeight + (floatHeight * progress);
                this.sprite.tint = 0xAAFFAA; // 淡绿色表示漂浮
                this.velocity.x = 0;
                this.velocity.y = 20; // 缓慢下降
            }
        }
        
        // troll逃跑逻辑 - 暂时禁用，让troll保持原位
        if (this.enemyType === EnemyType.TROLL && this.trollFleeing) {
            // 禁用逃跑，让troll保持在原位
            this.velocity.x = 0;
            this.velocity.y = 0;
            
            // 注释掉原来的逃跑逻辑
            /*
            // troll向左右两边逃跑，优先选择离边界更近的方向
            let direction = 1; // 默认向右
            
            // 假设屏幕宽度约为800像素，选择离最近边界的方向
            if (this.position.x < 400) {
                direction = -1; // 向左逃跑
            } else {
                direction = 1;  // 向右逃跑
            }
            
            this.velocity.x = direction * this.trollFleeSpeed;
            this.velocity.y = 0;
            
            // 即使在漂浮状态也要逃跑，只是速度会受到影响
            if (this.floating) {
                this.velocity.x *= 0.5; // 漂浮时逃跑速度减半
            }
            */
        }
        
        // 根据移动模式更新移动
        if (!this.stunned && !this.floating) {
            // 如果是被击败的troll，不进行任何移动
            if (this.enemyType === EnemyType.TROLL && this.trollDefeated) {
                this.velocity.x = 0;
                this.velocity.y = 0;
            } else {
        this.updateMovement(deltaTime, playerPosition);
            }
        }
        
        // 对于troll，检查边界并调整移动
        if (this.enemyType === EnemyType.TROLL && !this.trollDefeated) {
            // 假设屏幕高度约800像素，当troll接近底部时让它向上移动
            if (this.position.y > 700) {
                this.velocity.y = -Math.abs(this.velocity.y); // 向上移动
            } else if (this.position.y < 100) {
                this.velocity.y = Math.abs(this.velocity.y); // 向下移动
            }
            
            // 左右边界检查
            if (this.position.x < 50) {
                this.velocity.x = Math.abs(this.velocity.x || 10); // 向右移动
            } else if (this.position.x > 750) {
                this.velocity.x = -Math.abs(this.velocity.x || 10); // 向左移动
            }
        }
        
        // 更新位置
        super.update(deltaTime);
        
        // 更新血条位置
        if (this.healthBarContainer) {
            this.healthBarContainer.position.set(this.position.x, this.position.y);
        }
    }
    
    /**
     * 摄魂怪特殊移动逻辑
     */
    private updateDementorMovement(deltaTime: number, playerPosition?: PIXI.Point): void {
        if (!playerPosition) {
            // 如果没有玩家位置，悬停在当前位置
            this.velocity.x = 0;
            this.velocity.y = 0;
            return;
        }
        
        const dx = playerPosition.x - this.position.x;
        const dy = playerPosition.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        switch (this.dementorState) {
            case 'approaching':
                // 快速接近玩家
                if (distance > this.dmentorTargetDistance) {
                    if (distance > 0) {
                        this.velocity.x = (dx / distance) * this.speed * 1.5; // 更快速度接近
                        this.velocity.y = (dy / distance) * this.speed * 1.5;
                    }
                } else {
                    // 到达目标距离，立即造成伤害并开始撤退
                    this.dementorState = 'retreating';
                    this.dementorRetreatTimer = 0;
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                    
                    // 发送吸取生命事件，造成1格血的伤害
                    this.eventManager.emit('dementorDrain', { damage: 1.0 });
                }
                break;
                
            case 'draining':
                // 移除draining状态，直接从approaching转为retreating
                break;
                
            case 'retreating':
                // 短暂撤退然后重新接近
                this.dementorRetreatTimer += deltaTime;
                
                // 向远离玩家的方向移动一小段距离
                if (this.dementorRetreatTimer < 1.5) { // 撤退1.5秒
                    if (distance > 0) {
                        // 向远离玩家的方向移动
                        this.velocity.x = (-dx / distance) * this.speed * 0.8;
                        this.velocity.y = (-dy / distance) * this.speed * 0.8;
                    }
                } else {
                    // 撤退结束，停止移动并等待
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                    
                    if (this.dementorRetreatTimer >= 3.0) { // 总共等待3秒
                        // 重新开始接近
                        this.dementorState = 'approaching';
                        this.dementorDrainTimer = 0;
                        this.dementorRetreatTimer = 0;
                    }
                }
                break;
        }
    }
    
    /**
     * 根据移动模式更新移动
     */
    private updateMovement(deltaTime: number, playerPosition?: PIXI.Point): void {
        this.movementTimer += deltaTime;
        
        switch (this.movementPattern) {
            case 'horizontal':
                // 水平移动并在边界处改变方向
                this.velocity.x = this.speed * this.movementDirection;
                this.velocity.y = 0;
                
                // 每3秒改变方向
                if (this.movementTimer > 3) {
                    this.movementDirection *= -1;
                    this.movementTimer = 0;
                }
                break;
                
            case 'vertical':
                // 垂直移动，速度较慢
                this.velocity.x = 0;
                // 对于troll，移动速度更慢，并且有一些水平摆动
                if (this.enemyType === EnemyType.TROLL) {
                    this.velocity.y = this.speed * 0.3; // troll垂直移动很慢
                    // 添加轻微的水平摆动
                    this.velocity.x = Math.sin(this.movementTimer * 1.5) * 10;
                } else {
                this.velocity.y = this.speed * 0.5;
                }
                break;
                
            case 'zigzag':
                // 之字形移动
                this.velocity.x = Math.sin(this.movementTimer * 2) * this.speed;
                this.velocity.y = this.speed * 0.3;
                break;
                
            case 'follow':
                // 如果有玩家位置，朝玩家移动
                if (playerPosition) {
                    const dx = playerPosition.x - this.position.x;
                    const dy = playerPosition.y - this.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        this.velocity.x = (dx / distance) * this.speed * 0.6;
                        this.velocity.y = (dy / distance) * this.speed * 0.3;
                    }
                } else {
                    // 如果没有玩家位置，默认向下移动
                    this.velocity.x = 0;
                    this.velocity.y = this.speed * 0.4;
                }
                break;
                
            case 'dementor':
                // 摄魂怪特殊移动模式：接近->吸取->撤退->重复
                this.updateDementorMovement(deltaTime, playerPosition);
                break;
        }
    }
    
    /**
     * 尝试攻击玩家 - 使用专门的敌人攻击纹理，完全独立于玩家系统
     */
    public tryAttack(deltaTime: number, textures: Map<string, PIXI.Texture>, player?: GameObject): Spell[] {
        // 摄魂怪不进行常规攻击
        if (this.enemyType === EnemyType.DEMENTOR) {
            return [];
        }
        
        // 昏迷状态下不能攻击
        if (this.stunned) {
            return [];
        }
        
        // 漂浮状态下不能攻击
        if (this.floating) {
            return [];
        }
        
        // 检查敌人是否在画面上可见
        if (!this.sprite.visible || !this.active) {
            return [];
        }
        
        // 累加攻击冷却时间
        const currentTime = performance.now() / 1000;
        
        // 检查是否冷却完成
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return [];
        }
        
        // 根据敌人类型决定是否攻击
        let attackChance = 0;
        switch (this.enemyType) {
            case EnemyType.VOLDEMORT:
                attackChance = 0.8;
                break;
            case EnemyType.LUCIUS:
                attackChance = 0.9;
                break;
            case EnemyType.BELLATRIX:
                attackChance = 0.95;
                break;
            case EnemyType.DEATH_EATER:
                attackChance = 0.6;
                break;
            case EnemyType.BASILISK:
                attackChance = 0.3;
                break;
            case EnemyType.TROLL:
                attackChance = 0.2;
                break;
            default:
                attackChance = 0.1;
        }
        
        // 随机决定是否攻击
        if (Math.random() > attackChance) {
            return [];
        }
        
        // 更新最后攻击时间
        this.lastAttackTime = currentTime;
        
        // 决定咒语类型和纹理 - 使用专门的敌人攻击纹理，确保与玩家纹理完全分离
        let spellType = SpellType.LUMOS;
        let spellTexture: PIXI.Texture | undefined;
        let spellDamage = 0.5;
        
        if (this.enemyType === EnemyType.BELLATRIX) {
            const useTrackingMagic = Math.random() < 0.5;
            
            if (useTrackingMagic && player) {
                spellType = SpellType.BELLATRIX_TRACKING;
                spellTexture = PIXI.Texture.from(PIXI.Texture.WHITE.baseTexture); // 使用基础纹理
                spellDamage = 2.0;
            } else {
                spellType = SpellType.AVADA;
                spellTexture = PIXI.Texture.from(PIXI.Texture.WHITE.baseTexture); // 使用基础纹理
                spellDamage = 1.5;
            }
        } else if (this.enemyType === EnemyType.LUCIUS) {
            spellType = SpellType.AVADA;
            spellTexture = PIXI.Texture.from(PIXI.Texture.WHITE.baseTexture); // 使用基础纹理
            spellDamage = 1.0;
        } else if (this.enemyType === EnemyType.DEATH_EATER) {
            spellType = SpellType.AVADA;
            spellTexture = PIXI.Texture.from(PIXI.Texture.WHITE.baseTexture); // 使用基础纹理
            spellDamage = 0.5;
        } else {
            spellType = SpellType.CRUCIO;
            spellTexture = PIXI.Texture.from(PIXI.Texture.WHITE.baseTexture); // 使用基础纹理
        }
        
        // 如果独立纹理不存在，记录错误（这不应该发生）
        if (!spellTexture) {
            this.logger.error('Enemy', `找不到敌人攻击纹理，敌人类型: ${this.enemyType}`);
            return [];
        }
        
        // 创建咒语对象
        const spellX = this.position.x;
        const spellY = this.position.y + (this.sprite.height * 0.5);
        
        const spells: Spell[] = [];
        
        if (this.enemyType === EnemyType.BELLATRIX) {
            if (spellType === SpellType.BELLATRIX_TRACKING && player) {
                // 贝拉特里克斯追踪魔法
                const trackingSpell = new Spell(
                    spellTexture,
                    spellX,
                    spellY,
                    0,
                    200,
                    spellType,
                    spellDamage,
                    5,
                    player
                );
                spells.push(trackingSpell);
                this.logger.info('Enemy', `贝拉特里克斯发射追踪魔法！`);
            } else {
                // 贝拉特里克斯双重攻击
                const spell1 = new Spell(spellTexture, spellX, spellY, 0, 300, spellType, spellDamage, 3);
                const spell2 = new Spell(spellTexture, spellX, spellY + 60, 0, 300, spellType, spellDamage, 3);
                spells.push(spell1, spell2);
                this.logger.info('Enemy', `贝拉特里克斯发射双重魔法攻击！`);
            }
        } else {
            // 其他敌人单个咒语
            const spell = new Spell(spellTexture, spellX, spellY, 0, 300, spellType, spellDamage, 3);
            spells.push(spell);
        }
        
        return spells;
    }
    
    /**
     * 受到伤害
     * @param damage 伤害值
     * @param spellType 咒语类型，用于判断摄魂怪的免疫
     * @returns 是否被击败
     */
    public takeDamage(damage: number, spellType?: SpellType): boolean {
        if (!this.active) return false;
        
        // 守护神咒只对摄魂怪有效
        if (spellType === SpellType.PATRONUS) {
            if (this.enemyType !== EnemyType.DEMENTOR) {
                // 守护神咒对非摄魂怪敌人无效
                return false;
            }
        }
        
        // 摄魂怪免疫普通攻击，只对哈利的守护神咒敏感
        if (this.enemyType === EnemyType.DEMENTOR && this.immuneToNormalAttacks) {
            if (spellType !== SpellType.PATRONUS) {
                // 普通攻击无效，发送免疫事件
                this.eventManager.emit('dementorImmune');
                return false;
            }
        }
        
        // troll特殊处理
        if (this.enemyType === EnemyType.TROLL) {
            // 如果是漂浮武器攻击
            if (spellType === SpellType.FLOATING_WEAPON) {
                if (this.trollDefeated) {
                    // 只有在troll被漂浮咒击败后才能被漂浮武器攻击
                    this.trollFloatingHits++;
                    this.blink();
                    
                    if (this.trollFloatingHits >= this.TROLL_FLOATING_HITS_TO_KILL) {
                        // 发送事件清理漂浮武器
                        this.eventManager.emit('trollKilled');
                        this.defeat();
                        return true;
                    }
                    return false;
                } else {
                    // troll未被漂浮咒击败时，漂浮武器无效
                    return false;
                }
            } else {
                // 普通攻击对troll伤害很少
                damage = Math.max(1, Math.floor(damage * 0.1)); // 伤害减少到10%
            }
        }
        
        this.health -= damage;
        
        // 更新血条
        if (this.healthBarContainer) {
            this.updateHealthBar();
        }
        
        // 闪烁效果表示受伤
        this.blink();
        
        if (this.health <= 0) {
            this.defeat();
            return true;
        }
        
        return false;
    }
    
    /**
     * 闪烁效果
     */
    private blink(): void {
        const originalTint = this.sprite.tint;
        this.sprite.tint = 0xFF0000; // 设为红色
        
        window.setTimeout(() => {
            if (this.sprite) {
                this.sprite.tint = originalTint;
            }
        }, 100);
    }
    
    /**
     * 敌人被击败
     */
    private defeat(): void {
        this.active = false;
        this.sprite.visible = false;
        
        // 清理血条
        if (this.healthBarContainer) {
            this.healthBarContainer.visible = false;
        }
        
        // 发送得分事件
        this.eventManager.emit('scoreChange', { score: this.scoreValue, enemyType: this.enemyType });
    }
    
    /**
     * 获取敌人类型
     */
    public getEnemyType(): EnemyType {
        return this.enemyType;
    }
    
    /**
     * 获取分数价值
     */
    public getScoreValue(): number {
        return this.scoreValue;
    }

    /**
     * 获取血条容器
     */
    public getHealthBarContainer(): PIXI.Container | null {
        return this.healthBarContainer;
    }

    /**
     * 检查敌人是否免疫普通攻击
     */
    public isImmuneToNormalAttacks(): boolean {
        return this.immuneToNormalAttacks;
    }
    
    /**
     * 获取摄魂怪状态
     */
    public getDementorState(): string {
        return this.dementorState;
    }

    /**
     * 昏迷敌人（Stupefy效果）
     */
    public stupefy(duration: number = 10): void {
        this.stunned = true;
        this.stunnedTimer = duration;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.sprite.rotation = Math.PI / 2; // 立即横倒
        this.sprite.tint = 0xCCCCCC; // 立即变灰
    }

    /**
     * 检查是否被昏迷
     */
    public isStunned(): boolean {
        return this.stunned;
    }

    /**
     * 漂浮敌人（Wingardium效果）
     */
    public float(duration: number = 5): void {
        this.floating = true;
        this.floatingTimer = duration;
        this.originalY = this.position.y;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.sprite.tint = 0xAAFFAA; // 立即变为淡绿色
        
        // troll特殊处理：切换到defeated纹理
        if (this.enemyType === EnemyType.TROLL && !this.trollDefeated) {
            this.trollDefeated = true;
            // 请求切换纹理事件
            this.eventManager.emit('trollDefeated', { trollId: this.getId(), position: this.position });
        }
    }

    /**
     * 检查是否在漂浮
     */
    public isFloating(): boolean {
        return this.floating;
    }

    /**
     * 设置troll的defeated纹理
     */
    public setTrollDefeatedTexture(texture: PIXI.Texture): void {
        if (this.enemyType === EnemyType.TROLL && this.trollDefeated) {
            this.trollDefeatedTexture = texture;
            this.sprite.texture = texture;
        }
    }
    
    /**
     * 获取敌人ID（用于识别特定敌人）
     */
    public getId(): string {
        return `${this.enemyType}_${this.position.x}_${this.position.y}`;
    }
    
    /**
     * 检查troll是否已被击败（处于漂浮状态）
     */
    public isTrollDefeated(): boolean {
        return this.trollDefeated;
    }
}
