import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { CharacterSelection } from './ui/CharacterSelection';
import { GameHUD } from './ui/GameHUD';
import { GameInstructions } from './ui/GameInstructions';
import { DementorOverlay } from './ui/DementorOverlay';
import { RonModeOverlay } from './ui/RonModeOverlay';
import LoginScreen from './ui/LoginScreen';
import Leaderboard from './ui/Leaderboard';
import { PlayerCharacter } from './entities/Player';
import FirebaseService, { auth } from './firebase.config';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Logger } from './utils/Logger';
import { SimpleMainScene } from './phaser/scenes/SimpleMainScene';
import { EventBus } from './phaser/EventBus';

interface PhaserGameEngineProps {
    title: string;
    width?: number;
    height?: number;
}

export const PhaserGameEngine: React.FC<PhaserGameEngineProps> = () => {
    const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter>(PlayerCharacter.HARRY);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gameStats, setGameStats] = useState({
        score: 0,
        lives: 5,
        ultimateSkillCharges: 0
    });
    
    const [characterSwitchCooldown, setCharacterSwitchCooldown] = useState<number>(0);
    const [skillCooldowns, setSkillCooldowns] = useState<{
        patronus: number;
        stupefy: number;
        wingardium: number;
    }>({ patronus: 0, stupefy: 0, wingardium: 0 });
    const [currentCharacter, setCurrentCharacter] = useState<string>(PlayerCharacter.HARRY);
    const [dementorActive, setDementorActive] = useState(false);
    const [manaState, setManaState] = useState({ current: 30, max: 30 });
    
    // Firebase用户状态
    const [user, setUser] = useState<User | null>(null);
    const [showLoginScreen, setShowLoginScreen] = useState(true);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [lastGameScore, setLastGameScore] = useState<number>(0);
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    
    // Phaser game refs
    const gameRef = useRef<HTMLDivElement>(null);
    const phaserGameRef = useRef<Phaser.Game | null>(null);
    const menuMusicRef = useRef<HTMLAudioElement | null>(null);
    const logger = Logger.getInstance();
    const scoreSubmittedRef = useRef<boolean>(false);

    const [canvasSize, setCanvasSize] = useState({ 
        width: window.innerWidth, 
        height: window.innerHeight 
    });

    // 初始化菜单音乐
    useEffect(() => {
        try {
            menuMusicRef.current = new Audio('/sound/role_choose_music.MP3');
            menuMusicRef.current.volume = 0.4;
            menuMusicRef.current.loop = true;
            menuMusicRef.current.preload = 'auto';
        } catch (error) {
            console.warn('无法加载全局菜单音乐:', error);
        }

        return () => {
            if (menuMusicRef.current) {
                menuMusicRef.current.pause();
                menuMusicRef.current.currentTime = 0;
            }
        };
    }, []);

    // 菜单音乐控制
    const playMenuMusic = async () => {
        if (menuMusicRef.current && menuMusicRef.current.paused) {
            try {
                await menuMusicRef.current.play();
            } catch (error) {
                console.warn('播放全局菜单音乐失败:', error);
                const handleUserInteraction = async () => {
                    try {
                        await menuMusicRef.current?.play();
                        document.removeEventListener('click', handleUserInteraction);
                        document.removeEventListener('keydown', handleUserInteraction);
                    } catch (e) {
                        console.warn('用户交互后播放音乐仍然失败:', e);
                    }
                };
                document.addEventListener('click', handleUserInteraction);
                document.addEventListener('keydown', handleUserInteraction);
            }
        }
    };

    const stopMenuMusic = () => {
        if (menuMusicRef.current && !menuMusicRef.current.paused) {
            menuMusicRef.current.pause();
            menuMusicRef.current.currentTime = 0;
        }
    };

    // 菜单音乐控制
    useEffect(() => {
        if (showLoginScreen || !gameStarted) {
            playMenuMusic();
        } else {
            stopMenuMusic();
        }
    }, [showLoginScreen, gameStarted]);

    // 监听Firebase认证状态
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                setShowLoginScreen(false);
                Logger.getInstance().info('PhaserGameEngine', `用户已登录: ${user.displayName || user.uid}`);
            } else {
                setShowLoginScreen(true);
                setGameStarted(false);
                Logger.getInstance().info('PhaserGameEngine', '用户未登录');
            }
        });

        return () => unsubscribe();
    }, []);

    // 处理登录成功
    const handleLoginSuccess = (user: User) => {
        setUser(user);
        setShowLoginScreen(false);
        Logger.getInstance().info('PhaserGameEngine', `登录成功: ${user.displayName || user.uid}`);
    };

    // 处理游戏结束
    const handleGameOver = async (finalScore: number) => {
        
        if (scoreSubmittedRef.current) {
            return;
        }
        
        scoreSubmittedRef.current = true;
        
        const firebaseUser = auth.currentUser;
        
        setGameOver(true);
        setLastGameScore(finalScore);
        setScoreSubmitted(true);
        
        const currentUser = firebaseUser || user;
        
        if (currentUser && finalScore > 0) {
            try {
                const characterName = currentCharacter.charAt(0).toUpperCase() + currentCharacter.slice(1).toLowerCase();
                
                await FirebaseService.submitScore(finalScore, characterName, 'normal');
                Logger.getInstance().info('PhaserGameEngine', `Score submitted successfully: ${finalScore} by ${characterName}`);
            } catch (error) {
                Logger.getInstance().error('PhaserGameEngine', 'Failed to submit score:', error);
                setScoreSubmitted(false);
                scoreSubmittedRef.current = false;
            }
        }
        
        Logger.getInstance().info('PhaserGameEngine', `=== GAME OVER HANDLER END ===`);
    };

    // 重新开始游戏
    const handleRestartGame = () => {
        setGameOver(false);
        setGameStarted(false);
        setLastGameScore(0);
        setScoreSubmitted(false);
        scoreSubmittedRef.current = false;
        setGameStats({
            score: 0,
            lives: 5,
            ultimateSkillCharges: 0
        });
        
        // 重置Phaser游戏
        if (phaserGameRef.current) {
            EventBus.emit('restart-game');
        }
    };

    // 显示排行榜
    const handleShowLeaderboard = () => {
        setShowLeaderboard(true);
    };

    // 登出
    const handleLogout = async () => {
        try {
            await FirebaseService.signOut();
            setUser(null);
            setShowLoginScreen(true);
            setGameStarted(false);
            setGameOver(false);
        } catch (error) {
            Logger.getInstance().error('PhaserGameEngine', '登出失败:', error);
        }
    };

    // 角色选择处理函数
    const handleCharacterSelect = (character: PlayerCharacter) => {
        setSelectedCharacter(character);
    };

    // 游戏开始处理函数
    const handleGameStart = (character: PlayerCharacter) => {
        setSelectedCharacter(character);
        setCurrentCharacter(character);
        setGameStarted(true);
        
        // 通知Phaser游戏开始
        if (phaserGameRef.current) {
            EventBus.emit('start-game', { character });
        }
    };

    // 游戏中角色切换处理函数
    const handleCharacterSwitch = (character: PlayerCharacter) => {
        if (characterSwitchCooldown > 0) {
            return;
        }

        if (selectedCharacter === character) {
            return;
        }

        setSelectedCharacter(character);
        setCurrentCharacter(character);
        setCharacterSwitchCooldown(15);

        // 通知Phaser游戏切换角色
        if (phaserGameRef.current) {
            EventBus.emit('switch-character', { character });
        }
    };

    // 初始化Phaser游戏
    useEffect(() => {
        if (!gameRef.current || phaserGameRef.current) return;

        // 强制使用 Canvas 渲染器避免 WebGL 问题

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.CANVAS,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: gameRef.current,
            backgroundColor: '#001122',
            render: {
                antialias: false,
                transparent: false,
                clearBeforeRender: true
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: [SimpleMainScene],
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            fps: {
                target: 60,
                forceSetTimeOut: false
            },
            banner: {
                hidePhaser: true,
                text: '#ffffff',
                background: [
                    '#16537e',
                    '#8b5cf6'
                ]
            }
        };

        phaserGameRef.current = new Phaser.Game(config);

        // 设置事件监听
        EventBus.on('score-updated', (score: number) => {
            setGameStats(prev => ({ ...prev, score: score }));
        });

        EventBus.on('lives-updated', (lives: number) => {
            setGameStats(prev => ({ ...prev, lives }));
        });

        EventBus.on('ultimate-charges-updated', (charges: number) => {
            setGameStats(prev => ({ ...prev, ultimateSkillCharges: charges }));
        });

        EventBus.on('character-switched', (data: { character: string; cooldownTime: number }) => {
            setCurrentCharacter(data.character);
            setCharacterSwitchCooldown(data.cooldownTime);
        });

        EventBus.on('dementor-spawned', () => {
            setDementorActive(true);
        });

        EventBus.on('dementor-defeated', () => {
            setDementorActive(false);
        });

        EventBus.on('game-over', (data: { score: number }) => {
            handleGameOver(data.score);
        });

        EventBus.on('skill-cooldowns-updated', (cooldowns: { patronus: number; stupefy: number; wingardium: number }) => {
            setSkillCooldowns(cooldowns);
        });

        EventBus.on('mana-updated', (manaData: { current: number; max: number }) => {
            setManaState(manaData);
        });

        // 窗口大小调整
        const handleResize = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            setCanvasSize({ width: newWidth, height: newHeight });
            
            if (phaserGameRef.current) {
                phaserGameRef.current.scale.resize(newWidth, newHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            
            // 清理事件监听
            EventBus.removeAllListeners();
            
            if (phaserGameRef.current) {
                phaserGameRef.current.destroy(true);
                phaserGameRef.current = null;
            }
        };
    }, []);

    // 角色切换冷却倒计时
    useEffect(() => {
        const interval = setInterval(() => {
            if (characterSwitchCooldown > 0) {
                setCharacterSwitchCooldown(prev => Math.max(0, prev - 0.1));
            }
        }, 100);
        
        return () => clearInterval(interval);
    }, [characterSwitchCooldown]);

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* 登录界面 */}
            {showLoginScreen && (
                <LoginScreen onLoginSuccess={handleLoginSuccess} />
            )}

            {/* 排行榜 */}
            <Leaderboard 
                user={user}
                isVisible={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
            />

            {/* Phaser 游戏容器 */}
            <div 
                ref={gameRef}
                style={{
                    display: showLoginScreen ? 'none' : 'block',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
            />
            
            {/* 用户信息和游戏功能按钮 */}
            {user && !showLoginScreen && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 100,
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    fontFamily: '"Cinzel", serif'
                }}>
                    <div style={{
                        background: 'rgba(25, 25, 112, 0.8)',
                        color: '#FFD700',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        border: '1px solid #FFD700',
                        fontSize: '0.9rem',
                        backdropFilter: 'blur(5px)'
                    }}>
                        👋 {user.displayName || 'Guest'}
                    </div>
                    
                    <button
                        onClick={handleShowLeaderboard}
                        style={{
                            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                            color: '#000',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontFamily: '"Cinzel", serif'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        🏆 Leaderboard
                    </button>
                    
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'rgba(220, 20, 60, 0.8)',
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontFamily: '"Cinzel", serif'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.background = 'rgba(220, 20, 60, 1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.background = 'rgba(220, 20, 60, 0.8)';
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>
            )}
            
            {/* React HUD显示游戏信息 */}
            {!showLoginScreen && (
                <GameHUD 
                    score={gameStats.score}
                    lives={gameStats.lives}
                    characterSwitchCooldown={characterSwitchCooldown}
                    currentCharacter={currentCharacter}
                    ultimateSkillCharges={gameStats.ultimateSkillCharges}
                    skillCooldowns={skillCooldowns}
                    mana={manaState}
                />
            )}
            
            {/* 游戏说明 */}
            {!gameStarted && !showLoginScreen && <GameInstructions />}
            
            {/* 角色选择界面 */}
            {!showLoginScreen && (
                <CharacterSelection 
                    onCharacterSelect={gameStarted ? handleCharacterSwitch : handleCharacterSelect}
                    onGameStart={handleGameStart}
                    currentCharacter={gameStarted ? (currentCharacter as PlayerCharacter) : selectedCharacter}
                    gameStarted={gameStarted}
                    switchCooldown={characterSwitchCooldown}
                    skillCooldowns={skillCooldowns}
                    user={user}
                    onShowLeaderboard={handleShowLeaderboard}
                    onLogout={handleLogout}
                />
            )}
            
            {/* 摄魂怪遮罩 */}
            {dementorActive && !showLoginScreen && <DementorOverlay isVisible={dementorActive} />}
            
            {/* 罗恩模式覆盖 */}
            {!showLoginScreen && <RonModeOverlay />}

            {/* 游戏结束对话框 */}
            {gameOver && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001,
                    fontFamily: '"Cinzel", serif'
                }}>
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.95) 0%, rgba(25, 25, 112, 0.95) 100%)',
                        borderRadius: '20px',
                        border: '2px solid #FFD700',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                        padding: '3rem',
                        textAlign: 'center',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{
                            color: '#FFD700',
                            fontSize: '2.2rem',
                            marginBottom: '1rem',
                            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                        }}>
                            🎯 Game Over
                        </h2>
                        
                        <p style={{
                            color: '#E6E6FA',
                            fontSize: '1.3rem',
                            marginBottom: '2rem'
                        }}>
                            Final Score: <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{lastGameScore}</span>
                        </p>
                        
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={handleRestartGame}
                                style={{
                                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '25px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontFamily: '"Cinzel", serif'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                🔄 Play Again
                            </button>
                            
                            <button
                                onClick={handleShowLeaderboard}
                                style={{
                                    background: 'linear-gradient(45deg, #8B4513, #DAA520)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '1rem 2rem',
                                    borderRadius: '25px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    fontFamily: '"Cinzel", serif'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 69, 19, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                🏆 View Leaderboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhaserGameEngine; 