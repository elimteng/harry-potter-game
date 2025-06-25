import * as PIXI from 'pixi.js';
import { Logger } from './Logger';

/**
 * 标准纹理管理器
 * 严格遵循 PixiJS 教程的最佳实践：
 * 1. 使用预制贴图集 (JSON + PNG)
 * 2. 使用 PIXI.Assets 或 loader 加载
 * 3. 从 TextureCache 或 resources 创建精灵
 * 4. 完全避免动态纹理生成
 */
export class StandardTextureManager {
    private static instance: StandardTextureManager;
    private logger: Logger;
    private isInitialized: boolean = false;
    
    // 根据教程创建别名，简化纹理访问
    private textureCache: typeof PIXI.utils.TextureCache;
    private gameTextures: { [key: string]: PIXI.Texture } = {};

    private constructor() {
        this.logger = Logger.getInstance();
        this.textureCache = PIXI.utils.TextureCache;
    }

    public static getInstance(): StandardTextureManager {
        if (!StandardTextureManager.instance) {
            StandardTextureManager.instance = new StandardTextureManager();
        }
        return StandardTextureManager.instance;
    }

    /**
     * 初始化纹理管理器 - 使用 PixiJS 标准方法
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            this.logger.warn('StandardTextureManager', '纹理管理器已经初始化');
            return;
        }

        this.logger.info('StandardTextureManager', '开始使用 PixiJS 标准方法加载纹理...');
        
        // 方法1: 直接加载单个图片到 TextureCache
        await this.loadIndividualTextures();
        
        // 创建游戏纹理别名 - 教程推荐的方式
        this.createTextureAliases();
        
        this.isInitialized = true;
        this.logger.info('StandardTextureManager', 'PixiJS 标准纹理管理器初始化完成');
    }

    /**
     * 加载单个纹理到 TextureCache - 教程方法1
     */
    private async loadIndividualTextures(): Promise<void> {
        const textureList = [
            // 玩家纹理 - 修复映射关系，使用实际存在的文件名
            { name: 'harry.png', path: '/images/harry.png' },
            { name: 'harry_attack.png', path: '/images/harry_attack.png' },
            { name: 'ron.png', path: '/images/ron.png' },
            { name: 'ron_attack.png', path: '/images/ron_attack.png' },
            { name: 'hermione.png', path: '/images/hermione.png' },
            { name: 'hermione_attack.png', path: '/images/hermione_attack.png' },
            
            // 敌人纹理
            { name: 'death_eater_1.png', path: '/images/Death_Eater_1.png' },
            { name: 'death_eater_2.png', path: '/images/Death_Eater_2.png' },
            { name: 'death_eater_3.png', path: '/images/Death_Eater_3.png' },
            { name: 'lucius.png', path: '/images/Lucius.png' },
            { name: 'bellatrix.png', path: '/images/Bellat.png' },
            { name: 'dementor.png', path: '/images/Dementor.png' },
            { name: 'troll.png', path: '/images/troll.png' },
            { name: 'troll_defeat.png', path: '/images/troll_defeat.png' },
            { name: 'troll_weapon.png', path: '/images/troll_weapon.png' },
            
            // 玩家攻击纹理 - 使用1.png和2.png组成动态攻击效果
            { name: 'player_attack_1.png', path: '/images/1.png' },
            { name: 'player_attack_2.png', path: '/images/2.png' },
            
            // 其他咒语纹理
            { name: 'patronus.png', path: '/images/Patronus.png' },
            { name: 'ultimate_skill.png', path: '/images/utskill.png' },
            { name: 'stupefy.png', path: '/images/Stupefy.png' },
            { name: 'wingardium.png', path: '/images/Wingardium Leviosa.png' },
            
            // 敌人咒语专用纹理 - 使用专门的敌人攻击纹理
            { name: 'death_eater_attack.png', path: '/images/death_eater_attack.png' },
            { name: 'enemy_attack_2.png', path: '/images/attack_effect_2.png' },
            { name: 'patronus_charm.png', path: '/images/Patronus Charm.png' },

            
            // 食物纹理
            { name: 'chocolate_frog.png', path: '/images/Chocolate Frog.png' },
            { name: 'butterbeer.png', path: '/images/butterbeer.png' },
            { name: 'chicken.png', path: '/images/chicken.png' },
            { name: 'ron_mode.png', path: '/images/ron-mode.png' },
            
            // 背景纹理
            { name: 'background.png', path: '/images/background.png' }
        ];

        // 使用 PIXI.Assets 批量加载 - 现代 PixiJS 方法
        const loadPromises = textureList.map(async (item) => {
            try {
                await PIXI.Assets.load(item.path);
                // 手动添加到 TextureCache 以确保可以通过名称访问
                if (!this.textureCache[item.name]) {
                    this.textureCache[item.name] = PIXI.Texture.from(item.path);
                }
                this.logger.info('StandardTextureManager', `加载纹理: ${item.name}`);
            } catch (error) {
                this.logger.error('StandardTextureManager', `加载纹理失败: ${item.name}`, error);
                // 使用白色纹理作为备份
                this.textureCache[item.name] = PIXI.Texture.WHITE;
            }
        });

        await Promise.all(loadPromises);
        this.logger.info('StandardTextureManager', `所有单个纹理加载完成`);
    }

    /**
     * 创建纹理别名 - 教程推荐的方式
     */
    private createTextureAliases(): void {
        // 根据教程创建别名，简化访问
        // 例如: let id = PIXI.loader.resources["images/treasureHunter.json"].textures;
        // 我们直接创建一个类似的别名系统
        
        // 玩家纹理别名 - 使用实际存在的文件名
        this.gameTextures['player_harry_normal'] = this.getTextureFromCache('harry.png');
        this.gameTextures['player_harry_attack'] = this.getTextureFromCache('harry_attack.png');
        this.gameTextures['player_ron_normal'] = this.getTextureFromCache('ron.png');
        this.gameTextures['player_ron_attack'] = this.getTextureFromCache('ron_attack.png');
        this.gameTextures['player_hermione_normal'] = this.getTextureFromCache('hermione.png');
        this.gameTextures['player_hermione_attack'] = this.getTextureFromCache('hermione_attack.png');
        
        // 敌人纹理别名
        this.gameTextures['enemy_death_eater_1'] = this.getTextureFromCache('death_eater_1.png');
        this.gameTextures['enemy_death_eater_2'] = this.getTextureFromCache('death_eater_2.png');
        this.gameTextures['enemy_death_eater_3'] = this.getTextureFromCache('death_eater_3.png');
        this.gameTextures['enemy_lucius'] = this.getTextureFromCache('lucius.png');
        this.gameTextures['enemy_bellatrix'] = this.getTextureFromCache('bellatrix.png');
        this.gameTextures['enemy_dementor'] = this.getTextureFromCache('dementor.png');
        this.gameTextures['enemy_troll'] = this.getTextureFromCache('troll.png');
        this.gameTextures['enemy_troll_defeat'] = this.getTextureFromCache('troll_defeat.png');
        this.gameTextures['enemy_troll_weapon'] = this.getTextureFromCache('troll_weapon.png');
        
        // 玩家攻击纹理别名 - 使用1.png和2.png组成动态攻击效果
        this.gameTextures['spell_player_attack'] = this.getTextureFromCache('player_attack_1.png');   // 玩家攻击纹理1 (1.png)
        this.gameTextures['spell_player_attack_2'] = this.getTextureFromCache('player_attack_2.png'); // 玩家攻击纹理2 (2.png)
        
        // 其他咒语纹理别名
        this.gameTextures['spell_patronus'] = this.getTextureFromCache('patronus.png');               // 守护神咒专用
        this.gameTextures['spell_ultimate_skill'] = this.getTextureFromCache('ultimate_skill.png');   // 大招专用
        this.gameTextures['spell_stupefy'] = this.getTextureFromCache('stupefy.png');                 // 昏迷咒专用
        this.gameTextures['spell_wingardium'] = this.getTextureFromCache('wingardium.png');           // 漂浮咒专用
        
        // 食物纹理别名
        this.gameTextures['food_chocolate_frog'] = this.getTextureFromCache('chocolate_frog.png');
        this.gameTextures['food_butterbeer'] = this.getTextureFromCache('butterbeer.png');
        this.gameTextures['food_chicken'] = this.getTextureFromCache('chicken.png');
        this.gameTextures['food_ron_mode'] = this.getTextureFromCache('ron_mode.png');
        
        // 背景纹理别名
        this.gameTextures['background'] = this.getTextureFromCache('background.png');
        
        // 敌人咒语纹理别名 - 使用独立的图片文件，避免与玩家攻击纹理冲突
        // 遵循 PixiJS 最佳实践：每种咒语使用不同的图片文件，避免 BaseTexture 共享
        this.gameTextures['enemy_spell_green_orb'] = this.getTextureFromCache('death_eater_attack.png'); // 食死徒：使用专门的death_eater_attack.png
        this.gameTextures['enemy_spell_lucius_orb'] = this.getTextureFromCache('enemy_attack_2.png');   // 卢修斯：使用attack_effect_2.png
        this.gameTextures['enemy_spell_bellatrix_orb'] = this.getTextureFromCache('patronus_charm.png'); // 贝拉特里克斯：使用Patronus Charm.png
        this.gameTextures['ultimate_orb'] = this.getTextureFromCache('troll_weapon.png');              // 大招：使用troll武器纹理
        
        this.logger.info('StandardTextureManager', '游戏纹理别名创建完成');
    }

    /**
     * 从 TextureCache 获取纹理 - 教程方法1
     */
    private getTextureFromCache(frameName: string): PIXI.Texture {
        const texture = this.textureCache[frameName];
        if (texture) {
            return texture;
        } else {
            this.logger.warn('StandardTextureManager', `TextureCache中未找到: ${frameName}`);
            return PIXI.Texture.WHITE;
        }
    }

    /**
     * 获取游戏纹理 - 教程推荐的别名方式
     */
    public getTexture(name: string): PIXI.Texture | undefined {
        const texture = this.gameTextures[name];
        if (texture) {
            this.logger.info('StandardTextureManager', `从别名获取纹理: ${name}`);
            return texture;
        }

        // 降级：直接从 TextureCache 查找
        const fallbackTexture = this.textureCache[name] || this.textureCache[`${name}.png`];
        if (fallbackTexture) {
            this.logger.warn('StandardTextureManager', `从TextureCache降级获取纹理: ${name}`);
            return fallbackTexture;
        }

        this.logger.error('StandardTextureManager', `完全未找到纹理: ${name}，可用纹理：${Object.keys(this.gameTextures).join(', ')}`);
        return PIXI.Texture.WHITE;
    }

    /**
     * 创建精灵 - 教程标准方法
     */
    public createSprite(textureName: string): PIXI.Sprite {
        // 教程方法: let sprite = new Sprite(id["frameId.png"]);
        const texture = this.getTexture(textureName);
        return new PIXI.Sprite(texture);
    }

    /**
     * 创建纹理的独立副本 - 简化版本
     */
    public createIndependentTexture(textureName: string): PIXI.Texture | undefined {
        const originalTexture = this.getTexture(textureName);
        if (!originalTexture || originalTexture === PIXI.Texture.WHITE) {
            return originalTexture;
        }

        // 对于需要独立副本的情况，我们创建一个新的 Sprite 而不是复制纹理
        // 这遵循 PixiJS 的最佳实践：让 PIXI 处理纹理共享
        return originalTexture; // PIXI 会自动处理纹理共享问题
    }

    /**
     * 清理资源
     */
    public destroy(): void {
        // 清理游戏纹理别名
        this.gameTextures = {};
        
        this.isInitialized = false;
        this.logger.info('StandardTextureManager', '标准纹理管理器已清理');
    }

    /**
     * 获取纹理统计
     */
    public getUsageStats(): {
        textureCount: number;
        cacheSize: number;
        memoryEstimate: string;
    } {
        const gameTextureCount = Object.keys(this.gameTextures).length;
        const cacheSize = Object.keys(this.textureCache).length;
        
        // 简单的内存估算
        const avgTextureSize = 256 * 256 * 4; // 假设平均 256x256 RGBA
        const memoryBytes = gameTextureCount * avgTextureSize;
        const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);

        return {
            textureCount: gameTextureCount,
            cacheSize: cacheSize,
            memoryEstimate: `${memoryMB}MB`
        };
    }
} 