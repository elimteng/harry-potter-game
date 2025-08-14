/**
 * ECS架构中的组件基类
 * 组件只存储数据，不包含行为
 */
export abstract class Component {
    public entityId: number = -1;
    
    constructor(entityId: number) {
        this.entityId = entityId;
    }
}

/**
 * 位置组件
 */
export class PositionComponent extends Component {
    public x: number;
    public y: number;
    
    constructor(entityId: number, x: number = 0, y: number = 0) {
        super(entityId);
        this.x = x;
        this.y = y;
    }
}

/**
 * 速度组件
 */
export class VelocityComponent extends Component {
    public x: number;
    public y: number;
    
    constructor(entityId: number, x: number = 0, y: number = 0) {
        super(entityId);
        this.x = x;
        this.y = x;
    }
}

/**
 * 精灵组件
 */
export class SpriteComponent extends Component {
    public sprite: any; // PIXI.Sprite 或 Phaser.GameObjects.Sprite
    
    constructor(entityId: number, sprite: any) {
        super(entityId);
        this.sprite = sprite;
    }
}

/**
 * 健康组件
 */
export class HealthComponent extends Component {
    public current: number;
    public max: number;
    
    constructor(entityId: number, current: number, max: number) {
        super(entityId);
        this.current = current;
        this.max = max;
    }
}

/**
 * 玩家组件
 */
export class PlayerComponent extends Component {
    public character: string;
    public score: number = 0;
    public lives: number = 5;
    public ultimateSkillCharges: number = 0;
    public invincible: boolean = false;
    public invincibilityTimer: number = 0;
    public ronMode: boolean = false;
    public ronModeTimer: number = 0;
    
    constructor(entityId: number, character: string) {
        super(entityId);
        this.character = character;
    }
}

/**
 * 敌人组件
 */
export class EnemyComponent extends Component {
    public enemyType: string;
    public scoreValue: number;
    public movementPattern: string;
    public attackCooldown: number;
    public lastAttackTime: number;
    public stunned: boolean = false;
    public stunnedTimer: number = 0;
    public floating: boolean = false;
    public floatingTimer: number = 0;
    
    constructor(entityId: number, enemyType: string, scoreValue: number, movementPattern: string) {
        super(entityId);
        this.enemyType = enemyType;
        this.scoreValue = scoreValue;
        this.movementPattern = movementPattern;
        this.attackCooldown = 2.0;
        this.lastAttackTime = Math.random() * 2;
    }
}

/**
 * 咒语组件
 */
export class SpellComponent extends Component {
    public spellType: string;
    public damage: number;
    public speed: number;
    public lifetime: number;
    public currentLifetime: number = 0;
    public target?: any; // 追踪目标
    
    constructor(entityId: number, spellType: string, damage: number, speed: number, lifetime: number) {
        super(entityId);
        this.spellType = spellType;
        this.damage = damage;
        this.speed = speed;
        this.lifetime = lifetime;
    }
}

/**
 * 食物组件
 */
export class FoodComponent extends Component {
    public foodType: string;
    public healAmount: number;
    
    constructor(entityId: number, foodType: string, healAmount: number) {
        super(entityId);
        this.foodType = foodType;
        this.healAmount = healAmount;
    }
}

/**
 * 活跃状态组件
 */
export class ActiveComponent extends Component {
    public active: boolean = true;
    
    constructor(entityId: number) {
        super(entityId);
    }
} 