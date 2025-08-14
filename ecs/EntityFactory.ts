import { World } from './World';
import { Entity } from './Entity';
import { 
    PositionComponent, 
    VelocityComponent, 
    SpriteComponent, 
    HealthComponent, 
    PlayerComponent, 
    EnemyComponent, 
    SpellComponent, 
    FoodComponent, 
    ActiveComponent 
} from './Component';
import { PlayerCharacter } from '../entities/Player';
import { EnemyType } from '../entities/Enemy';
import { SpellType } from '../entities/Spell';

/**
 * 实体工厂类
 * 负责创建各种类型的游戏实体
 */
export class EntityFactory {
    private world: World;
    
    constructor(world: World) {
        this.world = world;
    }
    
    /**
     * 创建玩家实体
     */
    public createPlayer(
        character: PlayerCharacter,
        sprite: any,
        x: number,
        y: number
    ): Entity {
        const entity = this.world.createEntity();
        const entityId = entity.getId();
        
        // 添加基础组件
        this.world.addComponent(entityId, new PositionComponent(entityId, x, y));
        this.world.addComponent(entityId, new VelocityComponent(entityId, 0, 0));
        this.world.addComponent(entityId, new SpriteComponent(entityId, sprite));
        this.world.addComponent(entityId, new HealthComponent(entityId, 5, 5));
        this.world.addComponent(entityId, new PlayerComponent(entityId, character));
        this.world.addComponent(entityId, new ActiveComponent(entityId));
        
        return entity;
    }
    
    /**
     * 创建敌人实体
     */
    public createEnemy(
        enemyType: EnemyType,
        sprite: any,
        x: number,
        y: number,
        health: number = 1,
        movementPattern: string = 'horizontal'
    ): Entity {
        const entity = this.world.createEntity();
        const entityId = entity.getId();
        
        // 计算分数价值
        const scoreValue = this.calculateEnemyScoreValue(enemyType);
        
        // 添加基础组件
        this.world.addComponent(entityId, new PositionComponent(entityId, x, y));
        this.world.addComponent(entityId, new VelocityComponent(entityId, 0, 0));
        this.world.addComponent(entityId, new SpriteComponent(entityId, sprite));
        this.world.addComponent(entityId, new HealthComponent(entityId, health, health));
        this.world.addComponent(entityId, new EnemyComponent(entityId, enemyType, scoreValue, movementPattern));
        this.world.addComponent(entityId, new ActiveComponent(entityId));
        
        return entity;
    }
    
    /**
     * 创建咒语实体
     */
    public createSpell(
        spellType: SpellType,
        sprite: any,
        x: number,
        y: number,
        velocityX: number,
        velocityY: number,
        damage: number,
        lifetime: number = 3
    ): Entity {
        const entity = this.world.createEntity();
        const entityId = entity.getId();
        
        // 添加基础组件
        this.world.addComponent(entityId, new PositionComponent(entityId, x, y));
        this.world.addComponent(entityId, new VelocityComponent(entityId, velocityX, velocityY));
        this.world.addComponent(entityId, new SpriteComponent(entityId, sprite));
        this.world.addComponent(entityId, new SpellComponent(entityId, spellType, damage, Math.sqrt(velocityX * velocityX + velocityY * velocityY), lifetime));
        this.world.addComponent(entityId, new ActiveComponent(entityId));
        
        return entity;
    }
    
    /**
     * 创建食物实体
     */
    public createFood(
        foodType: string,
        sprite: any,
        x: number,
        y: number,
        healAmount: number = 1
    ): Entity {
        const entity = this.world.createEntity();
        const entityId = entity.getId();
        
        // 添加基础组件
        this.world.addComponent(entityId, new PositionComponent(entityId, x, y));
        this.world.addComponent(entityId, new VelocityComponent(entityId, 0, 0));
        this.world.addComponent(entityId, new SpriteComponent(entityId, sprite));
        this.world.addComponent(entityId, new FoodComponent(entityId, foodType, healAmount));
        this.world.addComponent(entityId, new ActiveComponent(entityId));
        
        return entity;
    }
    
    /**
     * 计算敌人分数价值
     */
    private calculateEnemyScoreValue(enemyType: EnemyType): number {
        switch (enemyType) {
            case EnemyType.VOLDEMORT:
                return 1000;
            case EnemyType.LUCIUS:
                return 1000;
            case EnemyType.BELLATRIX:
                return 2000;
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
} 