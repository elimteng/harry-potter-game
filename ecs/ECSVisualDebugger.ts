import { ECSAdapter } from './ECSAdapter';
import { World } from './World';
import { PlayerComponent, EnemyComponent, PositionComponent } from './Component';

/**
 * ECS可视化调试器
 * 在游戏界面上显示ECS状态信息
 */
export class ECSVisualDebugger {
    private ecsAdapter: ECSAdapter;
    private debugText: any; // Phaser.Text
    private scene: any; // Phaser.Scene
    private isVisible: boolean = false;
    
    constructor(scene: any, ecsAdapter: ECSAdapter) {
        this.scene = scene;
        this.ecsAdapter = ecsAdapter;
        this.createDebugPanel();
    }
    
    /**
     * 创建调试面板
     */
    private createDebugPanel(): void {
        // 创建背景面板
        const panel = this.scene.add.rectangle(
            10, 10, 300, 200, 0x000000, 0.7
        );
        panel.setOrigin(0, 0);
        panel.setStrokeStyle(2, 0x00FF00);
        
        // 创建标题文本
        const titleText = this.scene.add.text(15, 15, 'ECS 调试面板', {
            fontSize: '16px',
            color: '#00FF00',
            fontFamily: 'Arial'
        });
        
        // 创建状态文本
        this.debugText = this.scene.add.text(15, 40, '', {
            fontSize: '12px',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            wordWrap: { width: 280 }
        });
        
        // 初始隐藏
        this.hide();
    }
    
    /**
     * 更新调试信息
     */
    public update(): void {
        if (!this.isVisible) return;
        
        const world = this.ecsAdapter.getWorld();
        const stats = this.ecsAdapter.getECSStats();
        
        // 获取各种组件的实体数量
        const playerEntities = world.getEntitiesWithComponent('PlayerComponent');
        const enemyEntities = world.getEntitiesWithComponent('EnemyComponent');
        const spellEntities = world.getEntitiesWithComponent('SpellComponent');
        const foodEntities = world.getEntitiesWithComponent('FoodComponent');
        const positionEntities = world.getEntitiesWithComponent('PositionComponent');
        const velocityEntities = world.getEntitiesWithComponent('VelocityComponent');
        
        // 构建调试信息文本
        let debugInfo = `实体总数: ${stats.entityCount}\n`;
        debugInfo += `映射关系: ${stats.mappingCount}\n\n`;
        debugInfo += `组件统计:\n`;
        debugInfo += `  玩家: ${playerEntities.length}\n`;
        debugInfo += `  敌人: ${enemyEntities.length}\n`;
        debugInfo += `  咒语: ${spellEntities.length}\n`;
        debugInfo += `  食物: ${foodEntities.length}\n`;
        debugInfo += `  位置: ${positionEntities.length}\n`;
        debugInfo += `  速度: ${velocityEntities.length}\n\n`;
        
        // 显示玩家详细信息
        if (playerEntities.length > 0) {
            debugInfo += `玩家实体: ${playerEntities.length} 个\n`;
        }
        
        // 显示敌人详细信息
        if (enemyEntities.length > 0) {
            debugInfo += `敌人实体: ${enemyEntities.length} 个\n`;
        }
        
        this.debugText.setText(debugInfo);
    }
    
    /**
     * 显示调试面板
     */
    public show(): void {
        this.isVisible = true;
        this.debugText.setVisible(true);
        this.debugText.parentContainer?.setVisible(true);
    }
    
    /**
     * 隐藏调试面板
     */
    public hide(): void {
        this.isVisible = false;
        this.debugText.setVisible(false);
        this.debugText.parentContainer?.setVisible(false);
    }
    
    /**
     * 切换显示状态
     */
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * 销毁调试面板
     */
    public destroy(): void {
        if (this.debugText) {
            this.debugText.destroy();
        }
    }
} 