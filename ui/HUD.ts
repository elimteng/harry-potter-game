import * as PIXI from 'pixi.js';
import { GameColor } from '../GameColor';
import { Logger } from '../utils/Logger';

/**
 * 游戏抬头显示界面 (Heads-Up Display)
 * 显示游戏中心消息等信息
 */
export class HUD {
    private container: PIXI.Container;
    private messageText: PIXI.Text;
    private width: number;
    private height: number;
    private logger: Logger;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.container = new PIXI.Container();
        this.logger = Logger.getInstance();
        
        // 创建大型文本样式用于中心消息
        const largeTextStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: GameColor.GRYFFINDOR_GOLD,
            align: 'center',
            dropShadow: true,
            dropShadowColor: GameColor.BLACK,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        
        // 创建消息文本
        this.messageText = new PIXI.Text('', largeTextStyle);
        this.messageText.anchor.set(0.5);
        this.messageText.position.set(this.width / 2, this.height / 2);
        this.messageText.visible = false;
        this.container.addChild(this.messageText);
        
        this.logger.info('HUD', 'HUD initialized with dimensions:', width, height);
    }
    
    /**
     * 更新HUD显示
     * @param deltaTime 帧时间间隔
     */
    public update(deltaTime: number): void {
        // HUD更新逻辑（如果需要的话）
    }
    
    /**
     * 显示中心消息
     * @param message 消息内容
     * @param duration 显示时长（毫秒），0表示一直显示直到清除
     */
    public showMessage(message: string, duration: number = 0): void {
        this.messageText.text = message;
        this.messageText.visible = true;
        
        if (duration > 0) {
            setTimeout(() => {
                this.hideMessage();
            }, duration);
        }
    }
    
    /**
     * 隐藏中心消息
     */
    public hideMessage(): void {
        this.messageText.visible = false;
    }
    
    /**
     * 获取HUD容器
     */
    public getContainer(): PIXI.Container {
        return this.container;
    }
    
    /**
     * 重设HUD尺寸
     */
    public resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        
        // 更新消息文本位置到中心
        this.messageText.position.set(this.width / 2, this.height / 2);
        
        this.logger.info('HUD', 'HUD resized to:', width, height);
    }

    /**
     * 渲染HUD到舞台
     */
    public render(stage: PIXI.Container): void {
        if (!stage.children.includes(this.container)) {
            stage.addChild(this.container);
        }
    }

    /**
     * 处理键盘输入（用于调试功能）
     */
    public handleKeyboardInput(event: any): void {
        // 处理F1-F4等调试按键
        this.logger.debug('HUD', `Keyboard input: ${event.key}`);
    }
}
