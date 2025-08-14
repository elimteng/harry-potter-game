import { World } from './World';
import { EntityFactory } from './EntityFactory';
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
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Spell } from '../entities/Spell';
import { Food } from '../entities/Food';
import { PlayerCharacter } from '../entities/Player';
import { EnemyType } from '../entities/Enemy';
import { SpellType } from '../entities/Spell';

/**
 * ECS适配器类
 * 用于在现有面向对象代码和ECS架构之间进行桥接
 * 允许渐进式迁移，最小化对现有代码的改动
 */
export class ECSAdapter {
    private world: World;
    private factory: EntityFactory;
    private entityMap: Map<string, Entity> = new Map(); // 旧对象ID -> ECS实体
    private reverseMap: Map<number, string> = new Map(); // ECS实体ID -> 旧对象ID
    
    constructor() {
        this.world = new World();
        this.factory = new EntityFactory(this.world);
    }
    
    /**
     * 将现有的Player对象转换为ECS实体
     */
    public convertPlayerToECS(player: Player): Entity {
        const entity = this.factory.createPlayer(
            player.getCharacter(),
            player.getSprite(),
            player.getPosition().x,
            player.getPosition().y
        );
        
        const entityId = entity.getId();
        const playerComponent = this.world.getComponent<PlayerComponent>(entityId, 'PlayerComponent');
        
        if (playerComponent) {
            // 复制玩家状态
            playerComponent.score = player.getScore();
            playerComponent.lives = player.getLives();
            playerComponent.ultimateSkillCharges = player.getUltimateSkillCharges();
            playerComponent.invincible = player['invincible'] || false;
            playerComponent.invincibilityTimer = player['invincibilityTimer'] || 0;
            playerComponent.ronMode = player.isInRonMode();
            playerComponent.ronModeTimer = player.getRonModeTimeRemaining();
        }
        
        // 建立映射关系
        this.entityMap.set(player.getId(), entity);
        this.reverseMap.set(entityId, player.getId());
        
        return entity;
    }
    
    /**
     * 将Phaser PlayerSprite转换为ECS实体
     */
    public convertPlayerSpriteToECS(playerSprite: any): Entity {
        const entity = this.factory.createPlayer(
            playerSprite.getCharacter(),
            playerSprite,
            playerSprite.x,
            playerSprite.y
        );
        
        const entityId = entity.getId();
        const playerComponent = this.world.getComponent<PlayerComponent>(entityId, 'PlayerComponent');
        
        if (playerComponent) {
            // 复制玩家状态
            playerComponent.score = 0; // PlayerSprite没有score属性
            playerComponent.lives = playerSprite.getLives();
            playerComponent.ultimateSkillCharges = playerSprite.getUltimateSkillCharges();
            playerComponent.invincible = playerSprite['invincible'] || false;
            playerComponent.invincibilityTimer = playerSprite['invincibilityTimer'] || 0;
            playerComponent.ronMode = playerSprite['ronMode'] || false;
            playerComponent.ronModeTimer = playerSprite['ronModeTimer'] || 0;
        }
        
        // 建立映射关系
        this.entityMap.set(playerSprite.name || `player_${entityId}`, entity);
        this.reverseMap.set(entityId, playerSprite.name || `player_${entityId}`);
        
        return entity;
    }
    
    /**
     * 将现有的Enemy对象转换为ECS实体
     */
    public convertEnemyToECS(enemy: Enemy): Entity {
        const entity = this.factory.createEnemy(
            enemy.getEnemyType(),
            enemy.getSprite(),
            enemy.getPosition().x,
            enemy.getPosition().y,
            enemy['health'] || 1,
            enemy['movementPattern'] || 'horizontal'
        );
        
        const entityId = entity.getId();
        const enemyComponent = this.world.getComponent<EnemyComponent>(entityId, 'EnemyComponent');
        
        if (enemyComponent) {
            // 复制敌人状态
            enemyComponent.stunned = enemy.isStunned();
            enemyComponent.floating = enemy.isFloating();
            // 其他状态可以根据需要添加
        }
        
        // 建立映射关系
        this.entityMap.set(enemy.getId(), entity);
        this.reverseMap.set(entityId, enemy.getId());
        
        return entity;
    }
    
    /**
     * 将Phaser EnemySprite转换为ECS实体
     */
    public convertEnemySpriteToECS(enemySprite: any): Entity {
        const entity = this.factory.createEnemy(
            enemySprite.getEnemyType(),
            enemySprite,
            enemySprite.x,
            enemySprite.y,
            enemySprite['health'] || 1,
            'horizontal'
        );
        
        const entityId = entity.getId();
        const enemyComponent = this.world.getComponent<EnemyComponent>(entityId, 'EnemyComponent');
        
        if (enemyComponent) {
            // 复制敌人状态
            enemyComponent.stunned = enemySprite['stunned'] || false;
            enemyComponent.floating = enemySprite['floating'] || false;
        }
        
        // 建立映射关系
        const enemyId = enemySprite.name || `enemy_${entityId}`;
        this.entityMap.set(enemyId, entity);
        this.reverseMap.set(entityId, enemyId);
        
        return entity;
    }
    
    /**
     * 将现有的Spell对象转换为ECS实体
     */
    public convertSpellToECS(spell: Spell): Entity {
        const entity = this.factory.createSpell(
            spell.getSpellType() as SpellType,
            spell.getSprite(),
            spell.getPosition().x,
            spell.getPosition().y,
            spell.getVelocity().x,
            spell.getVelocity().y,
            spell.getDamage(),
            3 // 默认生命周期
        );
        
        // 建立映射关系
        this.entityMap.set(spell.getId(), entity);
        this.reverseMap.set(entity.getId(), spell.getId());
        
        return entity;
    }
    
    /**
     * 将Phaser SpellSprite转换为ECS实体
     */
    public convertSpellSpriteToECS(spellSprite: any): Entity {
        const entity = this.factory.createSpell(
            spellSprite.getSpellType() as SpellType,
            spellSprite,
            spellSprite.x,
            spellSprite.y,
            spellSprite.body?.velocity.x || 0,
            spellSprite.body?.velocity.y || -500,
            spellSprite.getDamage ? spellSprite.getDamage() : 1,
            3 // 默认生命周期
        );
        
        // 建立映射关系
        const spellId = spellSprite.name || `spell_${entity.getId()}`;
        this.entityMap.set(spellId, entity);
        this.reverseMap.set(entity.getId(), spellId);
        
        return entity;
    }
    
    /**
     * 将现有的Food对象转换为ECS实体
     */
    public convertFoodToECS(food: Food): Entity {
        const entity = this.factory.createFood(
            food.getFoodType(),
            food.getSprite(),
            food.getPosition().x,
            food.getPosition().y,
            food.getHealAmount()
        );
        
        // 建立映射关系
        this.entityMap.set(food.getId(), entity);
        this.reverseMap.set(entity.getId(), food.getId());
        
        return entity;
    }
    
    /**
     * 将Phaser FoodSprite转换为ECS实体
     */
    public convertFoodSpriteToECS(foodSprite: any): Entity {
        const entity = this.factory.createFood(
            foodSprite.getFoodType(),
            foodSprite,
            foodSprite.x,
            foodSprite.y,
            foodSprite.getHealAmount ? foodSprite.getHealAmount() : 0.5
        );
        
        // 建立映射关系
        const foodId = foodSprite.name || `food_${entity.getId()}`;
        this.entityMap.set(foodId, entity);
        this.reverseMap.set(entity.getId(), foodId);
        
        return entity;
    }
    
    /**
     * 从ECS实体获取对应的旧对象ID
     */
    public getOriginalObjectId(entityId: number): string | undefined {
        return this.reverseMap.get(entityId);
    }
    
    /**
     * 从旧对象ID获取对应的ECS实体
     */
    public getECSEntity(originalId: string): Entity | undefined {
        return this.entityMap.get(originalId);
    }
    
    /**
     * 更新ECS实体的位置以匹配旧对象
     */
    public syncPosition(originalId: string): void {
        const entity = this.entityMap.get(originalId);
        if (!entity) return;
        
        const entityId = entity.getId();
        const position = this.world.getComponent<PositionComponent>(entityId, 'PositionComponent');
        
        // 这里需要根据原始对象类型来获取位置
        // 由于我们不知道具体的原始对象，这里提供一个通用接口
        // 实际使用时需要传入位置信息
    }
    
    /**
     * 同步ECS实体的状态到旧对象
     */
    public syncStateToOriginal(originalId: string, originalObject: any): void {
        const entity = this.entityMap.get(originalId);
        if (!entity) return;
        
        const entityId = entity.getId();
        
        // 同步位置
        const position = this.world.getComponent<PositionComponent>(entityId, 'PositionComponent');
        if (position && originalObject.setPosition) {
            originalObject.setPosition(position.x, position.y);
        }
        
        // 同步速度
        const velocity = this.world.getComponent<VelocityComponent>(entityId, 'VelocityComponent');
        if (velocity && originalObject.setVelocity) {
            originalObject.setVelocity(velocity.x, velocity.y);
        }
        
        // 同步活跃状态
        const active = this.world.getComponent<ActiveComponent>(entityId, 'ActiveComponent');
        if (active && originalObject.setActive) {
            originalObject.setActive(active.active);
        }
    }
    
    /**
     * 更新ECS世界
     */
    public update(deltaTime: number): void {
        this.world.update(deltaTime);
    }
    
    /**
     * 获取ECS世界实例
     */
    public getWorld(): World {
        return this.world;
    }
    
    /**
     * 获取实体工厂实例
     */
    public getFactory(): EntityFactory {
        return this.factory;
    }
    
    /**
     * 清理所有实体
     */
    public clear(): void {
        this.world.clear();
        this.entityMap.clear();
        this.reverseMap.clear();
    }
    
    /**
     * 移除特定实体
     */
    public removeEntity(originalId: string): void {
        const entity = this.entityMap.get(originalId);
        if (entity) {
            const entityId = entity.getId();
            this.world.destroyEntity(entityId);
            this.entityMap.delete(originalId);
            this.reverseMap.delete(entityId);
        }
    }
    
    /**
     * 调试ECS状态
     */
    public debugState(): void {
        const world = this.getWorld();
        console.log('=== ECS 调试信息 ===');
        console.log(`ECS实体总数: ${world.getEntityCount()}`);
        console.log(`映射关系数量: ${this.entityMap.size}`);
        
        // 统计各种组件
        const playerEntities = world.getEntitiesWithComponent('PlayerComponent');
        const enemyEntities = world.getEntitiesWithComponent('EnemyComponent');
        const spellEntities = world.getEntitiesWithComponent('SpellComponent');
        const foodEntities = world.getEntitiesWithComponent('FoodComponent');
        const positionEntities = world.getEntitiesWithComponent('PositionComponent');
        const velocityEntities = world.getEntitiesWithComponent('VelocityComponent');
        
        console.log(`组件统计:`);
        console.log(`  玩家组件: ${playerEntities.length}`);
        console.log(`  敌人组件: ${enemyEntities.length}`);
        console.log(`  咒语组件: ${spellEntities.length}`);
        console.log(`  食物组件: ${foodEntities.length}`);
        console.log(`  位置组件: ${positionEntities.length}`);
        console.log(`  速度组件: ${velocityEntities.length}`);
        
        // 显示一些实体的详细信息
        if (playerEntities.length > 0) {
            const playerId = playerEntities[0];
            const playerComponent = world.getComponent<PlayerComponent>(playerId, 'PlayerComponent');
            const positionComponent = world.getComponent<PositionComponent>(playerId, 'PositionComponent');
            console.log(`玩家实体详情:`);
            console.log(`  实体ID: ${playerId}`);
            console.log(`  角色: ${playerComponent?.character}`);
            console.log(`  生命值: ${playerComponent?.lives}`);
            console.log(`  位置: (${positionComponent?.x}, ${positionComponent?.y})`);
        }
        
        if (enemyEntities.length > 0) {
            const enemyId = enemyEntities[0];
            const enemyComponent = world.getComponent<EnemyComponent>(enemyId, 'EnemyComponent');
            const positionComponent = world.getComponent<PositionComponent>(enemyId, 'PositionComponent');
            console.log(`敌人实体详情:`);
            console.log(`  实体ID: ${enemyId}`);
            console.log(`  类型: ${enemyComponent?.enemyType}`);
            console.log(`  分数价值: ${enemyComponent?.scoreValue}`);
            console.log(`  位置: (${positionComponent?.x}, ${positionComponent?.y})`);
        }
        
        console.log('==================');
    }
    
    /**
     * 测试ECS功能
     */
    public testECSFunctionality(): void {
        console.log('=== 测试ECS功能 ===');
        
        // 测试1: 创建测试实体
        const testEntity = this.world.createEntity();
        console.log(`✓ 创建测试实体: ${testEntity.getId()}`);
        
        // 测试2: 添加组件
        const testPosition = new PositionComponent(testEntity.getId(), 100, 200);
        const testVelocity = new VelocityComponent(testEntity.getId(), 10, 20);
        this.world.addComponent(testEntity.getId(), testPosition);
        this.world.addComponent(testEntity.getId(), testVelocity);
        console.log(`✓ 添加位置和速度组件`);
        
        // 测试3: 查询组件
        const retrievedPosition = this.world.getComponent<PositionComponent>(testEntity.getId(), 'PositionComponent');
        const retrievedVelocity = this.world.getComponent<VelocityComponent>(testEntity.getId(), 'VelocityComponent');
        console.log(`✓ 查询组件: 位置(${retrievedPosition?.x}, ${retrievedPosition?.y}), 速度(${retrievedVelocity?.x}, ${retrievedVelocity?.y})`);
        
        // 测试4: 查询具有特定组件的实体
        const entitiesWithPosition = this.world.getEntitiesWithComponent('PositionComponent');
        console.log(`✓ 具有位置组件的实体数量: ${entitiesWithPosition.length}`);
        
        // 测试5: 更新系统
        this.world.update(0.016); // 模拟16ms的更新
        console.log(`✓ 系统更新完成`);
        
        // 测试6: 清理测试实体
        this.world.destroyEntity(testEntity.getId());
        console.log(`✓ 清理测试实体`);
        
        console.log('=== ECS功能测试完成 ===');
    }
    
    /**
     * 获取ECS统计信息
     */
    public getECSStats(): { entityCount: number; componentTypes: string[]; mappingCount: number } {
        const world = this.getWorld();
        return {
            entityCount: world.getEntityCount(),
            componentTypes: ['PositionComponent', 'VelocityComponent', 'SpriteComponent', 'HealthComponent', 'PlayerComponent', 'EnemyComponent', 'SpellComponent', 'FoodComponent', 'ActiveComponent'],
            mappingCount: this.entityMap.size
        };
    }
} 