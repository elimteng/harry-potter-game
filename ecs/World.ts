import { Entity } from './Entity';
import { Component } from './Component';
import { System } from './System';
import { MovementSystem, PlayerSystem, EnemySystem, SpellSystem } from './System';

/**
 * ECS架构的世界管理器
 * 管理所有实体、组件和系统
 */
export class World {
    private entities: Map<number, Entity> = new Map();
    private components: Map<string, Map<number, Component>> = new Map();
    private systems: System[] = [];
    
    constructor() {
        // 初始化默认系统
        this.addSystem(new MovementSystem());
        this.addSystem(new PlayerSystem());
        this.addSystem(new EnemySystem());
        this.addSystem(new SpellSystem());
    }
    
    /**
     * 创建新实体
     */
    public createEntity(): Entity {
        const entity = new Entity();
        this.entities.set(entity.getId(), entity);
        return entity;
    }
    
    /**
     * 销毁实体
     */
    public destroyEntity(entityId: number): void {
        // 移除所有相关组件
        for (const [componentType, componentMap] of this.components) {
            componentMap.delete(entityId);
        }
        
        // 移除实体
        this.entities.delete(entityId);
    }
    
    /**
     * 添加组件到实体
     */
    public addComponent(entityId: number, component: Component): void {
        const componentType = component.constructor.name;
        
        if (!this.components.has(componentType)) {
            this.components.set(componentType, new Map());
        }
        
        this.components.get(componentType)!.set(entityId, component);
        
        // 通知所有系统
        for (const system of this.systems) {
            system.registerComponent(componentType, component);
        }
    }
    
    /**
     * 移除组件
     */
    public removeComponent(entityId: number, componentType: string): void {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            componentMap.delete(entityId);
        }
        
        // 通知所有系统
        for (const system of this.systems) {
            system.removeComponent(componentType, entityId);
        }
    }
    
    /**
     * 获取实体的组件
     */
    public getComponent<T extends Component>(entityId: number, componentType: string): T | undefined {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            return componentMap.get(entityId) as T;
        }
        return undefined;
    }
    
    /**
     * 检查实体是否有指定组件
     */
    public hasComponent(entityId: number, componentType: string): boolean {
        const componentMap = this.components.get(componentType);
        return componentMap ? componentMap.has(entityId) : false;
    }
    
    /**
     * 获取所有具有指定组件的实体
     */
    public getEntitiesWithComponent(componentType: string): number[] {
        const componentMap = this.components.get(componentType);
        if (componentMap) {
            return Array.from(componentMap.keys());
        }
        return [];
    }
    
    /**
     * 添加系统
     */
    public addSystem(system: System): void {
        this.systems.push(system);
        
        // 将现有组件注册到新系统
        for (const [componentType, componentMap] of this.components) {
            for (const component of componentMap.values()) {
                system.registerComponent(componentType, component);
            }
        }
    }
    
    /**
     * 移除系统
     */
    public removeSystem(system: System): void {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
        }
    }
    
    /**
     * 更新所有系统
     */
    public update(deltaTime: number): void {
        for (const system of this.systems) {
            system.update(deltaTime);
        }
    }
    
    /**
     * 获取所有实体
     */
    public getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }
    
    /**
     * 获取实体数量
     */
    public getEntityCount(): number {
        return this.entities.size;
    }
    
    /**
     * 清理所有实体和组件
     */
    public clear(): void {
        this.entities.clear();
        this.components.clear();
        
        // 重新初始化系统
        this.systems = [];
        this.addSystem(new MovementSystem());
        this.addSystem(new PlayerSystem());
        this.addSystem(new EnemySystem());
        this.addSystem(new SpellSystem());
    }
} 