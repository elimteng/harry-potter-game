import * as Phaser from 'phaser';
import planck, { World as B2World, Vec2 as B2Vec2, Body as B2Body } from 'planck-js';
import { PlayerCharacter } from '../../entities/Player';
import { EventBus } from '../EventBus';
import { Logger } from '../../utils/Logger';

export enum GameState {
    MENU = 'menu',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over'
}

export class SimpleMainScene extends Phaser.Scene {
    private gameState: GameState = GameState.MENU;
    private player: Phaser.Physics.Arcade.Sprite | null = null;
    private enemies: Phaser.Physics.Arcade.Sprite[] = [];
    private playerBullets: Phaser.Physics.Arcade.Sprite[] = [];
    private enemyBullets: Phaser.Physics.Arcade.Sprite[] = [];
    
    private score: number = 0;
    private lives: number = 5;
    private selectedCharacter: PlayerCharacter = PlayerCharacter.HARRY;
    
    // game control
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    private wasdKeys: { up: Phaser.Input.Keyboard.Key, down: Phaser.Input.Keyboard.Key, left: Phaser.Input.Keyboard.Key, right: Phaser.Input.Keyboard.Key } | null = null;
    private spaceKey: Phaser.Input.Keyboard.Key | null = null;
    
    // spawn timer
    private enemySpawnTimer: number = 0;
    private enemySpawnInterval: number = 4000; // initial 4 seconds interval
    private damageCooldown: number = 0; // damage cooldown (milliseconds)
    private gameTime: number = 0; // game running time (milliseconds)
    
    // audio
    private backgroundMusic: Phaser.Sound.BaseSound | null = null;
    
    // dementor sound
    private dementorSound: Phaser.Sound.BaseSound | null = null;
    private dementorSoundPlaying: boolean = false;
    private trollSound: Phaser.Sound.BaseSound | null = null;
    private trollSoundPlaying: boolean = false;
    private bellatrixSound: Phaser.Sound.BaseSound | null = null;
    private bellatrixSoundPlaying: boolean = false;
    
    // special enemies and skills
    private dementors: Phaser.Physics.Arcade.Sprite[] = []; // dementor array
    private patronusSpells: Phaser.Physics.Arcade.Sprite[] = []; // patronus spell array
    private dementorSpawnTimer: number = 0;
    private dementorSpawnInterval: number = 90000; // 90 seconds to spawn a dementor, reduce frequency
    private patronusCooldown: number = 0; // patronus spell cooldown (milliseconds)
    private stupefiCooldown: number = 0; // stupefy spell cooldown (milliseconds)
    private wingardiumCooldown: number = 0; // wingardium leviosa spell cooldown (milliseconds)
    private characterSwitchCooldown: number = 0; // character switch cooldown (milliseconds)
    private ronModeActive: boolean = false; // ron mode active
    private ronModeTimer: number = 0; // ron mode remaining time (milliseconds)
    private mana: number = 30; // current mana
    private maxMana: number = 30; // max mana
    private manaRegenRate: number = 0.5; // mana regeneration rate (per second)
    private manaRegenTimer: number = 0; // mana regeneration timer
    
    // game difficulty and progress
    private difficultyLevel: number = 1;
    private bossSpawnTimer: number = 0;
    private bossSpawnInterval: number = 45000; // BOSS spawn interval, can be adjusted dynamically
    private bosses: Phaser.Physics.Arcade.Sprite[] = []; // BOSS array
    
    // more enemy types
    private luciusEnemies: Phaser.Physics.Arcade.Sprite[] = [];
    private bellatrixEnemies: Phaser.Physics.Arcade.Sprite[] = [];
    private trolls: Phaser.Physics.Arcade.Sprite[] = [];
    
    // special skills and effects
    private screenShakeIntensity: number = 0;
    private invulnerabilityTime: number = 0; // invulnerability time
    private readonly INVULNERABILITY_DURATION: number = 1500; // 1.5 seconds invulnerability
    
    // game statistics
    private enemiesKilled: number = 0;
    private dementorsKilled: number = 0;
    private bossesKilled: number = 0;
    
    // food system
    private foods: Phaser.Physics.Arcade.Sprite[] = [];
    private floatingWeapons: Phaser.Physics.Arcade.Sprite[] = []; // floating weapon array
    private foodSpawnTimer: number = 0;
    private currentFoodSpawnInterval: number = 0;
    private readonly FOOD_SPAWN_MIN_INTERVAL: number = 15000; // 15 seconds
    private readonly FOOD_SPAWN_MAX_INTERVAL: number = 30000; // 30 seconds
    
    private logger: Logger;
    
    // 背景滚动相关
    private backgroundTiles: Phaser.GameObjects.TileSprite[] = [];
    private backgroundSpeed: number = 50; // 背景滚动速度（像素/秒）

    // === Box2D/planck 仅用于食物物理 ===
    private b2World: B2World | null = null;
    private b2Accumulator: number = 0; // 毫秒
    private readonly B2_FIXED_TIMESTEP: number = 1000 / 60; // ms
    private readonly PPM: number = 30; // 像素/米

    private enemyBodies: Map<Phaser.GameObjects.Sprite, B2Body> = new Map();

    constructor() {
        super({ key: 'SimpleMainScene' });
        this.logger = Logger.getInstance();
    }

    /**
     * 初始化仅用于食物/敌人的轻量 planck 世界
     */
    private initPlanckWorld() {
        if (this.b2World) return;
        this.b2World = new planck.World(new B2Vec2(0, 10)); // 降低重力为 10 m/s^2，减缓下落

        // 碰撞监听（可根据需要扩展）
        this.b2World.on('begin-contact', (contact: any) => {
            // 这里不做复杂逻辑，主要依靠 restitution 弹性即可
        });
    }

    /**
     * 同步敌人到 Box2D 代理刚体（kinematic）
     */
    private syncEnemyBodies() {
        if (!this.b2World) return;
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;
            let body = this.enemyBodies.get(enemy);
            const pos = new B2Vec2(enemy.x / this.PPM, enemy.y / this.PPM);
            const halfW = Math.max(8, enemy.displayWidth * 0.5) / this.PPM;
            const halfH = Math.max(8, enemy.displayHeight * 0.5) / this.PPM;
            if (!body) {
                body = this.b2World.createBody({ type: 'kinematic', position: pos, fixedRotation: true });
                body.createFixture({
                    shape: planck.Box(halfW, halfH),
                    density: 1,
                    friction: 0.4,
                    restitution: 0.6
                });
                this.enemyBodies.set(enemy, body);
            } else {
                body.setTransform(pos, 0);
            }
        }
    }

    /**
     * 步进 planck 世界并同步食物精灵位置
     */
    private stepPlanckAndSync(deltaMs: number) {
        if (!this.b2World) return;

        // 累积固定步长
        this.b2Accumulator += deltaMs;

        // 敌人代理刚体始终与精灵同步
        this.syncEnemyBodies();

        while (this.b2Accumulator >= this.B2_FIXED_TIMESTEP) {
            this.b2World.step(this.B2_FIXED_TIMESTEP / 1000);
            this.b2Accumulator -= this.B2_FIXED_TIMESTEP;
        }


    }

    preload() {
        // load game resources - correct file path and case
        
        // background
        this.load.image('background', 'images/background.png');
        
        // character texture  
        this.load.image('harry', 'images/harry.png');
        this.load.image('hermione', 'images/hermione.png');
        this.load.image('ron', 'images/ron.png');
        
        // attack animation texture
        this.load.image('harry_attack', 'images/harry_attack.png');
        this.load.image('hermione_attack', 'images/hermione_attack.png');
        this.load.image('ron_attack', 'images/ron_attack.png');
        
        // enemy texture
        this.load.image('death_eater_1', 'images/Death_Eater_1.png');
        this.load.image('death_eater_2', 'images/Death_Eater_2.png');
        this.load.image('death_eater_3', 'images/Death_Eater_3.png');
        this.load.image('bellatrix', 'images/Bellat.png');
        this.load.image('lucius', 'images/Lucius.png');
        this.load.image('dementor', 'images/Dementor.png');
        this.load.image('troll', 'images/troll.png');
        
        // spell texture
        this.load.image('stupefy', 'images/Stupefy.png');
        this.load.image('patronus', 'images/Patronus.png');
        this.load.image('wingardium_leviosa', 'images/Wingardium Leviosa.png');
        
        // food texture
        this.load.image('chocolate_frog', 'images/Chocolate Frog.png');
        this.load.image('butterbeer', 'images/butterbeer.png');
        this.load.image('chicken', 'images/chicken.png');
        
        // special texture
        this.load.image('ron_mode', 'images/ron-mode.png');
        this.load.image('troll_weapon', 'images/troll_weapon.png');
        this.load.image('troll_defeat', 'images/troll_defeat.png');
        
        // attack effect
        this.load.image('attack1', 'images/attack1.png');
        this.load.image('attack2', 'images/attack2.png');
        this.load.image('attack3', 'images/attack3.png');
        
        // background music
        this.load.audio('background-music', 'sound/background.mp3');
        
        // skill sound
        this.load.audio('patronus-sound', 'sound/Patronum.mp3');
        this.load.audio('stupefy-sound', 'sound/Stupefy.mp3');
        this.load.audio('wingardium-sound', 'sound/Wingardium Leviosa.MP3');
        
        // dementor sound
        this.load.audio('dementor-sound', 'sound/Dementor Soul.mp3');
        
        // troll sound
        this.load.audio('troll-roar', 'sound/troll_roar.mp3');
        
        // bellatrix sound
        this.load.audio('bellatrix-sound', 'sound/bellatrix.mp3');
        
        // normal attack sound
        this.load.audio('magic-spells', 'sound/Magic Spells.mp3');
        
        // add load event listener
        this.load.on('complete', () => {
            this.logger.info('SimpleMainScene', 'all resources loaded');
            
            // create attack animation after resources loaded
            this.createAttackAnimations();
        });
        
        this.load.on('filecomplete', (key: string) => {
        });
        
        this.load.on('loaderror', (file: any) => {
            this.logger.error('SimpleMainScene', `resource load failed: ${file.src}`);
        });
        
    }

    create() {
        
        // wait for one frame to ensure the canvas size is set correctly
        this.time.delayedCall(16, () => {
            this.initializeGame();
        });
    }
    
    private createAttackAnimations() {
        
        try {
            // check if all attack frames exist
            const hasAttack1 = this.textures.exists('attack1');
            const hasAttack2 = this.textures.exists('attack2');
            const hasAttack3 = this.textures.exists('attack3');
            
            
            if (hasAttack1 && hasAttack2 && hasAttack3) {
                // create bullet attack animation (loop play)
                this.anims.create({
                    key: 'attack-animation',
                    frames: [
                        { key: 'attack1' },
                        { key: 'attack2' },
                        { key: 'attack3' }
                    ],
                    frameRate: 15, // 15 frames per second, slightly faster
                    repeat: -1, // infinite loop, suitable for bullet continuous flight
                    showOnStart: true,
                    hideOnComplete: false
                });
                

                
                this.logger.info('SimpleMainScene', 'attack animation created successfully');
            } else {
                // attack frame image missing, skip animation creation
            }
        } catch (error) {
            this.logger.error('SimpleMainScene', 'create attack animation failed:', error);
        }
    }

    private initializeGame() {
        
        // if the canvas size is still 0, use window size
        const gameWidth = this.cameras.main.width || window.innerWidth;
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        
        // adjust camera view
        this.cameras.main.setViewport(0, 0, gameWidth, gameHeight);
        
        // enable physics system（Arcade 继续用于非食物对象）
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        // 初始化 planck 世界（重力向下）
        this.initPlanckWorld();
        
        // create fallback textures (prevent image load failure)
        this.createFallbackTextures();
        
        // create background
        this.createBackground();

        // set input control
        this.setupInput();

        // set event listener
        this.setupEventListeners();

        // initialize game state
        this.gameState = GameState.MENU;

        this.logger.info('SimpleMainScene', 'Phaser scene initialized, using real game images');
    }

    private createFallbackTextures() {
        // create simple fallback textures, prevent image load failure
        const graphics = this.add.graphics();
        
        // check if the player texture needs to be created
        if (!this.textures.exists('harry')) {
            graphics.fillStyle(0x00FF00);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture('harry', 32, 32);
            graphics.clear();
        }
        
        if (!this.textures.exists('hermione')) {
            graphics.fillStyle(0xFF69B4);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture('hermione', 32, 32);
            graphics.clear();
        }
        
        if (!this.textures.exists('ron')) {
            graphics.fillStyle(0xFFA500);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture('ron', 32, 32);
            graphics.clear();
        }
        
        // check if the enemy texture needs to be created
        if (!this.textures.exists('death_eater_1')) {
            graphics.fillStyle(0xFF0000);
            graphics.fillRect(0, 0, 24, 24);
            graphics.generateTexture('death_eater_1', 24, 24);
            graphics.generateTexture('death_eater_2', 24, 24);
            graphics.generateTexture('death_eater_3', 24, 24);
            graphics.clear();
        }
        
        // check if the spell texture needs to be created
        if (!this.textures.exists('stupefy')) {
            graphics.fillStyle(0xFFFF00);
            graphics.fillRect(0, 0, 8, 8);
            graphics.generateTexture('stupefy', 8, 8);
            graphics.generateTexture('wingardium_leviosa', 8, 8);
            graphics.clear();
        }
        
        // check if the background texture needs to be created
        if (!this.textures.exists('background')) {
            graphics.fillStyle(0x001122);
            graphics.fillRect(0, 0, 800, 600);
            graphics.generateTexture('background', 800, 600);
            graphics.clear();
        }
        
        // create enemy attack light texture
        this.createEnemyProjectileTexture(graphics);
        
        // check if the patronus texture needs to be created
        if (!this.textures.exists('patronus')) {
            graphics.clear();
            // create silver blue patronus texture
            graphics.fillStyle(0x87CEEB, 1.0); // sky blue
            graphics.fillCircle(16, 16, 12); // outer circle
            graphics.fillStyle(0xE0F6FF, 0.8); // light blue inner circle
            graphics.fillCircle(16, 16, 8);
            graphics.fillStyle(0xFFFFFF, 0.6); // white center
            graphics.fillCircle(16, 16, 4);
            graphics.generateTexture('patronus', 32, 32);
            graphics.clear();
        } else {
        }
        
        graphics.destroy();
        this.logger.info('SimpleMainScene', 'fallback textures created');
    }

    private createEnemyProjectileTexture(graphics: Phaser.GameObjects.Graphics) {
        // create green glow light texture
        const size = 16; // light size
        
        // clear previous drawing
        graphics.clear();
        
        // draw outer glow (large, semi-transparent)
        graphics.fillStyle(0x00FF00, 0.3); // green glow, 30% transparent
        graphics.fillCircle(size / 2, size / 2, size / 2);
        
        // draw middle layer light ring (medium size, more opaque)
        graphics.fillStyle(0x00FF00, 0.6); // green glow, 60% transparent
        graphics.fillCircle(size / 2, size / 2, size / 3);
        
        // draw inner core (small, fully opaque)
        graphics.fillStyle(0x00FF00, 1.0); // green glow, 100% opaque
        graphics.fillCircle(size / 2, size / 2, size / 6);
        
        // add some flickering effect points
        graphics.fillStyle(0xFFFFFF, 0.8); // white flickering effect points
        graphics.fillCircle(size / 2 + 2, size / 2 - 1, 1);
        graphics.fillCircle(size / 2 - 1, size / 2 + 2, 1);
        
        // generate texture
        graphics.generateTexture('enemy_projectile', size, size);
        
        this.logger.info('SimpleMainScene', 'enemy attack light texture created');
    }

    private createBackground() {
        
        // get current game size
        const gameWidth = this.cameras.main.width || window.innerWidth;
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        // 直接使用无缝背景，避免接缝问题
        this.createSeamlessBackground(gameWidth, gameHeight);
    }
    
    private updateBackground(delta: number) {
        // 根据游戏状态调整背景速度
        let currentSpeed = this.backgroundSpeed;
        
        // 根据分数增加背景速度，增加紧张感
        if (this.score > 1000) {
            currentSpeed += 5;
        }
        if (this.score > 3000) {
            currentSpeed += 10;
        }
        if (this.score > 5000) {
            currentSpeed += 15;
        }
        
        // 更新背景滚动
        this.backgroundTiles.forEach(tile => {
            if (tile instanceof Phaser.GameObjects.TileSprite) {
                // 向上滚动背景（tilePositionY 减小）
                const scrollAmount = currentSpeed * (delta / 1000);
                tile.tilePositionY -= scrollAmount;
                
                // 每5秒输出一次调试信息
                if (this.time.now % 5000 < delta) {
                    this.logger.info('SimpleMainScene', `背景滚动: 速度=${currentSpeed}, 滚动量=${scrollAmount.toFixed(2)}, 位置Y=${tile.tilePositionY.toFixed(2)}`);
                }
            }
        });
        
        // 如果没有背景瓦片，输出警告
        if (this.backgroundTiles.length === 0) {
            this.logger.warn('SimpleMainScene', '没有背景瓦片可以滚动');
        }
    }
    
    private createSeamlessBackground(gameWidth: number, gameHeight: number) {
        // 创建一个无缝的星空背景
        const graphics = this.add.graphics();
        
        // 创建从深蓝到中蓝的渐变，更亮一些
        graphics.fillGradientStyle(0x1a3a5a, 0x1a3a5a, 0x2d5a7a, 0x2d5a7a, 1);
        graphics.fillRect(0, 0, gameWidth, gameHeight * 2); // 创建两倍高度的背景用于滚动
        
        // 添加星星效果（在更大的区域内）
        graphics.fillStyle(0xFFFFFF, 0.9);
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * gameWidth;
            const y = Math.random() * (gameHeight * 2);
            const size = Math.random() * 2 + 1;
            graphics.fillCircle(x, y, size);
        }
        
        // 将图形转换为纹理
        graphics.generateTexture('seamless_background', gameWidth, gameHeight * 2);
        graphics.destroy();
        
        // 创建可滚动的背景
        const background = this.add.tileSprite(
            gameWidth / 2, 
            gameHeight / 2, 
            gameWidth, 
            gameHeight, 
            'seamless_background'
        );
        
        background.setOrigin(0.5, 0.5);
        background.setDepth(-1);
        
        // 添加到背景数组
        this.backgroundTiles.push(background);
        
        this.logger.info('SimpleMainScene', '创建无缝星空背景成功');
    }
    
    /**
     * 设置背景滚动速度
     */
    public setBackgroundSpeed(speed: number): void {
        this.backgroundSpeed = speed;
        this.logger.info('SimpleMainScene', `背景速度设置为: ${speed}`);
    }
    
    /**
     * 暂停背景滚动
     */
    public pauseBackground(): void {
        this.backgroundSpeed = 0;
        this.logger.info('SimpleMainScene', '背景滚动已暂停');
    }
    
    /**
     * 恢复背景滚动
     */
    public resumeBackground(): void {
        this.backgroundSpeed = 50;
        this.logger.info('SimpleMainScene', '背景滚动已恢复');
    }

    private setupInput() {
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.wasdKeys = {
                up: this.input.keyboard.addKey('W'),
                down: this.input.keyboard.addKey('S'),
                left: this.input.keyboard.addKey('A'),
                right: this.input.keyboard.addKey('D')
            };
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            
            // add P key for character exclusive skill
            this.input.keyboard.addKey('P').on('down', () => {
                this.castSpecialSkill();
            });
            
            // add T key for testing dementor spawn
            this.input.keyboard.addKey('T').on('down', () => {
                this.spawnDementor();
            });
            
            // add B key for testing boss spawn
            this.input.keyboard.addKey('B').on('down', () => {
                this.spawnRandomBoss();
            });
            
            // add K key for testing screen shake
            this.input.keyboard.addKey('K').on('down', () => {
                this.createScreenShake(300, 2);
            });
            
            // add B key for testing background control
            this.input.keyboard.addKey('B').on('down', () => {
                if (this.backgroundSpeed > 0) {
                    this.pauseBackground();
                } else {
                    this.resumeBackground();
                }
            });
            
            // add number key to switch character
            this.input.keyboard.addKey('ONE').on('down', () => {
                this.switchCharacterByKey(PlayerCharacter.HARRY);
            });
            
            this.input.keyboard.addKey('TWO').on('down', () => {
                this.switchCharacterByKey(PlayerCharacter.HERMIONE);
            });
            
            this.input.keyboard.addKey('THREE').on('down', () => {
                this.switchCharacterByKey(PlayerCharacter.RON);
            });
        }
    }

    private setupEventListeners() {
        EventBus.on('start-game', (data: { character: PlayerCharacter }) => {
            this.startGame(data.character);
        });

        EventBus.on('restart-game', () => {
            this.restartGame();
        });

        EventBus.on('switch-character', (data: { character: PlayerCharacter }) => {
            this.switchCharacter(data.character);
        });

        // debug: listen to all life value related events
        EventBus.on('lives-updated', (lives: number) => {
        });
    }

    private startGame(character: PlayerCharacter) {
        this.selectedCharacter = character;
        this.gameState = GameState.PLAYING;
        
        // ensure life value is correctly initialized and notify UI
        this.lives = 5;
        EventBus.emit('lives-updated', this.lives);
        EventBus.emit('score-updated', this.score);
        EventBus.emit('mana-updated', { current: this.mana, max: this.maxMana });
        
        // create player
        this.createPlayer();
        
        // reset game time
        this.gameTime = 0;
        
        // reset boss spawn interval
        this.bossSpawnInterval = 45000;
        this.bossSpawnTimer = 0;
        
        // initialize food spawn interval
        this.setRandomFoodSpawnInterval();
        
        // start playing background music
        this.startBackgroundMusic();
        
        this.logger.info('SimpleMainScene', `游戏开始，选择角色: ${character}, 初始生命: ${this.lives}`);
    }

    private startBackgroundMusic() {
        try {
            // if there is music playing, stop it first
            if (this.backgroundMusic) {
                this.backgroundMusic.stop();
            }
            
            // create and play background music
            this.backgroundMusic = this.sound.add('background-music', {
                loop: true,
                volume: 0.4 // adjust volume, avoid too loud
            });
            
            this.backgroundMusic.play();
            this.logger.info('SimpleMainScene', 'background music started playing');
        } catch (error) {
            this.logger.warn('SimpleMainScene', 'background music play failed:', error);
        }
    }

    private stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
    }

    private updateDifficulty() {
        // adjust difficulty based on game time (every 30 seconds)
        const gameTimeSeconds = this.gameTime / 1000;
        const difficultyLevel = Math.floor(gameTimeSeconds / 30) + 1; // 1-based difficulty level
        
        // enemy spawn interval: from 4 seconds to 1.5 seconds (with minimum)
        const baseInterval = 4000;
        const minInterval = 1500;
        const intervalReduction = Math.min(2500, difficultyLevel * 300); // reduce 300ms for each difficulty level
        this.enemySpawnInterval = Math.max(minInterval, baseInterval - intervalReduction);
        
        // output difficulty information every 60 seconds
        if (gameTimeSeconds > 0 && gameTimeSeconds % 60 < 0.1) {
        }
    }

    private createPlayer() {
        // get current game size
        const gameWidth = this.cameras.main.width || window.innerWidth;
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        const x = gameWidth / 2;
        const y = gameHeight - 100;
        
        
        // use the corresponding texture based on the selected character
        let playerTexture: string;
        switch (this.selectedCharacter) {
            case PlayerCharacter.HARRY:
                playerTexture = 'harry';
                break;
            case PlayerCharacter.HERMIONE:
                playerTexture = 'hermione';
                break;
            case PlayerCharacter.RON:
                playerTexture = 'ron';
                break;
            default:
                playerTexture = 'harry';
        }
        
        
        // create player sprite
        this.player = this.physics.add.sprite(x, y, playerTexture);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.1); // shrink character size
        
        
        // ensure the physics body is correctly set
        if (this.player.body) {
            (this.player.body as Phaser.Physics.Arcade.Body).setSize(
                this.player.width * 0.8, 
                this.player.height * 0.8
            );
        }
        
        // set player depth, ensure in front of other objects
        this.player.setDepth(10);
        
        this.logger.info('SimpleMainScene', `create player: ${this.selectedCharacter} position: (${x}, ${y})`);
    }

    private switchCharacterByKey(character: PlayerCharacter) {
        // only allow keyboard switch character when game is playing
        if (this.gameState !== GameState.PLAYING || !this.player) {
            return;
        }
        
        // check character switch cooldown
        if (this.characterSwitchCooldown > 0) {
            const remainingTime = (this.characterSwitchCooldown / 1000).toFixed(1);
            return;
        }
        
        // if already the current character, no need to switch
        if (this.selectedCharacter === character) {
            return;
        }
        
        
        // set cooldown first
        this.characterSwitchCooldown = 15000;
        
        // call switchCharacter but skip internal cooldown check and cooldown setting
        this.switchCharacterInternal(character);
        
        // notify UI update, including cooldown time
        EventBus.emit('character-switched', { character, cooldownTime: 15 });
    }
    
    private getCharacterName(character: PlayerCharacter): string {
        switch (character) {
            case PlayerCharacter.HARRY:
                return 'Harry Potter';
            case PlayerCharacter.HERMIONE:
                return 'Hermione Granger';
            case PlayerCharacter.RON:
                return 'Ron Weasley';
            default:
                return 'Unknown Character';
        }
    }

    private switchCharacterInternal(character: PlayerCharacter) {
        if (this.gameState !== GameState.PLAYING || !this.player) return;
        
        this.selectedCharacter = character;
        
        // update player texture
        let playerTexture: string;
        switch (character) {
            case PlayerCharacter.HARRY:
                playerTexture = 'harry';
                break;
            case PlayerCharacter.HERMIONE:
                playerTexture = 'hermione';
                break;
            case PlayerCharacter.RON:
                playerTexture = 'ron';
                break;
            default:
                playerTexture = 'harry';
        }
        
        // save current position and speed
        const currentX = this.player.x;
        const currentY = this.player.y;
        const currentVelX = this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0;
        const currentVelY = this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0;
        
        // 销毁旧的玩家精灵
        this.player.destroy();
        
        // 创建新的玩家精灵
        this.player = this.physics.add.sprite(currentX, currentY, playerTexture);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.1); // 统一角色尺寸
        
        // 恢复速度
        if (this.player.body) {
            (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(currentVelX, currentVelY);
        }
        
        this.logger.info('SimpleMainScene', `角色切换到: ${character}`);
    }

    private switchCharacter(character: PlayerCharacter) {
        // 检查角色切换冷却时间
        if (this.characterSwitchCooldown > 0) {
            const remainingTime = (this.characterSwitchCooldown / 1000).toFixed(1);
            return;
        }
        
        // 调用内部切换方法
        this.switchCharacterInternal(character);
        
        // 设置15秒冷却时间
        this.characterSwitchCooldown = 15000;
        
        
        // 通知React层
        EventBus.emit('character-switched', { character, cooldownTime: 15 });
    }

    private restartGame() {
        // 停止背景音乐
        this.stopBackgroundMusic();
        
        // 清理所有游戏对象
        this.clearGameObjects();
        
        // 重置游戏状态
        this.score = 0;
        this.lives = 5;
        this.enemySpawnTimer = 0;
        // this.dementorSpawnTimer = 0; // 摄魂怪不再定时生成
        this.patronusCooldown = 0; // 重置守护神咒冷却时间
        this.stupefiCooldown = 0; // 重置昏昏倒地冷却时间
        this.wingardiumCooldown = 0; // 重置漂浮咒冷却时间
        this.characterSwitchCooldown = 0; // 重置角色切换冷却时间
        this.ronModeActive = false; // 重置罗恩无敌模式
        this.ronModeTimer = 0;
        this.mana = this.maxMana; // 重置魔法值
        this.manaRegenTimer = 0;
        this.gameTime = 0;
        this.enemySpawnInterval = 4000; // 重置为初始间隔
        this.bossSpawnTimer = 0; // 重置BOSS计时器
        this.bossSpawnInterval = 45000; // 重置BOSS生成间隔
        this.foodSpawnTimer = 0; // 重置食物生成计时器
        this.setRandomFoodSpawnInterval(); // 重新设置随机食物生成间隔
        this.gameState = GameState.MENU;
        
        // 通知React层
        EventBus.emit('score-updated', 0);
        EventBus.emit('lives-updated', 5);
        
        this.logger.info('SimpleMainScene', '游戏重启');
    }

    private clearGameObjects() {
        // 清理敌人
        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];

        // 清理子弹
        this.playerBullets.forEach(bullet => bullet.destroy());
        this.playerBullets = [];
        
        this.enemyBullets.forEach(bullet => bullet.destroy());
        this.enemyBullets = [];
        
        // 清理摄魂怪
        this.dementors.forEach(dementor => dementor.destroy());
        this.dementors = [];
        
        // 清理BOSS
        this.bosses.forEach(boss => boss.destroy());
        this.bosses = [];
        this.luciusEnemies = [];
        this.bellatrixEnemies = [];
        
        // 清理巨怪血条
        this.trolls.forEach(troll => {
            if (troll) {
                this.destroyTrollHealthBar(troll);
            }
        });
        this.trolls = [];
        
        // 清理守护神咒
        this.patronusSpells.forEach(patronus => patronus.destroy());
        this.patronusSpells = [];
        
        // 清理食物
        this.foods.forEach(food => food.destroy());
        this.foods = [];
        
        // 清理漂浮武器
        this.floatingWeapons.forEach(weapon => weapon.destroy());
        this.floatingWeapons = [];
        
        // 停止摄魂怪音效
        this.stopDementorSound();
        
        // 停止巨怪音效
        this.stopTrollSound();
        
        // 停止贝拉特里克斯音效
        this.stopBellatrixSound();
        
        // 重置震动效果
        this.screenShakeIntensity = 0;
        this.cameras.main.setScroll(0, 0);

    }

    private spawnEnemy() {
        // 获取当前游戏尺寸
        const gameWidth = this.cameras.main.width || window.innerWidth;
        
        const x = Math.random() * (gameWidth - 100) + 50;
        const y = -50;
        
        // 随机选择敌人类型
        const enemyTypes = ['death_eater_1', 'death_eater_2', 'death_eater_3'];
        const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // 基于游戏时间调整敌人速度
        const gameTimeSeconds = this.gameTime / 1000;
        const difficultyLevel = Math.floor(gameTimeSeconds / 30) + 1;
        const baseSpeed = 60; // 基础速度降低（原来100）
        const speedIncrease = Math.min(40, difficultyLevel * 8); // 每个难度等级增加8，最多增加40
        const enemySpeed = baseSpeed + speedIncrease;
        
        const enemy = this.physics.add.sprite(x, y, randomEnemyType);
        enemy.setVelocityY(enemySpeed);
        enemy.setScale(0.08); // 调整大小以适应游戏
        
        // 为敌人添加攻击计时器属性 - 立即开始攻击循环
        (enemy as any).shootTimer = 1000 + Math.random() * 1000; // 1-2秒后第一次攻击
        (enemy as any).shootInterval = 2500 + Math.random() * 2000; // 2.5-4.5秒攻击间隔
        (enemy as any).hasEnteredScreen = false; // 是否进入屏幕的标记
        (enemy as any).originalSpeedY = enemySpeed; // 保存原始移动速度
        
        this.enemies.push(enemy);
        
        this.logger.info('SimpleMainScene', `生成敌人: ${randomEnemyType} 位置: (${x}, ${y}), 速度: ${enemySpeed}`);
    }

    private playerShoot() {
        if (!this.player) return;
        
        // 检查魔法值是否足够
        if (this.mana < 1) {
            return;
        }
        
        
        // 消耗魔法值
        this.mana -= 1;
        EventBus.emit('mana-updated', { current: this.mana, max: this.maxMana });
        
        // 播放普通攻击音效
        try {
            this.sound.play('magic-spells', { volume: 0.3 });
        } catch (error) {
            // 普通攻击音效播放失败
        }
        
        // 创建咒语子弹 - 使用攻击动画而不是静态图片
        let bullet: Phaser.Physics.Arcade.Sprite;
        
        // 检查是否存在攻击动画
        if (this.anims.exists('attack-animation')) {
            // 使用攻击动画的第一帧创建子弹，位置稍微偏上一些避免立即碰撞
            bullet = this.physics.add.sprite(this.player.x, this.player.y - 50, 'attack1');
            bullet.setScale(0.08); // 调整动画子弹大小，稍微小一点
            
            // 播放攻击动画（已设置为无限循环）
            bullet.play('attack-animation');
            
        } else {
            // 降级为静态纹理
            let spellTexture: string;
            switch (this.selectedCharacter) {
                case PlayerCharacter.HARRY:
                    spellTexture = 'stupefy';
                    break;
                case PlayerCharacter.HERMIONE:
                    spellTexture = 'stupefy';
                    break;
                case PlayerCharacter.RON:
                    spellTexture = 'wingardium_leviosa';
                    break;
                default:
                    spellTexture = 'stupefy';
            }
            
            bullet = this.physics.add.sprite(this.player.x, this.player.y - 50, spellTexture);
            bullet.setScale(0.05);
            
        }
        
        bullet.setVelocityY(-400);
        bullet.setDepth(15); // 确保在背景前面
        
        // 给子弹添加一个标记，表示刚创建，用于避免立即碰撞
        (bullet as any).justCreated = true;
        
        // 100毫秒后移除"刚创建"标记
        this.time.delayedCall(100, () => {
            if (bullet && bullet.active) {
                (bullet as any).justCreated = false;
            }
        });
        
        this.playerBullets.push(bullet);
        
        this.logger.info('SimpleMainScene', '玩家发射咒语');
    }

    private enemyShoot(enemy: Phaser.Physics.Arcade.Sprite) {
        if (!enemy || !enemy.active) return;
        
        // 昏迷的敌人不能攻击
        if ((enemy as any).isStunned) {
            return;
        }
        
        // 创建敌人攻击光团
        const projectile = this.physics.add.sprite(enemy.x, enemy.y + 20, 'enemy_projectile');
        projectile.setScale(1.0); // 保持原始大小
        projectile.setVelocityY(200); // 向下发射
        projectile.setDepth(10); // 确保在背景前面但在玩家后面
        
        // 添加一个轻微的侧向速度，让攻击更有趣
        const sidewaysVelocity = (Math.random() - 0.5) * 100; // -50到50的随机侧向速度
        projectile.setVelocityX(sidewaysVelocity);
        
        // 给光团添加一个闪烁效果
        this.tweens.add({
            targets: projectile,
            alpha: { from: 1, to: 0.5 },
            duration: 200,
            yoyo: true,
            repeat: -1
        });
        
        this.enemyBullets.push(projectile);
        
    }

    private spawnDementor() {
        // 获取当前游戏尺寸
        const gameWidth = this.cameras.main.width || window.innerWidth;
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        const x = Math.random() * (gameWidth - 100) + 50;
        const y = -80; // 摄魂怪从更高的位置出现
        
        const dementor = this.physics.add.sprite(x, y, 'dementor');
        dementor.setVelocityY(0); // 不设置初始下降速度，由AI控制
        dementor.setScale(0.1); // 摄魂怪稍大一些
        dementor.setDepth(5); // 设置深度
        
        // 给摄魂怪添加特殊标记和AI状态
        (dementor as any).isDementor = true;
        (dementor as any).dementorState = 'approaching'; // approaching, retreating
        (dementor as any).stateTimer = 0;
        (dementor as any).targetDistance = 100; // 目标接近距离
        
        this.dementors.push(dementor);
        
        // 开始播放摄魂怪音效
        this.startDementorSound();
        
        this.logger.info('SimpleMainScene', `摄魂怪出现 位置: (${x}, ${y})`);
        
        // 通知UI有摄魂怪出现
        EventBus.emit('dementor-spawned');
    }

    private startDementorSound() {
        try {
            // 如果已经有音乐在播放，先停止
            if (this.dementorSound) {
                this.dementorSound.stop();
                this.dementorSound.destroy(); // 确保完全清理
            }
            
            // 检查音效资源是否存在
            if (!this.cache.audio.exists('dementor-sound')) {
                // 摄魂怪音效资源不存在
                return;
            }
            
            // 创建并播放摄魂怪音效
            this.dementorSound = this.sound.add('dementor-sound', {
                loop: true,
                volume: 0.6 // 调整音量，避免太大声
            });
            
            if (this.dementorSound) {
                this.dementorSound.play();
                this.dementorSoundPlaying = true;
                this.logger.info('SimpleMainScene', '摄魂怪音效开始播放');
                
                // 添加音效结束监听，确保循环播放
                this.dementorSound.on('complete', () => {
                    if (this.dementorSoundPlaying && this.dementors.length > 0) {
                        if (this.dementorSound) {
                            this.dementorSound.play();
                        }
                    }
                });
            }
        } catch (error) {
            this.logger.warn('SimpleMainScene', '摄魂怪音效播放失败:', error);
        }
    }

    private stopDementorSound() {
        this.dementorSoundPlaying = false;
        if (this.dementorSound) {
            this.dementorSound.stop();
        }
    }

    private startTrollSound() {
        try {
            // 如果已经有音乐在播放，先停止
            if (this.trollSound) {
                this.trollSound.stop();
                this.trollSound.destroy(); // 确保完全清理
            }
            
            // 检查音效资源是否存在
            if (!this.cache.audio.exists('troll-roar')) {
                // 巨怪咆哮音效资源不存在
                return;
            }
            
            // 创建并播放巨怪咆哮音效
            this.trollSound = this.sound.add('troll-roar', {
                loop: true,
                volume: 0.7 // 巨怪咆哮音量稍高
            });
            
            if (this.trollSound) {
                this.trollSound.play();
                this.trollSoundPlaying = true;
                this.logger.info('SimpleMainScene', '巨怪咆哮音效开始播放');
                
                // 添加音效结束监听，确保循环播放
                this.trollSound.on('complete', () => {
                    if (this.trollSoundPlaying && this.trolls.length > 0) {
                        if (this.trollSound) {
                            this.trollSound.play();
                        }
                    }
                });
            }
        } catch (error) {
            this.logger.warn('SimpleMainScene', '巨怪咆哮音效播放失败:', error);
        }
    }

    private stopTrollSound() {
        this.trollSoundPlaying = false;
        if (this.trollSound) {
            this.trollSound.stop();
        }
    }

    private startBellatrixSound() {
        try {
            // 如果已经有音乐在播放，先停止
            if (this.bellatrixSound) {
                this.bellatrixSound.stop();
                this.bellatrixSound.destroy(); // 确保完全清理
            }
            
            // 检查音效资源是否存在
            if (!this.cache.audio.exists('bellatrix-sound')) {
                // 贝拉特里克斯音效资源不存在
                return;
            }
            
            // 创建并播放贝拉特里克斯音效
            this.bellatrixSound = this.sound.add('bellatrix-sound', {
                loop: true,
                volume: 0.6 // 贝拉特里克斯音量
            });
            
            if (this.bellatrixSound) {
                this.bellatrixSound.play();
                this.bellatrixSoundPlaying = true;
                this.logger.info('SimpleMainScene', '贝拉特里克斯音效开始播放');
                
                // 添加音效结束监听，确保循环播放
                this.bellatrixSound.on('complete', () => {
                    if (this.bellatrixSoundPlaying && this.bellatrixEnemies.length > 0) {
                        if (this.bellatrixSound) {
                            this.bellatrixSound.play();
                        }
                    }
                });
            }
        } catch (error) {
            this.logger.warn('SimpleMainScene', '贝拉特里克斯音效播放失败:', error);
        }
    }

    private stopBellatrixSound() {
        this.bellatrixSoundPlaying = false;
        if (this.bellatrixSound) {
            this.bellatrixSound.stop();
        }
    }

    private activateRonMode() {
        // 激活罗恩无敌模式
        this.ronModeActive = true;
        this.ronModeTimer = 15000; // 15秒
        
        
        // 保持原来的纹理，只添加视觉效果
        if (this.player) {
            // 添加金色光芒效果
            this.player.setTint(0xFFD700); // 金色
            
            // 添加闪烁效果表示无敌状态
            this.tweens.add({
                targets: this.player,
                alpha: { from: 1, to: 0.7 },
                duration: 300,
                yoyo: true,
                repeat: -1,
                ease: 'Power2'
            });
        }
        
        // 通知UI层罗恩模式激活
        EventBus.emit('ron-mode-activated', { duration: 15 });
        
        this.logger.info('SimpleMainScene', '罗恩无敌模式激活');
    }

    private deactivateRonMode() {
        // 结束罗恩无敌模式
        this.ronModeActive = false;
        this.ronModeTimer = 0;
        
        
        // 恢复正常外观
        if (this.player) {
            this.player.clearTint();
            this.player.setAlpha(1);
            
            // 停止所有相关的缓动动画
            this.tweens.killTweensOf(this.player);
        }
        
        // 通知UI层罗恩模式结束
        EventBus.emit('ron-mode-deactivated');
        
        this.logger.info('SimpleMainScene', '罗恩无敌模式结束');
    }

    private castSpecialSkill() {
        switch (this.selectedCharacter) {
            case PlayerCharacter.HARRY:
                this.castPatronusCharm();
                break;
            case PlayerCharacter.HERMIONE:
                this.castStupefy();
                break;
            case PlayerCharacter.RON:
                this.castWingardiumLeviosa();
                break;
            default:
        }
    }

    private castStupefy() {
        // 只有赫敏可以使用昏昏倒地
        if (this.selectedCharacter !== PlayerCharacter.HERMIONE || !this.player) {
            return;
        }
        
        // 检查冷却时间
        if (this.stupefiCooldown > 0) {
            return;
        }
        
        // 播放昏昏倒地音效
        try {
            this.sound.play('stupefy-sound', { volume: 0.5 });
        } catch (error) {
            // 昏昏倒地音效播放失败
        }
        
        // 设置冷却时间为20秒
        this.stupefiCooldown = 20000;
        
        // 获取屏幕上的所有普通敌人和BOSS
        let targetEnemies: Phaser.Physics.Arcade.Sprite[] = [];
        
        // 添加普通敌人
        targetEnemies = targetEnemies.concat(this.enemies);
        
        // 添加BOSS（除了摄魂怪，昏昏倒地对摄魂怪无效）
        targetEnemies = targetEnemies.concat(this.luciusEnemies);
        targetEnemies = targetEnemies.concat(this.bellatrixEnemies);
        targetEnemies = targetEnemies.concat(this.trolls);
        
        if (targetEnemies.length === 0) {
            return;
        }
        
        // 对每个敌人施加昏昏倒地效果
        targetEnemies.forEach((enemy, index) => {
            if (!enemy || !enemy.active) return;
            
            // 延迟施法效果，制造连锁昏迷的视觉效果
            this.time.delayedCall(index * 100, () => {
                if (!enemy || !enemy.active) return;
                
                // 创建昏昏倒地特效
                const stunEffect = this.physics.add.sprite(enemy.x, enemy.y - 20, 'stupefy');
                stunEffect.setScale(0.12);
                stunEffect.setDepth(15);
                stunEffect.setTint(0xFF6600); // 橙色特效
                
                // 特效动画
                this.tweens.add({
                    targets: stunEffect,
                    alpha: { from: 1, to: 0 },
                    scaleX: { from: 0.12, to: 0.2 },
                    scaleY: { from: 0.12, to: 0.2 },
                    y: { from: enemy.y - 20, to: enemy.y - 50 },
                    duration: 1000,
                    onComplete: () => {
                        stunEffect.destroy();
                    }
                });
                
                // 敌人昏迷效果：停止移动10秒
                enemy.setVelocity(0, 0);
                (enemy as any).isStunned = true;
                (enemy as any).stunTimer = 10000; // 10秒昏迷时间
                
                // 敌人变成灰色表示昏迷
                enemy.setTint(0x808080);
                
                
                // 昏迷状态将在update方法中自动清除，无需手动定时器
            });
        });
        
        this.logger.info('SimpleMainScene', `赫敏释放昏昏倒地，影响敌人数: ${targetEnemies.length}`);
    }

    private castWingardiumLeviosa() {
        // 只有罗恩可以使用漂浮咒
        if (this.selectedCharacter !== PlayerCharacter.RON || !this.player) {
            return;
        }
        
        // 检查冷却时间
        if (this.wingardiumCooldown > 0) {
            return;
        }
        
        // 检查是否有巨怪（漂浮咒只对巨怪有效）
        if (this.trolls.length === 0) {
            return;
        }
        
        // 播放漂浮咒音效
        try {
            this.sound.play('wingardium-sound', { volume: 0.5 });
        } catch (error) {
            // 漂浮咒音效播放失败
        }
        
        // 设置冷却时间为25秒
        this.wingardiumCooldown = 25000;
        
        // 对每个巨怪施加漂浮咒效果
        this.trolls.forEach((troll, index) => {
            if (!troll || !troll.active) return;
            
            // 延迟施法效果
            this.time.delayedCall(index * 200, () => {
                if (!troll || !troll.active) return;
                
                // 将巨怪纹理改为被击败状态
                troll.setTexture('troll_defeat');
                
                // 标记巨怪正在被漂浮咒影响
                (troll as any).isWingardiumTarget = true;
                (troll as any).wingardiumHitCount = 0; // 武器击中次数
                
                // 创建漂浮武器
                this.createFloatingWeapon(troll);
                
            });
        });
        
        this.logger.info('SimpleMainScene', `罗恩释放漂浮咒，影响巨怪数: ${this.trolls.length}`);
    }

    private createFloatingWeapon(troll: Phaser.Physics.Arcade.Sprite) {
        // 在巨怪附近创建漂浮武器
        const weapon = this.physics.add.sprite(troll.x + 60, troll.y - 30, 'troll_weapon');
        weapon.setScale(0.15);
        weapon.setDepth(16);
        
        // 武器属性
        (weapon as any).targetTroll = troll;
        (weapon as any).attackTimer = 0;
        (weapon as any).attackInterval = 1500; // 1.5秒攻击一次
        (weapon as any).hitCount = 0; // 击中次数
        
        // 添加漂浮动画
        this.tweens.add({
            targets: weapon,
            y: weapon.y - 20,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // 添加旋转动画
        this.tweens.add({
            targets: weapon,
            rotation: Math.PI * 2,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });
        
        this.floatingWeapons.push(weapon);
        
    }

    private castPatronusCharm() {
        // 只有哈利可以使用守护神咒
        if (this.selectedCharacter !== PlayerCharacter.HARRY || !this.player) {
            return;
        }
        
        // 检查冷却时间
        if (this.patronusCooldown > 0) {
            return;
        }
        
        // 播放守护神咒音效
        try {
            this.sound.play('patronus-sound', { volume: 0.6 });
        } catch (error) {
            // 守护神咒音效播放失败
        }
        
        // 设置冷却时间为20秒
        this.patronusCooldown = 20000;
        
                // 守护神咒只对摄魂怪有效，但总是显示纹理
        let targets: Phaser.Physics.Arcade.Sprite[] = [];
        
        if (this.dementors.length > 0) {
            targets = [...this.dementors];
        } else {
        }
        
        // 总是创建守护神咒纹理，即使没有目标
        if (targets.length > 0) {
            // 有目标时，为每个目标创建追踪的守护神咒
            targets.forEach((target, index) => {
                // 稍微延迟每个守护神咒的释放，制造连发效果
                this.time.delayedCall(index * 200, () => {
                    if (!target || !target.active) return;
                    
                    const patronus = this.physics.add.sprite(this.player!.x, this.player!.y - 30, 'patronus');
                    patronus.setScale(0.15); // 增大守护神咒的尺寸
                    patronus.setDepth(12); // 确保在其他对象前面
                    
                    // 给守护神咒添加目标和属性
                    (patronus as any).target = target;
                    (patronus as any).speed = 400; // 更快的追踪速度
                    (patronus as any).isDementor = true; // 标记攻击摄魂怪
                    
                    // 添加银蓝色光晕效果（去掉旋转）
                    this.tweens.add({
                        targets: patronus,
                        alpha: { from: 1, to: 0.8 },
                        scaleX: { from: 0.15, to: 0.18 },
                        scaleY: { from: 0.15, to: 0.18 },
                        duration: 400,
                        yoyo: true,
                        repeat: -1
                    });
                    
                    this.patronusSpells.push(patronus);
                    
                });
            });
        } else {
            // 没有目标时，创建一个向前飞行的守护神咒纹理
            const patronus = this.physics.add.sprite(this.player!.x, this.player!.y - 30, 'patronus');
            patronus.setScale(0.15); // 增大守护神咒的尺寸
            patronus.setDepth(12);
            
            // 设置向上飞行
            patronus.setVelocityY(-300);
            
            // 给守护神咒添加属性，标记为无目标
            (patronus as any).target = null;
            (patronus as any).speed = 300;
            (patronus as any).isDementor = false;
            
            // 添加银蓝色光晕效果（去掉旋转）
            this.tweens.add({
                targets: patronus,
                alpha: { from: 1, to: 0.8 },
                scaleX: { from: 0.15, to: 0.18 },
                scaleY: { from: 0.15, to: 0.18 },
                duration: 400,
                yoyo: true,
                repeat: -1
            });
            
            this.patronusSpells.push(patronus);
            
        }
        
        this.logger.info('SimpleMainScene', `哈利释放守护神咒，目标数: ${targets.length}`);
    }

    private updateDementors(delta: number) {
        // 获取当前游戏尺寸
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        for (let i = this.dementors.length - 1; i >= 0; i--) {
            const dementor = this.dementors[i];
            
            // 摄魂怪AI行为更新
            if (this.player) {
                this.updateDementorAI(dementor, delta);
            }
            
            // 检查摄魂怪是否超出屏幕太远（只有在远离玩家时才删除）
            if (dementor.y > gameHeight + 200 || dementor.y < -200 || 
                Math.abs(dementor.x - (this.player?.x || 0)) > 800) {
                dementor.destroy();
                this.dementors.splice(i, 1);
                continue;
            }
        }
        
        // 如果没有摄魂怪了，停止音效并通知UI
        if (this.dementors.length === 0 && this.dementorSound) {
            this.stopDementorSound();
            EventBus.emit('dementor-defeated');
        }
    }

    private updateDementorAI(dementor: Phaser.Physics.Arcade.Sprite, delta: number) {
        if (!this.player) return;
        
        const dx = this.player.x - dementor.x;
        const dy = this.player.y - dementor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const state = (dementor as any).dementorState;
        const targetDistance = (dementor as any).targetDistance;
        let stateTimer = (dementor as any).stateTimer;
        
        stateTimer += delta;
        
        switch (state) {
            case 'approaching':
                // 快速接近玩家
                if (distance > targetDistance) {
                    const speed = 150; // 接近速度
                    if (distance > 0) {
                        const velocityX = (dx / distance) * speed;
                        const velocityY = (dy / distance) * speed;
                        dementor.setVelocity(velocityX, velocityY);
                    }
                } else {
                    // 到达目标距离，标记攻击状态并开始撤退
                    (dementor as any).dementorState = 'retreating';
                    stateTimer = 0;
                    dementor.setVelocity(0, 0);
                    
                    // 标记摄魂怪刚完成一次攻击（用于碰撞检测时判断）
                    (dementor as any).justAttacked = true;
                }
                break;
                
            case 'retreating':
                // 短暂撤退然后重新接近
                if (stateTimer < 1500) { // 撤退1.5秒
                    if (distance > 0) {
                        const speed = 100; // 撤退速度
                        // 向远离玩家的方向移动
                        const velocityX = (-dx / distance) * speed;
                        const velocityY = (-dy / distance) * speed;
                        dementor.setVelocity(velocityX, velocityY);
                    }
                } else {
                    // 撤退结束，停止移动并等待
                    dementor.setVelocity(0, 0);
                    
                    if (stateTimer >= 3000) { // 总共等待3秒
                        // 重新开始接近
                        (dementor as any).dementorState = 'approaching';
                        stateTimer = 0;
                    }
                }
                break;
        }
        
        (dementor as any).stateTimer = stateTimer;
    }

    private updatePatronusSpells(delta: number) {
        // 获取当前游戏尺寸
        const gameWidth = this.cameras.main.width || window.innerWidth;
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        for (let i = this.patronusSpells.length - 1; i >= 0; i--) {
            const patronus = this.patronusSpells[i];
            const target = (patronus as any).target;
            const speed = (patronus as any).speed;
            
            // 如果有目标，检查目标是否还存在
            if (target !== null) {
                if (!target || !target.active || this.dementors.indexOf(target) === -1) {
                    // 目标不存在，销毁守护神咒
                    patronus.destroy();
                    this.patronusSpells.splice(i, 1);
                    continue;
                }
                
                // 计算朝向目标的方向
                const angle = Phaser.Math.Angle.Between(patronus.x, patronus.y, target.x, target.y);
                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;
                
                // 设置守护神咒的速度朝向目标
                patronus.setVelocity(velocityX, velocityY);
            }
            // 如果没有目标(target === null)，保持当前速度继续飞行
            
            // 检查守护神咒是否超出屏幕边界
            if (patronus.x < -50 || patronus.x > gameWidth + 50 || 
                patronus.y < -50 || patronus.y > gameHeight + 50) {
                patronus.destroy();
                this.patronusSpells.splice(i, 1);
                continue;
            }
        }
    }

    update(time: number, delta: number) {
        // 更新背景滚动（无论游戏状态如何）
        this.updateBackground(delta);
        
        if (this.gameState !== GameState.PLAYING) {
            return;
        }

        // 更新游戏时间
        this.gameTime += delta;
        
        // 更新难度
        this.updateDifficulty();

        // 每 10 秒输出一次游戏状态调试信息
        if (this.gameTime % 10000 < delta) {
            const currentEnemies = this.enemies.length;
            const currentBullets = this.playerBullets.length + this.enemyBullets.length;
        }

        // 处理输入
        this.handleInput();

        // 更新敌人
        this.updateEnemies(delta);

        // 更新子弹
        this.updateBullets();

        // 生成敌人
        this.enemySpawnTimer += delta;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // 摄魂怪现在只通过BOSS系统出现，不再定时生成
        // this.dementorSpawnTimer += delta;
        // if (this.dementorSpawnTimer >= this.dementorSpawnInterval && 
        //     this.bosses.length === 0 && this.dementors.length === 0) {
        //     this.spawnDementor();
        //     this.dementorSpawnTimer = 0;
        // }
        
        // 生成BOSS（只有当前没有BOSS和摄魂怪时才生成）
        this.bossSpawnTimer += delta;
        if (this.bossSpawnTimer >= this.bossSpawnInterval && this.bosses.length === 0 && this.dementors.length === 0) {
            this.spawnRandomBoss();
            this.bossSpawnTimer = 0;
            // 动态调整BOSS生成频率：每击败一个BOSS，下次生成间隔减少5秒（最小30秒）
            this.bossSpawnInterval = Math.max(30000, this.bossSpawnInterval - 5000);
        }
        
        // 生成食物
        this.foodSpawnTimer += delta;
        if (this.foodSpawnTimer >= this.currentFoodSpawnInterval) {
            this.spawnFood();
            this.foodSpawnTimer = 0;
        }
        
        // 先步进 Box2D 并同步精灵位置
        this.stepPlanckAndSync(delta);

        // 更新食物
        this.updateFoods(delta);
        
        // 更新漂浮武器
        this.updateFloatingWeapons(delta);
        
        // 更新摄魂怪
        this.updateDementors(delta);
        
        // 更新BOSS
        this.updateBosses(delta);
        
        // 更新守护神咒
        this.updatePatronusSpells(delta);
        
        // 更新屏幕震动
        this.updateScreenShake(delta);
        
        // 更新无敌状态
        if (this.invulnerabilityTime > 0) {
            this.invulnerabilityTime -= delta;
            if (this.player) {
                // 无敌时闪烁效果
                this.player.alpha = Math.sin(this.invulnerabilityTime / 100) * 0.5 + 0.5;
            }
        } else if (this.player) {
            this.player.alpha = 1;
        }
        
        // 减少受伤冷却时间
        if (this.damageCooldown > 0) {
            this.damageCooldown -= delta;
        }
        
        // 减少守护神咒冷却时间
        if (this.patronusCooldown > 0) {
            this.patronusCooldown -= delta;
            // 每5秒输出一次冷却状态
            if (this.patronusCooldown > 0 && Math.floor(this.patronusCooldown / 5000) !== Math.floor((this.patronusCooldown + delta) / 5000)) {
            }
        }
        
        // 减少昏昏倒地冷却时间
        if (this.stupefiCooldown > 0) {
            this.stupefiCooldown -= delta;
        }
        
        // 减少漂浮咒冷却时间
        if (this.wingardiumCooldown > 0) {
            this.wingardiumCooldown -= delta;
        }
        
        // 减少角色切换冷却时间
        if (this.characterSwitchCooldown > 0) {
            this.characterSwitchCooldown -= delta;
        }
        
        // 更新罗恩无敌模式计时器
        if (this.ronModeActive && this.ronModeTimer > 0) {
            this.ronModeTimer -= delta;
            if (this.ronModeTimer <= 0) {
                this.deactivateRonMode();
            }
        }
        
        // 更新魔法值恢复
        if (this.mana < this.maxMana) {
            this.manaRegenTimer += delta;
            if (this.manaRegenTimer >= 1000) { // 每秒恢复
                this.mana += this.manaRegenRate;
                if (this.mana > this.maxMana) {
                    this.mana = this.maxMana;
                }
                this.manaRegenTimer = 0;
                EventBus.emit('mana-updated', { current: this.mana, max: this.maxMana });
            }
        }
        
        // 发送技能冷却时间更新事件到React HUD
        EventBus.emit('skill-cooldowns-updated', {
            patronus: Math.max(0, this.patronusCooldown / 1000), // 转换为秒
            stupefy: Math.max(0, this.stupefiCooldown / 1000), // 昏昏倒地冷却时间
            wingardium: Math.max(0, this.wingardiumCooldown / 1000), // 漂浮咒冷却时间
            characterSwitch: Math.max(0, this.characterSwitchCooldown / 1000) // 角色切换冷却时间
        });

        // 检测碰撞
        this.checkCollisions();
    }

    private handleInput() {
        if (!this.player || (!this.cursors && !this.wasdKeys)) return;

        // 重置速度
        this.player.setVelocity(0);

        // 水平移动控制 (方向键或WASD)
        const leftPressed = (this.cursors && this.cursors.left.isDown) || (this.wasdKeys && this.wasdKeys.left.isDown);
        const rightPressed = (this.cursors && this.cursors.right.isDown) || (this.wasdKeys && this.wasdKeys.right.isDown);
        
        if (leftPressed) {
            this.player.setVelocityX(-300);
        } else if (rightPressed) {
            this.player.setVelocityX(300);
        }

        // 垂直移动控制 (方向键或WASD)
        const upPressed = (this.cursors && this.cursors.up.isDown) || (this.wasdKeys && this.wasdKeys.up.isDown);
        const downPressed = (this.cursors && this.cursors.down.isDown) || (this.wasdKeys && this.wasdKeys.down.isDown);
        
        if (upPressed) {
            this.player.setVelocityY(-300);
        } else if (downPressed) {
            this.player.setVelocityY(300);
        }

        // 射击
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey!)) {
            this.playerShoot();
        }
    }

    private updateEnemies(delta: number) {
        // 获取当前游戏尺寸
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // 检查敌人是否超出屏幕
            if (enemy.y > gameHeight + 100) {
                enemy.destroy();
                this.enemies.splice(i, 1);
                continue;
            }
            
            // 检查敌人是否已进入屏幕（y > 0表示头部进入）
            if (!(enemy as any).hasEnteredScreen && enemy.y > 0) {
                (enemy as any).hasEnteredScreen = true;
            }
            
            // 只有进入屏幕且未被昏迷的敌人才更新攻击计时器
            if ((enemy as any).hasEnteredScreen && !(enemy as any).isStunned) {
                (enemy as any).shootTimer -= delta; // 倒计时减少
                
                // 如果计时器到达0且敌人仍在有效攻击范围内
                if ((enemy as any).shootTimer <= 0 && enemy.y > 0 && enemy.y < gameHeight - 50) {
                    this.enemyShoot(enemy);
                    (enemy as any).shootTimer = (enemy as any).shootInterval; // 重置为攻击间隔
                }
            }
            
            // 更新昏迷状态
            if ((enemy as any).isStunned) {
                if ((enemy as any).stunTimer > 0) {
                    (enemy as any).stunTimer -= delta;
                    // 昏迷期间停止移动
                    enemy.setVelocity(0, 0);
                } else {
                    // 昏迷时间结束，清除昏迷状态并恢复移动
                    (enemy as any).isStunned = false;
                    enemy.clearTint();
                    // 恢复原始移动速度
                    if ((enemy as any).originalSpeedY) {
                        enemy.setVelocityY((enemy as any).originalSpeedY);
                    }
                }
            }
        }
    }

    private updateBullets() {
        // 获取当前游戏尺寸
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        // 更新玩家子弹
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            if (bullet.y < -50) {
                bullet.destroy();
                this.playerBullets.splice(i, 1);
            }
        }

        // 更新敌人子弹
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            // 获取游戏宽度
            const gameWidth = this.cameras.main.width || window.innerWidth;
            
            // 检查子弹是否超出边界（考虑追踪弹的各种方向）
            const outOfBounds = bullet.y > gameHeight + 100 || 
                               bullet.y < -100 || 
                               bullet.x > gameWidth + 100 || 
                               bullet.x < -100;
            
            if (outOfBounds) {
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
                
                // 追踪弹超出边界时的日志
                if ((bullet as any).isTracking) {
                }
            }
        }
    }

    private checkCollisions() {
        if (!this.player) return;

        // 玩家子弹 vs 敌人
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            // 确保子弹对象有效且存在
            if (!bullet || !bullet.active) {
                // 发现无效子弹，跳过碰撞检测
                this.playerBullets.splice(i, 1);
                continue;
            }
            
            // 跳过刚创建的子弹，避免立即碰撞
            if ((bullet as any).justCreated) {
                continue;
            }
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                // 确保敌人对象有效且存在
                if (!enemy || !enemy.active) {
                    // 发现无效敌人，跳过碰撞检测
                    this.enemies.splice(j, 1);
                    continue;
                }
                
                // 检查碰撞，但添加距离验证
                if (this.physics.overlap(bullet, enemy)) {
                    // 额外验证：计算实际距离
                    const distance = Phaser.Math.Distance.Between(
                        bullet.x, bullet.y,
                        enemy.x, enemy.y
                    );
                    
                    
                    // 只有距离足够近才算真正击中（调整这个值来控制击中敏感度）
                    if (distance < 50) {
                        // 增加分数
                        this.addScore(100);
                        
                        
                        // 销毁子弹和敌人
                        bullet.destroy();
                        this.playerBullets.splice(i, 1);
                        enemy.destroy();
                        this.enemies.splice(j, 1);
                        break;
                    } else {
                    }
                }
            }
        }

        // 敌人子弹 vs 玩家
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            // 确保子弹对象有效且存在
            if (!bullet || !bullet.active) {
                // 发现无效敌人子弹，跳过碰撞检测
                this.enemyBullets.splice(i, 1);
                continue;
            }
            
            // 检查敌人子弹是否击中玩家
            if (this.physics.overlap(bullet, this.player!) && this.damageCooldown <= 0) {
                
                // 根据子弹类型确定伤害
                let bulletDamage = 0.5; // 默认伤害
                if ((bullet as any).isBossBullet) {
                    bulletDamage = (bullet as any).damage || 1.0;
                }
                
                // 玩家受伤
                this.takeDamage(bulletDamage);
                
                // 设置受伤冷却时间（1秒）
                this.damageCooldown = 1000;
                
                // 销毁敌人子弹
                bullet.destroy();
                this.enemyBullets.splice(i, 1);
                break; // 一次只处理一个碰撞
            }
        }

        // 守护神咒 vs 摄魂怪
        for (let i = this.patronusSpells.length - 1; i >= 0; i--) {
            const patronus = this.patronusSpells[i];
            
            for (let j = this.dementors.length - 1; j >= 0; j--) {
                const dementor = this.dementors[j];
                
                if (this.physics.overlap(patronus, dementor)) {
                    
                    // 销毁守护神咒
                    patronus.destroy();
                    this.patronusSpells.splice(i, 1);
                    
                    // 一次攻击就消灭摄魂怪
                    
                    // 增加分数
                    this.addScore(500); // 消灭摄魂怪得500分
                    
                    // 销毁摄魂怪
                    dementor.destroy();
                    this.dementors.splice(j, 1);
                    
                    // 如果没有摄魂怪了，停止音效
                    if (this.dementors.length === 0) {
                        this.stopDementorSound();
                    }
                    
                    // 通知UI摄魂怪被击败
                    EventBus.emit('dementor-defeated');
                    
                    break; // 守护神咒已经被销毁，跳出内层循环
                }
            }
        }

        // 守护神咒 vs 普通敌人
        for (let i = this.patronusSpells.length - 1; i >= 0; i--) {
            const patronus = this.patronusSpells[i];
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (this.physics.overlap(patronus, enemy)) {
                    
                    // 销毁守护神咒
                    patronus.destroy();
                    this.patronusSpells.splice(i, 1);
                    
                    // 一次攻击就消灭普通敌人
                    
                    // 增加分数
                    this.addScore(150); // 消灭普通敌人得150分
                    
                    // 销毁敌人
                    enemy.destroy();
                    this.enemies.splice(j, 1);
                    
                    break; // 守护神咒已经被销毁，跳出内层循环
                }
            }
        }

        // 玩家 vs 摄魂怪 - 摄魂怪碰撞造成更大伤害
        if (this.damageCooldown <= 0) {
            for (let i = this.dementors.length - 1; i >= 0; i--) {
                const dementor = this.dementors[i];
                if (this.physics.overlap(this.player!, dementor)) {
                    // 检查摄魂怪是否刚完成攻击或正在接近状态
                    const justAttacked = (dementor as any).justAttacked;
                    const isApproaching = (dementor as any).dementorState === 'approaching';
                    
                    if (justAttacked || isApproaching) {
                        
                        // 摄魂怪造成1格血伤害
                        this.takeDamage(1);
                        
                        // 清除攻击标记
                        (dementor as any).justAttacked = false;
                        
                        // 设置受伤冷却时间（2秒）
                        this.damageCooldown = 2000;
                        
                        break; // 一次只处理一个碰撞
                    }
                }
            }
        }

        // 玩家 vs 普通敌人 - 只处理玩家受伤，不销毁敌人
        if (this.damageCooldown <= 0) { // 只有在冷却时间结束后才能受伤
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (this.physics.overlap(this.player!, enemy)) {
                    
                    // 玩家受伤
                    this.takeDamage();
                    
                    // 设置受伤冷却时间（1秒）
                    this.damageCooldown = 1000;
                    
                    // 敌人继续存在，不销毁
                    break; // 一次只处理一个碰撞
                }
            }
        }

        // 玩家 vs 食物
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            
            // 跳过已经碰撞过的食物
            if ((food as any).hasCollided) continue;
            
            if (this.physics.overlap(this.player!, food)) {
                // 食物被拾取
                const foodType = (food as any).foodType;
                const healAmount = (food as any).healAmount;
                
                // 治疗玩家
                this.lives = Math.min(5, this.lives + healAmount); // 最多5格血
                EventBus.emit('lives-updated', this.lives);
                
                // 特殊处理：罗恩吃到鸡腿
                if (foodType === 'chicken' && this.selectedCharacter === PlayerCharacter.RON) {
                    this.activateRonMode();
                }
                
                // 标记已碰撞，避免重复处理
                (food as any).hasCollided = true;
                
                // 计算真实的物理反弹
                const playerBody = this.player!.body as Phaser.Physics.Arcade.Body;
                const foodBody = food.body as Phaser.Physics.Arcade.Body;
                
                // 计算碰撞点和法向量
                const dx = food.x - this.player!.x;
                const dy = food.y - this.player!.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 归一化碰撞方向
                const normalX = dx / distance;
                const normalY = dy / distance;
                
                // 计算相对速度
                const relativeVelX = foodBody.velocity.x - playerBody.velocity.x;
                const relativeVelY = foodBody.velocity.y - playerBody.velocity.y;
                
                // 计算沿法向量的速度分量
                const normalVelocity = relativeVelX * normalX + relativeVelY * normalY;
                
                // 如果物体正在分离，不进行反弹
                if (normalVelocity > 0) return;
                
                // 弹性系数（0-1，1为完全弹性碰撞）
                const restitution = 0.8;
                
                // 计算冲量
                const impulse = -(1 + restitution) * normalVelocity;
                const impulseX = impulse * normalX;
                const impulseY = impulse * normalY;
                
                // 应用反弹速度（食物质量较小，反弹更明显）
                const bounceMultiplier = 1.5;
                foodBody.setVelocity(
                    foodBody.velocity.x + impulseX * bounceMultiplier,
                    foodBody.velocity.y + impulseY * bounceMultiplier
                );
                
                // 添加旋转效果（基于碰撞强度）
                const rotationSpeed = Math.abs(impulse) * 50;
                foodBody.setAngularVelocity(rotationSpeed * (Math.random() > 0.5 ? 1 : -1));
                
                // 简单的颜色变化表示治疗
                food.setTint(0x00FF00); // 绿色表示治疗
                
                // 延迟销毁食物（800毫秒后）
                this.time.delayedCall(800, () => {
                    if (food && food.active) {
                        // 淡出效果
                        this.tweens.add({
                            targets: food,
                            alpha: 0,
                            duration: 200,
                            onComplete: () => {
                                food.destroy();
                                const index = this.foods.indexOf(food);
                                if (index > -1) {
                                    this.foods.splice(index, 1);
                                }
                            }
                        });
                    }
                });
                
                break;
            }
        }

        // 玩家子弹 vs 巨怪 (BOSS)
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            if (!bullet || !bullet.active) continue;
            
            for (let j = this.trolls.length - 1; j >= 0; j--) {
                const troll = this.trolls[j];
                
                if (this.physics.overlap(bullet, troll)) {
                    const distance = Phaser.Math.Distance.Between(
                        bullet.x, bullet.y,
                        troll.x, troll.y
                    );
                    
                    if (distance < 70) { // 巨怪体积较大，碰撞范围也大一些
                        
                        // 减少巨怪血量
                        (troll as any).health -= 1;
                        
                        // 巨怪受击闪烁效果
                        troll.setTint(0xFF0000);
                        this.time.delayedCall(100, () => {
                            if (troll && troll.active) {
                                troll.clearTint();
                            }
                        });
                        
                        // 销毁子弹
                        bullet.destroy();
                        this.playerBullets.splice(i, 1);
                        
                        // 检查巨怪是否死亡
                        if ((troll as any).health <= 0) {
                            this.addScore(800); // 击败巨怪得800分
                            this.bossesKilled++;
                            
                            // 停止震动效果
                            this.screenShakeIntensity = 0;
                            this.cameras.main.setScroll(0, 0);
                            
                            // 清理血条
                            this.destroyTrollHealthBar(troll);
                            
                            // 从所有列表中移除
                            troll.destroy();
                            this.trolls.splice(j, 1);
                            this.removeBossFromList(troll);
                            
                            // 如果这是最后一个巨怪，停止咆哮音效
                            if (this.trolls.length === 0) {
                                this.stopTrollSound();
                            }
                            
                            // BOSS被击败后重置生成计时器，准备生成下一个BOSS
                            this.bossSpawnTimer = 0;
                        } else {
                            // 巨怪受伤时增加攻击频率
                            (troll as any).shakeTimer = Math.max((troll as any).shakeTimer - 500, 0);
                        }
                        
                        break;
                    }
                }
            }
        }

        // 玩家子弹 vs 其他BOSS
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            
            if (!bullet || !bullet.active) continue;
            
            // 检查卢修斯
            for (let j = this.luciusEnemies.length - 1; j >= 0; j--) {
                const lucius = this.luciusEnemies[j];
                
                if (this.physics.overlap(bullet, lucius)) {
                    const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, lucius.x, lucius.y);
                    
                    if (distance < 50) {
                        
                        (lucius as any).health -= 1;
                        
                        // 受击效果
                        lucius.setTint(0xFF0000);
                        this.time.delayedCall(100, () => {
                            if (lucius && lucius.active) lucius.clearTint();
                        });
                        
                        bullet.destroy();
                        this.playerBullets.splice(i, 1);
                        
                        if ((lucius as any).health <= 0) {
                            this.addScore(600);
                            this.bossesKilled++;
                            lucius.destroy();
                            this.luciusEnemies.splice(j, 1);
                            this.removeBossFromList(lucius);
                            
                            // BOSS被击败后重置生成计时器，准备生成下一个BOSS
                            this.bossSpawnTimer = 0;
                        }
                        break;
                    }
                }
            }
            
            // 检查贝拉特里克斯
            for (let j = this.bellatrixEnemies.length - 1; j >= 0; j--) {
                const bellatrix = this.bellatrixEnemies[j];
                
                if (this.physics.overlap(bullet, bellatrix)) {
                    const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, bellatrix.x, bellatrix.y);
                    
                    if (distance < 50) {
                        
                        (bellatrix as any).health -= 1;
                        
                        // 受击效果
                        bellatrix.setTint(0xFF0000);
                        this.time.delayedCall(100, () => {
                            if (bellatrix && bellatrix.active) bellatrix.clearTint();
                        });
                        
                        bullet.destroy();
                        this.playerBullets.splice(i, 1);
                        
                        if ((bellatrix as any).health <= 0) {
                            this.addScore(1000); // 最高分BOSS
                            this.bossesKilled++;
                            bellatrix.destroy();
                            this.bellatrixEnemies.splice(j, 1);
                            this.removeBossFromList(bellatrix);
                            
                            // 如果这是最后一个贝拉特里克斯，停止音效
                            if (this.bellatrixEnemies.length === 0) {
                                this.stopBellatrixSound();
                            }
                            
                            // BOSS被击败后重置生成计时器，准备生成下一个BOSS
                            this.bossSpawnTimer = 0;
                        }
                        break;
                    }
                }
            }
        }
    }

    private addScore(points: number) {
        this.score += points;
        EventBus.emit('score-updated', this.score);
    }

    private takeDamage(damage: number = 0.5) {
        // 无敌状态或罗恩无敌模式下不受伤害
        if (this.invulnerabilityTime > 0 || this.ronModeActive) {
            if (this.ronModeActive) {
            } else {
            }
            return;
        }
        
        this.lives -= damage;
        
        // 触发无敌时间
        this.invulnerabilityTime = this.INVULNERABILITY_DURATION;
        
        EventBus.emit('lives-updated', this.lives);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    private gameOver() {
        this.gameState = GameState.GAME_OVER;
        
        // 停止背景音乐
        this.stopBackgroundMusic();
        
        // 停止巨怪音效
        this.stopTrollSound();
        
        // 停止贝拉特里克斯音效
        this.stopBellatrixSound();
        
        EventBus.emit('game-over', { score: this.score });
        this.logger.info('SimpleMainScene', `游戏结束，最终分数: ${this.score}`);
    }

    /**
     * 生成随机BOSS
     */
    private spawnRandomBoss() {
        // 使用加权随机选择，确保各BOSS出现几率平衡
        const bossWeights = [
            { type: 'lucius', weight: 25 },      // 25% - 卢修斯（简单）
            { type: 'bellatrix', weight: 25 },   // 25% - 贝拉特里克斯（中等）
            { type: 'troll', weight: 25 },       // 25% - 巨怪（困难）
            { type: 'dementor', weight: 25 }     // 25% - 摄魂怪（特殊）
        ];
        
        // 计算总权重
        const totalWeight = bossWeights.reduce((sum, boss) => sum + boss.weight, 0);
        
        // 生成随机数
        let random = Math.random() * totalWeight;
        
        // 根据权重选择BOSS
        let randomBoss = 'lucius';
        for (const boss of bossWeights) {
            random -= boss.weight;
            if (random <= 0) {
                randomBoss = boss.type;
                break;
            }
        }
        
        const gameWidth = this.cameras.main.width || window.innerWidth;
        const x = Math.random() * (gameWidth - 100) + 50;
        const y = -100;
        
        let boss: Phaser.Physics.Arcade.Sprite | null = null;
        
        switch (randomBoss) {
            case 'lucius':
                boss = this.physics.add.sprite(x, y, 'lucius');
                boss.setScale(0.12);
                boss.setVelocityY(50); // 缓慢下降
                (boss as any).health = 8; // 增加20%：3 → 4
                (boss as any).bossType = 'lucius';
                (boss as any).originalSpeedY = 50; // 保存原始移动速度
                (boss as any).originalSpeedX = 80; // 保存水平移动速度
                this.luciusEnemies.push(boss);
                break;
                
            case 'bellatrix':
                boss = this.physics.add.sprite(x, y, 'bellatrix');
                boss.setScale(0.15);
                boss.setVelocityY(40); // 更慢，但会停在屏幕内
                (boss as any).health = 10; // 增加20%：5 → 6
                (boss as any).bossType = 'bellatrix';
                (boss as any).originalSpeedY = 40; // 保存原始移动速度
                
                // 开始播放贝拉特里克斯音效
                this.startBellatrixSound();
                
                this.bellatrixEnemies.push(boss);
                break;
                
            case 'troll':
                boss = this.physics.add.sprite(x, y, 'troll');
                boss.setScale(0.2);
                boss.setVelocityY(30); // 非常慢
                (boss as any).health = 18; // 增加20%：15 → 18
                (boss as any).maxHealth = 20; // 增加20%：15 → 18
                (boss as any).bossType = 'troll';
                (boss as any).shakeTimer = 0;
                (boss as any).originalSpeedY = 30; // 保存原始移动速度
                
                // 创建巨怪血条
                this.createTrollHealthBar(boss);
                
                // 开始播放巨怪咆哮音效
                this.startTrollSound();
                
                this.trolls.push(boss);
                break;
                
            case 'dementor':
                // 摄魂怪特殊处理 - 直接调用现有方法
                this.spawnDementor();
                // 摄魂怪不需要设置boss变量，因为它有独立的管理系统
                break;
        }
        
        if (boss) {
            boss.setDepth(10);
            this.bosses.push(boss);
        }
        
        
        // 增加难度
        this.difficultyLevel++;
    }

    /**
     * 创建巨怪血条
     */
    private createTrollHealthBar(troll: Phaser.Physics.Arcade.Sprite) {
        // 创建血条背景
        const healthBarBg = this.add.rectangle(troll.x, troll.y - 50, 80, 8, 0x000000);
        healthBarBg.setDepth(20);
        
        // 创建血条前景
        const healthBarFg = this.add.rectangle(troll.x, troll.y - 50, 76, 6, 0xFF0000);
        healthBarFg.setDepth(21);
        
        // 将血条关联到巨怪
        (troll as any).healthBarBg = healthBarBg;
        (troll as any).healthBarFg = healthBarFg;
        
    }

    /**
     * 更新巨怪血条位置和显示
     */
    private updateTrollHealthBar(troll: Phaser.Physics.Arcade.Sprite) {
        const healthBarBg = (troll as any).healthBarBg;
        const healthBarFg = (troll as any).healthBarFg;
        
        if (healthBarBg && healthBarFg) {
            // 更新血条位置到巨怪头顶
            healthBarBg.setPosition(troll.x, troll.y - 50);
            healthBarFg.setPosition(troll.x, troll.y - 50);
            
            // 更新血条宽度（根据血量比例）
            const healthRatio = (troll as any).health / (troll as any).maxHealth;
            const maxWidth = 76;
            const currentWidth = Math.max(0, maxWidth * healthRatio);
            healthBarFg.setSize(currentWidth, 6);
            
            // 根据血量改变血条颜色
            if (healthRatio > 0.6) {
                healthBarFg.setFillStyle(0x00FF00); // 绿色 - 健康
            } else if (healthRatio > 0.3) {
                healthBarFg.setFillStyle(0xFFFF00); // 黄色 - 警告
            } else {
                healthBarFg.setFillStyle(0xFF0000); // 红色 - 危险
            }
        }
    }

    /**
     * 销毁巨怪血条
     */
    private destroyTrollHealthBar(troll: Phaser.Physics.Arcade.Sprite) {
        const healthBarBg = (troll as any).healthBarBg;
        const healthBarFg = (troll as any).healthBarFg;
        
        if (healthBarBg) {
            healthBarBg.destroy();
            (troll as any).healthBarBg = null;
        }
        
        if (healthBarFg) {
            healthBarFg.destroy();
            (troll as any).healthBarFg = null;
        }
    }

    /**
     * 更新BOSS行为
     */
    private updateBosses(delta: number) {
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        // 更新卢修斯
        for (let i = this.luciusEnemies.length - 1; i >= 0; i--) {
            const lucius = this.luciusEnemies[i];
            
            // 卢修斯进入屏幕后开始水平横移，不会走出屏幕
            if (lucius.y >= 120) { // 进入屏幕120像素后停止下降
                lucius.setVelocityY(0);
                (lucius as any).hasEnteredScreen = true;
                
                // 开始水平横移
                if (!(lucius as any).horizontalDirection) {
                    // 初次设置水平移动方向
                    (lucius as any).horizontalDirection = Math.random() < 0.5 ? -1 : 1; // 随机向左或向右
                    lucius.setVelocityX((lucius as any).horizontalDirection * 80); // 水平移动速度
                }
                
                // 检查是否需要改变方向（到达屏幕边缘）
                const gameWidth = this.cameras.main.width || window.innerWidth;
                if (lucius.x <= 50) {
                    // 到达左边界，强制向右移动
                    (lucius as any).horizontalDirection = 1;
                    lucius.setVelocityX(80);
                } else if (lucius.x >= gameWidth - 50) {
                    // 到达右边界，强制向左移动
                    (lucius as any).horizontalDirection = -1;
                    lucius.setVelocityX(-80);
                }
            }
            
            // 卢修斯不会自动离开屏幕，只在被击败时才移除
            // 移除原来的超出屏幕检查
            
            // 卢修斯特殊攻击（快速射击）- 昏迷时不攻击
            if (lucius.y > 100 && Math.random() < 0.02 && !(lucius as any).isStunned) { // 2%几率攻击
                this.bossShoot(lucius, 'green');
            }
            
            // 更新昏迷状态
            if ((lucius as any).isStunned) {
                if ((lucius as any).stunTimer > 0) {
                    (lucius as any).stunTimer -= delta;
                    lucius.setVelocity(0, 0); // 昏迷期间停止移动
                } else {
                    // 昏迷时间结束，清除昏迷状态并恢复移动
                    (lucius as any).isStunned = false;
                    lucius.clearTint();
                    // 恢复移动状态
                    if ((lucius as any).hasEnteredScreen) {
                        // 已经进入屏幕，恢复水平移动
                        if ((lucius as any).horizontalDirection && (lucius as any).originalSpeedX) {
                            lucius.setVelocityX((lucius as any).horizontalDirection * (lucius as any).originalSpeedX);
                        }
                    } else {
                        // 还在下降阶段，恢复垂直移动
                        if ((lucius as any).originalSpeedY) {
                            lucius.setVelocityY((lucius as any).originalSpeedY);
                        }
                    }
                }
            } else if ((lucius as any).hasEnteredScreen) {
                // 昏迷结束后恢复水平移动
                if ((lucius as any).horizontalDirection) {
                    lucius.setVelocityX((lucius as any).horizontalDirection * 80);
                }
            }
        }
        
        // 更新贝拉特里克斯
        for (let i = this.bellatrixEnemies.length - 1; i >= 0; i--) {
            const bellatrix = this.bellatrixEnemies[i];
            
            // 贝拉特里克斯进入屏幕后停止移动，不会走出屏幕
            if (bellatrix.y >= 150) { // 进入屏幕150像素后停止
                bellatrix.setVelocityY(0);
                (bellatrix as any).hasEnteredScreen = true;
            }
            
            // 贝拉特里克斯不会自动离开屏幕，只在被击败时才移除
            // 移除原来的超出屏幕检查
            
            // 贝拉特里克斯特殊攻击（随机追踪弹）- 昏迷时不攻击
            if (bellatrix.y > 100 && Math.random() < 0.015 && !(bellatrix as any).isStunned) { // 1.5%几率攻击，比卢修斯稍低
                this.bossShoot(bellatrix, 'purple');
            }
            
            // 更新昏迷状态
            if ((bellatrix as any).isStunned) {
                if ((bellatrix as any).stunTimer > 0) {
                    (bellatrix as any).stunTimer -= delta;
                    bellatrix.setVelocity(0, 0); // 昏迷期间停止移动
                } else {
                    // 昏迷时间结束，清除昏迷状态并恢复移动
                    (bellatrix as any).isStunned = false;
                    bellatrix.clearTint();
                    // 恢复原始移动速度
                    if ((bellatrix as any).originalSpeedY) {
                        bellatrix.setVelocityY((bellatrix as any).originalSpeedY);
                    }
                }
            }
        }
        
        // 更新巨怪
        for (let i = this.trolls.length - 1; i >= 0; i--) {
            const troll = this.trolls[i];
            
            if (troll.y > gameHeight + 100) {
                this.destroyTrollHealthBar(troll);
                troll.destroy();
                this.trolls.splice(i, 1);
                this.removeBossFromList(troll);
                
                // 如果这是最后一个巨怪，停止咆哮音效
                if (this.trolls.length === 0) {
                    this.stopTrollSound();
                }
                continue;
            }
            
            // 更新巨怪血条
            this.updateTrollHealthBar(troll);
            
            // 巨怪震动攻击 - 昏迷时或被漂浮咒影响时不攻击
            if (!(troll as any).isStunned && !(troll as any).isWingardiumTarget) {
                (troll as any).shakeTimer += delta;
                if ((troll as any).shakeTimer > 3000) { // 每3秒震动
                    this.createScreenShake(200, 5); // 强度200，持续5秒
                    (troll as any).shakeTimer = 0;
                    
                    // 巨怪震动对玩家造成伤害
                    if (this.damageCooldown <= 0) {
                        this.takeDamage(0.5);
                        this.damageCooldown = 1000; // 1秒伤害冷却
                    } else {
                    }
                }
            }
            
            // 更新昏迷状态
            if ((troll as any).isStunned) {
                if ((troll as any).stunTimer > 0) {
                    (troll as any).stunTimer -= delta;
                    troll.setVelocity(0, 0); // 昏迷期间停止移动
                } else {
                    // 昏迷时间结束，清除昏迷状态并恢复移动
                    (troll as any).isStunned = false;
                    troll.clearTint();
                    // 恢复原始移动速度
                    if ((troll as any).originalSpeedY) {
                        troll.setVelocityY((troll as any).originalSpeedY);
                    }
                }
            }
        }
        
        // 如果没有巨怪了，停止音效
        if (this.trolls.length === 0 && this.trollSoundPlaying) {
            this.stopTrollSound();
        }
        
        // 如果没有贝拉特里克斯了，停止音效
        if (this.bellatrixEnemies.length === 0 && this.bellatrixSoundPlaying) {
            this.stopBellatrixSound();
        }
    }

    /**
     * BOSS射击
     */
    private bossShoot(boss: Phaser.Physics.Arcade.Sprite, color: string) {
        // 昏迷的BOSS不能攻击
        if ((boss as any).isStunned) {
            return;
        }
        
        let bullet: Phaser.Physics.Arcade.Sprite;
        
        if (color === 'green') {
            // 卢修斯使用食死徒攻击纹理，但范围更大
            bullet = this.physics.add.sprite(boss.x, boss.y + 30, 'enemy_projectile');
            bullet.setScale(1.5); // 比普通食死徒攻击大1.5倍
            bullet.setTint(0x00ff00); // 绿色
            (bullet as any).damage = 1.0; // 1格血伤害
            
            // 添加闪烁效果
            this.tweens.add({
                targets: bullet,
                alpha: { from: 1, to: 0.6 },
                duration: 150,
                yoyo: true,
                repeat: -1
            });
        } else {
            // 贝拉特里克斯使用食死徒攻击纹理，紫色，追踪玩家
            bullet = this.physics.add.sprite(boss.x, boss.y + 30, 'enemy_projectile');
            bullet.setScale(1.2); // 比卢修斯稍小但比普通食死徒大
            bullet.setTint(0x8B008B); // 紫色
            (bullet as any).damage = 1.5; // 1.5格血伤害
            (bullet as any).isTracking = true; // 标记为追踪弹
            
            // 计算朝向玩家的方向，提高命中率
            if (this.player) {
                // 预测玩家位置提高命中率
                const playerVelX = this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.x : 0;
                const playerVelY = this.player.body ? (this.player.body as Phaser.Physics.Arcade.Body).velocity.y : 0;
                
                // 预测玩家0.3秒后的位置
                const predictTime = 0.3;
                const predictedX = this.player.x + playerVelX * predictTime;
                const predictedY = this.player.y + playerVelY * predictTime;
                
                const angle = Phaser.Math.Angle.Between(
                    bullet.x, bullet.y,
                    predictedX, predictedY
                );
                
                const speed = 220; // 提高追踪弹速度，增加命中率
                bullet.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
                
            } else {
                // 如果没有玩家，向下发射
                bullet.setVelocityY(200);
            }
            
            // 添加紫色闪烁效果
            this.tweens.add({
                targets: bullet,
                alpha: { from: 1, to: 0.7 },
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }
        
        // 只有卢修斯的绿色子弹才设置向下速度
        if (color === 'green') {
            bullet.setVelocityY(200);
        }
        bullet.setDepth(8);
        
        // 标记为BOSS子弹
        (bullet as any).isBossBullet = true;
        
        this.enemyBullets.push(bullet);
        
    }

    /**
     * 从BOSS列表中移除
     */
    private removeBossFromList(boss: Phaser.Physics.Arcade.Sprite) {
        const index = this.bosses.indexOf(boss);
        if (index > -1) {
            this.bosses.splice(index, 1);
        }
    }

    /**
     * 创建屏幕震动
     */
    private createScreenShake(intensity: number, duration: number) {
        this.screenShakeIntensity = intensity;
        
        this.time.delayedCall(duration * 1000, () => {
            this.screenShakeIntensity = 0;
        });
    }

    /**
     * 更新屏幕震动效果
     */
    private updateScreenShake(delta: number) {
        if (this.screenShakeIntensity > 0) {
            // 随机震动摄像机
            const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 0.1;
            const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 0.1;
            
            this.cameras.main.setScroll(shakeX, shakeY);
            
            // 逐渐减少震动强度
            this.screenShakeIntensity *= 0.95;
            
            if (this.screenShakeIntensity < 1) {
                this.screenShakeIntensity = 0;
                this.cameras.main.setScroll(0, 0);
            }
        }
    }

    /**
     * 设置随机食物生成间隔
     */
    private setRandomFoodSpawnInterval() {
        this.currentFoodSpawnInterval = this.FOOD_SPAWN_MIN_INTERVAL + 
            Math.random() * (this.FOOD_SPAWN_MAX_INTERVAL - this.FOOD_SPAWN_MIN_INTERVAL);
        
    }

    /**
     * 生成食物
     */
    private spawnFood() {
        const gameWidth = this.cameras.main.width || window.innerWidth;
        
        // 随机选择食物类型，基于概率
        const random = Math.random();
        let selectedFoodType: string;
        let healAmount: number;
        
        if (random < 0.5) {
            selectedFoodType = 'chocolate_frog'; // 50% 概率
            healAmount = 0.5;
        } else if (random < 0.8) {
            selectedFoodType = 'butterbeer'; // 30% 概率
            healAmount = 1.0;
        } else {
            selectedFoodType = 'chicken'; // 20% 概率
            healAmount = 1.0;
        }
        
        // 随机生成位置
        const x = Math.random() * (gameWidth - 100) + 50;
        const y = -50;
        
        // 创建食物精灵（使用 Arcade 物理系统以便与玩家碰撞检测）
        const food = this.physics.add.sprite(x, y, selectedFoodType);
        food.setScale(0.08); // 食物尺寸
        food.setDepth(5);
        
        // 设置食物的物理属性
        food.body!.setVelocityY(50); // 向下掉落
        food.body!.setGravityY(100); // 重力加速度
        
        // 添加食物属性
        (food as any).foodType = selectedFoodType;
        (food as any).healAmount = healAmount;
        (food as any).lifeTimer = 12000; // 12秒存活时间
        
        // 添加轻微的发光效果和旋转
        food.setTint(0xFFFFAA); // 淡黄色光芒
        
        // 添加旋转和发光动画
        this.tweens.add({
            targets: food,
            rotation: { from: 0, to: Math.PI * 2 },
            alpha: { from: 1, to: 0.8 },
            duration: 2000,
            repeat: -1,
            yoyo: true
        });

        this.foods.push(food);

        // 生成食物后重新设置随机间隔
        this.setRandomFoodSpawnInterval();
    }

    /**
     * 更新食物
     */
    private updateFoods(delta: number) {
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            
            // 更新食物存活时间
            (food as any).lifeTimer -= delta;
            
            // 检查食物是否超出屏幕底部或存活时间结束
            if (food.y > gameHeight + 50 || (food as any).lifeTimer <= 0) {
                food.destroy();
                this.foods.splice(i, 1);
                continue;
            }
        }
    }

    /**
     * 更新浮动武器
     */
    private updateFloatingWeapons(delta: number) {
        const gameHeight = this.cameras.main.height || window.innerHeight;
        
        for (let i = this.floatingWeapons.length - 1; i >= 0; i--) {
            const weapon = this.floatingWeapons[i];
            const targetTroll = (weapon as any).targetTroll;
            
            // 检查目标巨怪是否还存在
            if (!targetTroll || !targetTroll.active || !this.trolls.includes(targetTroll)) {
                weapon.destroy();
                this.floatingWeapons.splice(i, 1);
                continue;
            }
            
            // 检查武器是否超出屏幕
            if (weapon.y > gameHeight + 100) {
                weapon.destroy();
                this.floatingWeapons.splice(i, 1);
                continue;
            }
            
            // 跟随巨怪移动
            const targetX = targetTroll.x + 60;
            const targetY = targetTroll.y - 30;
            
            // 平滑移动到目标位置
            const moveSpeed = 100;
            const dx = targetX - weapon.x;
            const dy = targetY - weapon.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                weapon.setVelocity(
                    (dx / distance) * moveSpeed,
                    (dy / distance) * moveSpeed
                );
            } else {
                weapon.setVelocity(0, 0);
            }
            
            // 更新攻击计时器
            (weapon as any).attackTimer += delta;
            
            // 检查是否可以攻击
            if ((weapon as any).attackTimer >= (weapon as any).attackInterval) {
                this.weaponAttackTroll(weapon, targetTroll);
                (weapon as any).attackTimer = 0;
            }
        }
    }

    /**
     * 武器攻击巨怪
     */
    private weaponAttackTroll(weapon: Phaser.Physics.Arcade.Sprite, troll: Phaser.Physics.Arcade.Sprite) {
        // 增加击中次数
        (weapon as any).hitCount += 1;
        (troll as any).wingardiumHitCount += 1;
        
        
        // 创建攻击特效
        const effect = this.physics.add.sprite(troll.x, troll.y, 'wingardium_leviosa');
        effect.setScale(0.15);
        effect.setDepth(17);
        effect.setTint(0xFFD700); // 金色特效
        
        // 特效动画
        this.tweens.add({
            targets: effect,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 0.15, to: 0.25 },
            scaleY: { from: 0.15, to: 0.25 },
            duration: 800,
            onComplete: () => {
                effect.destroy();
            }
        });
        
        // 巨怪受击效果
        troll.setTint(0xFFFFFF);
        this.time.delayedCall(200, () => {
            if (troll && troll.active) {
                troll.clearTint();
            }
        });
        
        // 检查是否击中3次
        if ((troll as any).wingardiumHitCount >= 3) {
            
            // 巨怪被击败
            this.addScore(1200); // 漂浮咒击败巨怪得更高分数
            this.bossesKilled++;
            
            // 清理血条
            this.destroyTrollHealthBar(troll);
            
            // 停止震动效果
            this.screenShakeIntensity = 0;
            this.cameras.main.setScroll(0, 0);
            
            // 销毁武器
            weapon.destroy();
            this.floatingWeapons.splice(this.floatingWeapons.indexOf(weapon), 1);
            
            // 销毁巨怪
            troll.destroy();
            this.trolls.splice(this.trolls.indexOf(troll), 1);
            this.removeBossFromList(troll);
            
            // 如果这是最后一个巨怪，停止咆哮音效
            if (this.trolls.length === 0) {
                this.stopTrollSound();
            }
            
            // BOSS被击败后重置生成计时器
            this.bossSpawnTimer = 0;
        }
    }
} 