import { ECSAdapter } from './ECSAdapter';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Spell } from '../entities/Spell';
import { Food } from '../entities/Food';
import { PlayerCharacter } from '../entities/Player';
import { EnemyType } from '../entities/Enemy';
import { SpellType } from '../entities/Spell';

/**
 * ECS集成示例
 * 展示如何在现有代码中集成ECS架构
 */
export class ECSIntegrationExample {
    private ecsAdapter: ECSAdapter;
    private originalObjects: Map<string, any> = new Map();
    
    constructor() {
        this.ecsAdapter = new ECSAdapter();
    }
    
    /**
     * 初始化游戏对象并转换为ECS实体
     */
    public initializeGameObjects(): void {
        // 假设这些是从现有代码中获取的对象
        const player = this.createPlayer();
        const enemy = this.createEnemy();
        const spell = this.createSpell();
        const food = this.createFood();
        
        // 转换为ECS实体
        this.ecsAdapter.convertPlayerToECS(player);
        this.ecsAdapter.convertEnemyToECS(enemy);
        this.ecsAdapter.convertSpellToECS(spell);
        this.ecsAdapter.convertFoodToECS(food);
        
        // 保存原始对象引用
        this.originalObjects.set(player.getId(), player);
        this.originalObjects.set(enemy.getId(), enemy);
        this.originalObjects.set(spell.getId(), spell);
        this.originalObjects.set(food.getId(), food);
    }
    
    /**
     * 游戏主循环
     */
    public gameLoop(deltaTime: number): void {
        // 1. 更新ECS世界
        this.ecsAdapter.update(deltaTime);
        
        // 2. 同步ECS状态到原始对象
        for (const [objectId, originalObject] of this.originalObjects) {
            this.ecsAdapter.syncStateToOriginal(objectId, originalObject);
        }
        
        // 3. 处理碰撞检测（仍然使用原有逻辑）
        this.handleCollisions();
        
        // 4. 处理用户输入（仍然使用原有逻辑）
        this.handleInput();
    }
    
    /**
     * 添加新实体到ECS
     */
    public addNewEntity(entityType: 'player' | 'enemy' | 'spell' | 'food', data: any): void {
        switch (entityType) {
            case 'player':
                const player = this.createPlayerFromData(data);
                this.ecsAdapter.convertPlayerToECS(player);
                this.originalObjects.set(player.getId(), player);
                break;
            case 'enemy':
                const enemy = this.createEnemyFromData(data);
                this.ecsAdapter.convertEnemyToECS(enemy);
                this.originalObjects.set(enemy.getId(), enemy);
                break;
            case 'spell':
                const spell = this.createSpellFromData(data);
                this.ecsAdapter.convertSpellToECS(spell);
                this.originalObjects.set(spell.getId(), spell);
                break;
            case 'food':
                const food = this.createFoodFromData(data);
                this.ecsAdapter.convertFoodToECS(food);
                this.originalObjects.set(food.getId(), food);
                break;
        }
    }
    
    /**
     * 移除实体
     */
    public removeEntity(objectId: string): void {
        this.ecsAdapter.removeEntity(objectId);
        this.originalObjects.delete(objectId);
    }
    
    /**
     * 获取ECS世界统计信息
     */
    public getECSStats(): { entityCount: number; componentTypes: string[] } {
        const world = this.ecsAdapter.getWorld();
        return {
            entityCount: world.getEntityCount(),
            componentTypes: ['PositionComponent', 'VelocityComponent', 'SpriteComponent', 'HealthComponent', 'PlayerComponent', 'EnemyComponent', 'SpellComponent', 'FoodComponent', 'ActiveComponent']
        };
    }
    
    /**
     * 清理所有实体
     */
    public clearAll(): void {
        this.ecsAdapter.clear();
        this.originalObjects.clear();
    }
    
    // 私有方法 - 创建示例对象
    private createPlayer(): Player {
        // 这里应该使用实际的纹理和参数
        const mockTexture = {} as any;
        const player = new Player(
            PlayerCharacter.HARRY,
            mockTexture,
            mockTexture,
            400,
            600
        );
        return player;
    }
    
    private createEnemy(): Enemy {
        const mockTexture = {} as any;
        const enemy = new Enemy(
            mockTexture,
            EnemyType.DEMENTOR,
            100,
            100,
            2
        );
        return enemy;
    }
    
    private createSpell(): Spell {
        const mockTexture = {} as any;
        const spell = new Spell(
            mockTexture,
            200,
            200,
            0,
            -300,
            SpellType.EXPELLIARMUS,
            1,
            3
        );
        return spell;
    }
    
    private createFood(): Food {
        const mockTexture = {} as any;
        const food = new Food(
            mockTexture,
            300,
            300,
            'chocolate_frog' as any,
            0.5
        );
        return food;
    }
    
    private createPlayerFromData(data: any): Player {
        // 根据数据创建玩家
        return this.createPlayer();
    }
    
    private createEnemyFromData(data: any): Enemy {
        // 根据数据创建敌人
        return this.createEnemy();
    }
    
    private createSpellFromData(data: any): Spell {
        // 根据数据创建咒语
        return this.createSpell();
    }
    
    private createFoodFromData(data: any): Food {
        // 根据数据创建食物
        return this.createFood();
    }
    
    private handleCollisions(): void {
        // 使用原有的碰撞检测逻辑
        console.log('处理碰撞检测...');
    }
    
    private handleInput(): void {
        // 使用原有的输入处理逻辑
        console.log('处理用户输入...');
    }
}

/**
 * 在Phaser场景中使用的示例
 */
export class ECSPhaserIntegration {
    private ecsAdapter: ECSAdapter;
    private scene: any; // Phaser.Scene
    
    constructor(scene: any) {
        this.scene = scene;
        this.ecsAdapter = new ECSAdapter();
    }
    
    /**
     * 在Phaser场景的create方法中调用
     */
    public initialize(): void {
        // 初始化ECS系统
        console.log('初始化ECS系统...');
    }
    
    /**
     * 在Phaser场景的update方法中调用
     */
    public update(time: number, delta: number): void {
        // 更新ECS世界
        this.ecsAdapter.update(delta / 1000);
    }
    
    /**
     * 创建玩家实体
     */
    public createPlayerEntity(character: PlayerCharacter, sprite: any, x: number, y: number): any {
        const factory = this.ecsAdapter.getFactory();
        return factory.createPlayer(character, sprite, x, y);
    }
    
    /**
     * 创建敌人实体
     */
    public createEnemyEntity(enemyType: EnemyType, sprite: any, x: number, y: number): any {
        const factory = this.ecsAdapter.getFactory();
        return factory.createEnemy(enemyType, sprite, x, y);
    }
    
    /**
     * 获取ECS适配器
     */
    public getECSAdapter(): ECSAdapter {
        return this.ecsAdapter;
    }
} 