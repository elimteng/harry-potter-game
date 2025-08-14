import { Component, PositionComponent, VelocityComponent, SpriteComponent, PlayerComponent, EnemyComponent, SpellComponent, ActiveComponent } from './Component';

/**
 * ECS架构中的系统基类
 * 系统处理逻辑，不存储数据
 */
export abstract class System {
    protected components: Map<string, Component[]> = new Map();
    
    /**
     * 注册组件类型
     */
    public registerComponent(componentType: string, component: Component): void {
        if (!this.components.has(componentType)) {
            this.components.set(componentType, []);
        }
        this.components.get(componentType)!.push(component);
    }
    
    /**
     * 移除组件
     */
    public removeComponent(componentType: string, entityId: number): void {
        const components = this.components.get(componentType);
        if (components) {
            const index = components.findIndex(c => c.entityId === entityId);
            if (index !== -1) {
                components.splice(index, 1);
            }
        }
    }
    
    /**
     * 获取指定实体的组件
     */
    public getComponent<T extends Component>(componentType: string, entityId: number): T | undefined {
        const components = this.components.get(componentType);
        if (components) {
            return components.find(c => c.entityId === entityId) as T;
        }
        return undefined;
    }
    
    /**
     * 获取所有指定类型的组件
     */
    public getComponents<T extends Component>(componentType: string): T[] {
        return (this.components.get(componentType) || []) as T[];
    }
    
    /**
     * 获取具有多个指定组件的实体
     */
    public getEntitiesWithComponents(componentTypes: string[]): number[] {
        const entitySets = componentTypes.map(type => 
            new Set(this.getComponents(type).map(c => c.entityId))
        );
        
        // 找到所有组件类型都有的实体ID
        const intersection = entitySets.reduce((acc, set) => {
            return new Set([...acc].filter(x => set.has(x)));
        });
        
        return Array.from(intersection);
    }
    
    /**
     * 更新系统
     */
    public abstract update(deltaTime: number): void;
}

/**
 * 移动系统
 */
export class MovementSystem extends System {
    public update(deltaTime: number): void {
        const entities = this.getEntitiesWithComponents(['PositionComponent', 'VelocityComponent']);
        
        for (const entityId of entities) {
            const position = this.getComponent<PositionComponent>('PositionComponent', entityId);
            const velocity = this.getComponent<VelocityComponent>('VelocityComponent', entityId);
            
            if (position && velocity) {
                position.x += velocity.x * deltaTime;
                position.y += velocity.y * deltaTime;
                
                // 更新精灵位置
                const sprite = this.getComponent<SpriteComponent>('SpriteComponent', entityId);
                if (sprite && sprite.sprite) {
                    sprite.sprite.position.set(position.x, position.y);
                }
            }
        }
    }
}

/**
 * 玩家系统
 */
export class PlayerSystem extends System {
    public update(deltaTime: number): void {
        const entities = this.getEntitiesWithComponents(['PlayerComponent', 'ActiveComponent']);
        
        for (const entityId of entities) {
            const player = this.getComponent<PlayerComponent>('PlayerComponent', entityId);
            const active = this.getComponent<ActiveComponent>('ActiveComponent', entityId);
            
            if (player && active && active.active) {
                // 更新无敌状态
                if (player.invincibilityTimer > 0) {
                    player.invincibilityTimer -= deltaTime;
                    if (player.invincibilityTimer <= 0) {
                        player.invincible = false;
                    }
                }
                
                // 更新罗恩模式
                if (player.ronModeTimer > 0) {
                    player.ronModeTimer -= deltaTime;
                    if (player.ronModeTimer <= 0) {
                        player.ronMode = false;
                        player.invincible = false;
                    }
                }
            }
        }
    }
}

/**
 * 敌人系统
 */
export class EnemySystem extends System {
    public update(deltaTime: number): void {
        const entities = this.getEntitiesWithComponents(['EnemyComponent', 'ActiveComponent']);
        
        for (const entityId of entities) {
            const enemy = this.getComponent<EnemyComponent>('EnemyComponent', entityId);
            const active = this.getComponent<ActiveComponent>('ActiveComponent', entityId);
            
            if (enemy && active && active.active) {
                // 更新昏迷状态
                if (enemy.stunned) {
                    enemy.stunnedTimer -= deltaTime;
                    if (enemy.stunnedTimer <= 0) {
                        enemy.stunned = false;
                    }
                }
                
                // 更新漂浮状态
                if (enemy.floating) {
                    enemy.floatingTimer -= deltaTime;
                    if (enemy.floatingTimer <= 0) {
                        enemy.floating = false;
                    }
                }
            }
        }
    }
}

/**
 * 咒语系统
 */
export class SpellSystem extends System {
    public update(deltaTime: number): void {
        const entities = this.getEntitiesWithComponents(['SpellComponent', 'ActiveComponent']);
        
        for (const entityId of entities) {
            const spell = this.getComponent<SpellComponent>('SpellComponent', entityId);
            const active = this.getComponent<ActiveComponent>('ActiveComponent', entityId);
            
            if (spell && active && active.active) {
                spell.currentLifetime += deltaTime;
                
                // 检查咒语是否过期
                if (spell.currentLifetime >= spell.lifetime) {
                    active.active = false;
                }
            }
        }
    }
} 