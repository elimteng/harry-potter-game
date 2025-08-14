/**
 * ECS架构中的实体类
 * 实体只是一个ID，不包含任何数据或行为
 */
export class Entity {
    private static nextId = 0;
    private id: number;

    constructor() {
        this.id = Entity.nextId++;
    }

    public getId(): number {
        return this.id;
    }

    public equals(other: Entity): boolean {
        return this.id === other.id;
    }

    public toString(): string {
        return `Entity(${this.id})`;
    }
} 