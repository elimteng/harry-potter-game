import * as Phaser from 'phaser';
import { PlayerCharacter } from '../../entities/Player';
import { EventBus } from '../EventBus';
import { Logger } from '../../utils/Logger';
import { PlayerSprite } from '../sprites/PlayerSprite';
import { EnemySprite } from '../sprites/EnemySprite';
import { SpellSprite } from '../sprites/SpellSprite';
import { FoodSprite } from '../sprites/FoodSprite';

export enum GameState {
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over'
}

export enum EnemyType {
    DEMENTOR = 'dementor',
    DEATH_EATER = 'death_eater',
    LUCIUS = 'lucius',
    BELLATRIX = 'bellatrix',
    TROLL = 'troll'
}

export enum SpellType {
    EXPELLIARMUS = 'expelliarmus',
    STUPEFY = 'stupefy',
    WINGARDIUM = 'wingardium',
    PATRONUS = 'patronus',
    AVADA = 'avada',
    ULTIMATE_ORB = 'ultimate_orb'
}

export enum FoodType {
    CHOCOLATE_FROG = 'chocolate_frog',
    BUTTERBEER = 'butterbeer',
    CHICKEN = 'chicken',
    RON_MODE = 'ron_mode'
}

export class MainScene extends Phaser.Scene {
    private gameState: GameState = GameState.MENU;
    private player: PlayerSprite | null = null;
    private enemies: EnemySprite[] = [];
    private playerSpells: SpellSprite[] = [];
    private enemySpells: SpellSprite[] = [];
    private foods: FoodSprite[] = [];
    
    private score: number = 0;
    private selectedCharacter: PlayerCharacter = PlayerCharacter.HARRY;
    
    // 游戏控制
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private spaceKey: Phaser.Input.Keyboard.Key | null = null;
    private pKey: Phaser.Input.Keyboard.Key | null = null;
    private key1: Phaser.Input.Keyboard.Key | null = null;
    private key2: Phaser.Input.Keyboard.Key | null = null;
    private key3: Phaser.Input.Keyboard.Key | null = null;
    
    // 敌人生成
    private enemySpawnTimer: number = 0;
    private enemySpawnInterval: number = 5000; // 5秒，以毫秒为单位
    private lastTrollSpawnTime: number = 0;
    private lastDementorSpawnTime: number = 0;
    private lastLuciusSpawnTime: number = 0;
    private lastBellatrixSpawnTime: number = 0;
    private readonly TROLL_SPAWN_INTERVAL: number = 60000; // 60秒
    private readonly DEMENTOR_SPAWN_INTERVAL: number = 80000; // 80秒
    private readonly LUCIUS_SPAWN_INTERVAL: number = 100000; // 100秒
    private readonly BELLATRIX_SPAWN_INTERVAL: number = 120000; // 120秒
    
    // 食物生成
    private foodSpawnTimer: number = 0;
    private currentFoodSpawnInterval: number = 20000; // 20秒
    
    // 游戏状态
    private dementorActive: boolean = false;
    private characterSwitchCooldown: number = 0;
    private readonly CHARACTER_SWITCH_COOLDOWN_TIME: number = 15000; // 15秒
    private trollActive: boolean = false;
    private trollShakeTimer: number = 0;
    private readonly TROLL_SHAKE_INTERVAL: number = 5000; // 5秒
    
    // 背景音乐
    private backgroundMusic: Phaser.Sound.BaseSound | null = null;
    
    private logger: Logger;

    constructor() {
        super({ key: 'MainScene' });
        this.logger = Logger.getInstance();
    }

    preload() {
        // 设置资源加载路径
        this.load.setBaseURL('');

        // 加载玩家角色纹理
        this.load.image('harry_normal', '/images/harry.png');
        this.load.image('harry_attack', '/images/harry_attack.png');
        this.load.image('ron_normal', '/images/ron.png');
        this.load.image('ron_attack', '/images/ron_attack.png');
        this.load.image('hermione_normal', '/images/hermione.png');
        this.load.image('hermione_attack', '/images/hermione_attack.png');

        // 加载敌人纹理
        this.load.image('death_eater_1', '/images/Death_Eater_1.png');
        this.load.image('death_eater_2', '/images/Death_Eater_2.png');
        this.load.image('death_eater_3', '/images/Death_Eater_3.png');
        this.load.image('lucius', '/images/Lucius.png');
        this.load.image('bellatrix', '/images/Bellat.png');
        this.load.image('dementor', '/images/Dementor.png');
        this.load.image('troll', '/images/troll.png');
        this.load.image('troll_defeat', '/images/troll_defeat.png');
        this.load.image('troll_weapon', '/images/troll_weapon.png');

        // 加载咒语纹理
        this.load.image('spell_attack', '/images/attack_effect.png');
        this.load.image('spell_attack_2', '/images/attack_effect_2.png');
        this.load.image('patronus', '/images/Patronus.png');
        this.load.image('ultimate_skill', '/images/utskill.png');

        // 加载食物纹理
        this.load.image('chocolate_frog', '/images/Chocolate Frog.png');
        this.load.image('butterbeer', '/images/butterbeer.png');
        this.load.image('chicken', '/images/chicken.png');
        this.load.image('ron_mode', '/images/ron-mode.png');

        // 加载背景
        this.load.image('background', '/images/background.png');

        // 加载音频
        this.load.audio('background_music', ['/sound/background.mp3']);
        this.load.audio('bellatrix_sound', ['/sound/bellatrix.mp3']);
        this.load.audio('dementor_sound', ['/sound/Dementor Soul.mp3']);
        this.load.audio('troll_sound', ['/sound/troll_roar.mp3']);
        this.load.audio('stupefy_sound', ['/sound/Stupefy.mp3']);
        this.load.audio('wingardium_sound', ['/sound/Wingardium Leviosa.MP3']);
        this.load.audio('patronus_sound', ['/sound/Patronum.mp3']);
    }

    create() {
        // 创建背景
        this.createBackground();

        // 设置输入控制
        this.setupInput();

        // 设置事件监听
        this.setupEventListeners();

        // 初始化游戏状态
        this.gameState = GameState.MENU;

        // 尝试加载背景音乐（如果失败则忽略）
        try {
            this.backgroundMusic = this.sound.add('background_music', { 
                loop: true, 
                volume: 0.3 
            });
        } catch (error) {
            console.warn('背景音乐加载失败:', error);
        }

        this.logger.info('MainScene', 'Phaser场景初始化完成');
    }

    private createBackground() {
        // 尝试使用背景图片
        const bg = this.add.image(0, 0, 'background');
        if (bg.texture.key !== '__MISSING') {
            // 缩放背景以适应屏幕
            const scaleX = this.cameras.main.width / bg.width;
            const scaleY = this.cameras.main.height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            
            bg.setOrigin(0, 0);
            bg.setScale(scale);
            this.logger.info('MainScene', '使用背景图片创建背景');
        } else {
            // 如果背景图片加载失败，创建纯色背景
            this.cameras.main.setBackgroundColor('#001122');
            this.logger.warn('MainScene', '背景图片加载失败，使用纯色背景');
        }
    }

    private setupInput() {
        // 设置键盘输入
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.pKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
            this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
            this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
            this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        }
    }

    private setupEventListeners() {
        // 监听来自React的事件
        EventBus.on('start-game', (data: { character: PlayerCharacter }) => {
            this.startGame(data.character);
        });

        EventBus.on('switch-character', (data: { character: PlayerCharacter }) => {
            this.switchCharacter(data.character);
        });

        EventBus.on('restart-game', () => {
            this.restartGame();
        });
    }

    private startGame(character: PlayerCharacter) {
        this.selectedCharacter = character;
        this.gameState = GameState.PLAYING;
        
        // 创建玩家
        this.createPlayer();
        
        // 播放背景音乐
        if (this.backgroundMusic && !this.backgroundMusic.isPlaying) {
            this.backgroundMusic.play();
        }
        
        this.logger.info('MainScene', `游戏开始，选择角色: ${character}`);
    }

    private createPlayer() {
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height - 50;
        
        this.player = new PlayerSprite(
            this, 
            x, 
            y, 
            this.selectedCharacter,
            `${this.selectedCharacter}_normal`,
            `${this.selectedCharacter}_attack`
        );
    }

    private switchCharacter(character: PlayerCharacter) {
        if (this.characterSwitchCooldown > 0) {
            this.logger.info('MainScene', `角色切换冷却中: ${this.characterSwitchCooldown}ms`);
            return;
        }

        this.selectedCharacter = character;
        this.characterSwitchCooldown = this.CHARACTER_SWITCH_COOLDOWN_TIME;

        if (this.player) {
            this.player.setCharacter(
                character,
                `${character}_normal`,
                `${character}_attack`
            );
        }

        // 通知React层
        EventBus.emit('character-switched', {
            character: character,
            cooldownTime: this.CHARACTER_SWITCH_COOLDOWN_TIME / 1000
        });

        this.logger.info('MainScene', `切换角色: ${character}`);
    }

    private restartGame() {
        // 清理所有游戏对象
        this.clearGameObjects();
        
        // 重置游戏状态
        this.score = 0;
        this.enemySpawnInterval = 5000;
        this.enemySpawnTimer = 0;
        this.foodSpawnTimer = 0;
        this.lastTrollSpawnTime = 0;
        this.lastDementorSpawnTime = 0;
        this.lastLuciusSpawnTime = 0;
        this.lastBellatrixSpawnTime = 0;
        this.dementorActive = false;
        this.characterSwitchCooldown = 0;
        this.trollActive = false;
        this.trollShakeTimer = 0;
        
        // 切换到菜单状态
        this.gameState = GameState.MENU;
        
        // 停止背景音乐
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }
        
        // 通知React层
        EventBus.emit('score-updated', 0);
        EventBus.emit('lives-updated', 5);
        EventBus.emit('ultimate-charges-updated', 0);
        EventBus.emit('dementor-defeated');
        
        this.logger.info('MainScene', '游戏重启');
    }

    private clearGameObjects() {
        // 清理玩家
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        
        // 清理敌人
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        
        // 清理咒语
        this.playerSpells.forEach(spell => spell.destroy());
        this.playerSpells = [];
        this.enemySpells.forEach(spell => spell.destroy());
        this.enemySpells = [];
        
        // 清理食物
        this.foods.forEach(food => food.destroy());
        this.foods = [];
    }

    private spawnEnemy() {
        const currentTime = this.time.now;
        
        // 检查是否有BOSS在场
        const hasBossOnField = this.score < 10000 && this.enemies.some(enemy => 
            enemy.getEnemyType() === EnemyType.BELLATRIX ||
            enemy.getEnemyType() === EnemyType.LUCIUS ||
            enemy.getEnemyType() === EnemyType.DEMENTOR ||
            enemy.getEnemyType() === EnemyType.TROLL
        );
        
        let shouldSpawnBoss = false;
        let bossType: EnemyType = EnemyType.DEATH_EATER;
        
        if (!hasBossOnField) {
            if (this.score >= 8000 && currentTime - this.lastBellatrixSpawnTime >= this.BELLATRIX_SPAWN_INTERVAL) {
                shouldSpawnBoss = true;
                bossType = EnemyType.BELLATRIX;
                this.lastBellatrixSpawnTime = currentTime;
            } else if (this.score >= 5000 && currentTime - this.lastLuciusSpawnTime >= this.LUCIUS_SPAWN_INTERVAL) {
                shouldSpawnBoss = true;
                bossType = EnemyType.LUCIUS;
                this.lastLuciusSpawnTime = currentTime;
            } else if (this.score >= 2500 && currentTime - this.lastDementorSpawnTime >= this.DEMENTOR_SPAWN_INTERVAL) {
                shouldSpawnBoss = true;
                bossType = EnemyType.DEMENTOR;
                this.lastDementorSpawnTime = currentTime;
            } else if (this.score >= 1500 && currentTime - this.lastTrollSpawnTime >= this.TROLL_SPAWN_INTERVAL) {
                shouldSpawnBoss = true;
                bossType = EnemyType.TROLL;
                this.lastTrollSpawnTime = currentTime;
            }
        }
        
        let enemyType: EnemyType;
        let textureKey: string;
        let health: number;
        let speed: number;
        
        if (shouldSpawnBoss) {
            enemyType = bossType;
            switch (bossType) {
                case EnemyType.BELLATRIX:
                    textureKey = 'bellatrix';
                    health = 3;
                    speed = 60;
                    break;
                case EnemyType.LUCIUS:
                    textureKey = 'lucius';
                    health = 2;
                    speed = 70;
                    break;
                case EnemyType.DEMENTOR:
                    textureKey = 'dementor';
                    health = 1;
                    speed = 100;
                    this.dementorActive = true;
                    EventBus.emit('dementor-spawned');
                    break;
                case EnemyType.TROLL:
                    textureKey = 'troll';
                    health = 10;
                    speed = 25;
                    this.trollActive = true;
                    break;
                default:
                    textureKey = 'death_eater_1';
                    health = 1;
                    speed = 50;
            }
        } else {
            // 生成普通死亡食徒
            enemyType = EnemyType.DEATH_EATER;
            const variant = Math.floor(Math.random() * 3) + 1;
            textureKey = `death_eater_${variant}`;
            health = 1;
            speed = 50;
        }
        
        // 随机生成位置
        const x = Math.random() * (this.cameras.main.width - 100) + 50;
        const y = -50;
        
        const enemy = new EnemySprite(this, x, y, textureKey, enemyType, health, speed);
        this.enemies.push(enemy);
        
        this.logger.info('MainScene', `生成敌人: ${enemyType} at (${x}, ${y})`);
    }

    private spawnFood() {
        const foodTypes = [FoodType.CHOCOLATE_FROG, FoodType.BUTTERBEER, FoodType.CHICKEN];
        const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        
        let textureKey: string;
        let healAmount: number;
        
        switch (randomType) {
            case FoodType.CHOCOLATE_FROG:
                textureKey = 'chocolate_frog';
                healAmount = 0.5;
                break;
            case FoodType.BUTTERBEER:
                textureKey = 'butterbeer';
                healAmount = 1.0;
                break;
            case FoodType.CHICKEN:
                textureKey = 'chicken';
                healAmount = 1.0;
                break;
            default:
                textureKey = 'chocolate_frog';
                healAmount = 0.5;
        }
        
        const x = Math.random() * (this.cameras.main.width - 100) + 50;
        const y = -50;
        
        const food = new FoodSprite(this, x, y, textureKey, randomType, healAmount);
        this.foods.push(food);
        
        this.logger.info('MainScene', `生成食物: ${randomType} at (${x}, ${y})`);
    }

    private updateEnemySpawnRate() {
        // 根据分数调整敌人生成速度
        if (this.score < 1000) {
            this.enemySpawnInterval = 5000; // 5秒
        } else if (this.score < 3000) {
            this.enemySpawnInterval = 4000; // 4秒
        } else if (this.score < 5000) {
            this.enemySpawnInterval = 3000; // 3秒
        } else {
            this.enemySpawnInterval = 2000; // 2秒
        }
    }

    update(time: number, delta: number) {
        if (this.gameState !== GameState.PLAYING) {
            return;
        }

        // 更新角色切换冷却
        if (this.characterSwitchCooldown > 0) {
            this.characterSwitchCooldown -= delta;
            if (this.characterSwitchCooldown <= 0) {
                this.characterSwitchCooldown = 0;
            }
        }

        // 处理输入
        this.handleInput();

        // 更新玩家
        if (this.player) {
            this.player.update(delta);
        }

        // 更新敌人
        this.updateEnemies(delta);

        // 更新咒语
        this.updateSpells(delta);

        // 更新食物
        this.updateFoods(delta);

        // 生成敌人
        this.enemySpawnTimer += delta;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
            this.updateEnemySpawnRate();
        }

        // 生成食物
        this.foodSpawnTimer += delta;
        if (this.foodSpawnTimer >= this.currentFoodSpawnInterval) {
            this.spawnFood();
            this.foodSpawnTimer = 0;
            // 设置下次食物生成时间 (15-30秒)
            this.currentFoodSpawnInterval = 15000 + Math.random() * 15000;
        }

        // Troll震动效果
        if (this.trollActive) {
            this.trollShakeTimer += delta;
            if (this.trollShakeTimer >= this.TROLL_SHAKE_INTERVAL) {
                this.createScreenShake();
                this.trollShakeTimer = 0;
                
                // 玩家扣血
                if (this.player) {
                    this.player.takeDamage(0.25);
                }
            }
        }

        // 检测碰撞
        this.checkCollisions();
    }

    private handleInput() {
        if (!this.player || !this.cursors) return;

        // 移动控制
        if (this.cursors.left.isDown) {
            this.player.moveLeft();
        } else if (this.cursors.right.isDown) {
            this.player.moveRight();
        } else {
            this.player.stopMovement();
        }

        // 攻击
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey!)) {
            this.playerAttack();
        }

        // 特殊技能
        if (Phaser.Input.Keyboard.JustDown(this.pKey!)) {
            this.handleStupefyAttack();
        }

        // 角色切换
        if (Phaser.Input.Keyboard.JustDown(this.key1!)) {
            this.switchCharacter(PlayerCharacter.HARRY);
        } else if (Phaser.Input.Keyboard.JustDown(this.key2!)) {
            this.switchCharacter(PlayerCharacter.HERMIONE);
        } else if (Phaser.Input.Keyboard.JustDown(this.key3!)) {
            this.switchCharacter(PlayerCharacter.RON);
        }
    }

    private playerAttack() {
        if (!this.player || !this.player.canAttack()) return;

        this.player.attack();

        const spellX = this.player.x;
        const spellY = this.player.y - 50;

        const spell = new SpellSprite(
            this,
            spellX,
            spellY,
            'spell_attack',
            SpellType.EXPELLIARMUS,
            0,
            -500,
            1,
            'player'
        );

        this.playerSpells.push(spell);
    }

    private handleStupefyAttack() {
        if (!this.player || this.selectedCharacter !== PlayerCharacter.HERMIONE) return;
        if (!this.player.canUseStupefy()) return;

        this.player.useStupefy();

        // 创建全屏闪光效果
        this.createStupefyEffect();

        // 眩晕所有敌人
        this.enemies.forEach(enemy => {
            enemy.stupefy(10000); // 10秒眩晕
        });
    }

    private createStupefyEffect() {
        const flash = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0xFFFFFF,
            0.8
        );

        // 闪光动画
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    private createScreenShake() {
        this.cameras.main.shake(500, 0.01);
    }

    private updateEnemies(delta: number) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta);

            // 检查敌人是否超出屏幕
            if (enemy.y > this.cameras.main.height + 100) {
                enemy.destroy();
                this.enemies.splice(i, 1);
                continue;
            }

            // 敌人攻击
            if (enemy.canAttack() && this.player) {
                const enemySpell = enemy.attack(this.player);
                if (enemySpell) {
                    this.enemySpells.push(enemySpell);
                }
            }
        }
    }

    private updateSpells(delta: number) {
        // 更新玩家咒语
        for (let i = this.playerSpells.length - 1; i >= 0; i--) {
            const spell = this.playerSpells[i];
            spell.update(delta);

            if (spell.y < -50 || !spell.active) {
                spell.destroy();
                this.playerSpells.splice(i, 1);
            }
        }

        // 更新敌人咒语
        for (let i = this.enemySpells.length - 1; i >= 0; i--) {
            const spell = this.enemySpells[i];
            spell.update(delta);

            if (spell.y > this.cameras.main.height + 50 || !spell.active) {
                spell.destroy();
                this.enemySpells.splice(i, 1);
            }
        }
    }

    private updateFoods(delta: number) {
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            food.update(delta);

            // 检查食物是否超出屏幕或过期
            if (food.y > this.cameras.main.height + 100 || !food.active) {
                food.destroy();
                this.foods.splice(i, 1);
            }
        }
    }

    private checkCollisions() {
        if (!this.player) return;

        // 玩家咒语 vs 敌人
        for (let i = this.playerSpells.length - 1; i >= 0; i--) {
            const spell = this.playerSpells[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.physics.overlap(spell, enemy)) {
                    const defeated = enemy.takeDamage(spell.getDamage());
                    spell.hit();
                    
                    if (defeated) {
                        this.handleEnemyDefeated(enemy, j);
                    }
                    
                    spell.destroy();
                    this.playerSpells.splice(i, 1);
                    break;
                }
            }
        }

        // 敌人咒语 vs 玩家
        for (let i = this.enemySpells.length - 1; i >= 0; i--) {
            const spell = this.enemySpells[i];
            
            if (this.physics.overlap(spell, this.player)) {
                this.player.takeDamage(spell.getDamage());
                spell.destroy();
                this.enemySpells.splice(i, 1);
                
                // 检查游戏是否结束
                if (this.player.getLives() <= 0) {
                    this.gameOver();
                }
            }
        }

        // 玩家 vs 敌人
        this.enemies.forEach((enemy, index) => {
            if (this.physics.overlap(this.player!, enemy)) {
                if (enemy.getEnemyType() !== EnemyType.DEMENTOR) {
                    this.player!.takeDamage(1);
                    this.handleEnemyDefeated(enemy, index);
                    
                    if (this.player!.getLives() <= 0) {
                        this.gameOver();
                    }
                }
            }
        });

        // 玩家 vs 食物
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            
            if (this.physics.overlap(this.player, food)) {
                // 创建收集特效
                food.createCollectEffect();
                
                // 根据食物类型处理效果
                if (food.getFoodType() === FoodType.RON_MODE) {
                    this.player.activateRonMode();
                } else {
                    this.player.heal(food.getHealAmount());
                }
                
                food.destroy();
                this.foods.splice(i, 1);
            }
        }
    }

    private handleEnemyDefeated(enemy: EnemySprite, index: number) {
        const enemyType = enemy.getEnemyType();
        
        // 特殊敌人处理
        if (enemyType === EnemyType.DEMENTOR) {
            this.dementorActive = false;
            EventBus.emit('dementor-defeated');
        } else if (enemyType === EnemyType.TROLL) {
            this.trollActive = false;
        }
        
        // 增加分数
        this.addScore(enemy.getScoreValue());
        
        // 可能给玩家增加终极技能点数
        if (Math.random() < 0.1) { // 10%概率
            this.player?.addUltimateSkillCharge();
        }
        
        // 移除敌人
        enemy.destroy();
        this.enemies.splice(index, 1);
    }

    private addScore(points: number) {
        this.score += points;
        EventBus.emit('score-updated', this.score);
    }

    private gameOver() {
        this.gameState = GameState.GAME_OVER;
        
        // 停止背景音乐
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }
        
        // 通知React层
        EventBus.emit('game-over', { score: this.score });
        
        this.logger.info('MainScene', `游戏结束，最终分数: ${this.score}`);
    }
} 