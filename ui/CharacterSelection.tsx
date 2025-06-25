import React, { useState, useRef, useEffect } from 'react';
import { PlayerCharacter } from '../entities/Player';

interface CharacterSelectionProps {
    onCharacterSelect: (character: PlayerCharacter) => void;
    onGameStart?: (character: PlayerCharacter) => void;
    currentCharacter: PlayerCharacter;
    gameStarted?: boolean;
    switchCooldown?: number;
    skillCooldowns?: {
        patronus: number;
        stupefy: number;
        wingardium: number;
    };
    // new user menu related props
    user?: any;
    onShowLeaderboard?: () => void;
    onLogout?: () => void;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
    onCharacterSelect,
    onGameStart,
    currentCharacter,
    gameStarted = false,
    switchCooldown = 0,
    skillCooldowns = { patronus: 0, stupefy: 0, wingardium: 0 },
    user,
    onShowLeaderboard,
    onLogout
}) => {
    // sound related
    const cardClickSoundRef = useRef<HTMLAudioElement | null>(null);
    const beginQuestSoundRef = useRef<HTMLAudioElement | null>(null);

    // load sound
    useEffect(() => {
        try {
            // card click sound
            cardClickSoundRef.current = new Audio('/sound/card-sounds.mp3');
            cardClickSoundRef.current.volume = 0.4; // set volume
            cardClickSoundRef.current.preload = 'auto';

            // Begin Quest button sound
            beginQuestSoundRef.current = new Audio('/sound/ui-button-heavy-button-press-metallic.mp3');
            beginQuestSoundRef.current.volume = 0.5; // set volume
            beginQuestSoundRef.current.preload = 'auto';
        } catch (error) {
            console.warn('Failed to load sound:', error);
        }
    }, []);

    // play card click sound
    const playCardClickSound = () => {
        if (cardClickSoundRef.current) {
            cardClickSoundRef.current.currentTime = 0;
            cardClickSoundRef.current.play().catch(error => {
                console.warn('Failed to play card click sound:', error);
            });
        }
    };

    // play Begin Quest button sound
    const playBeginQuestSound = () => {
        if (beginQuestSoundRef.current) {
            beginQuestSoundRef.current.currentTime = 0;
            beginQuestSoundRef.current.play().catch(error => {
                console.warn('Failed to play Begin Quest sound:', error);
            });
        }
    };
    const characters = [
        {
            id: PlayerCharacter.HARRY,
            name: 'Harry Potter',
            image: '/images/harry.png',
            spell: 'Patronus Charm',
            spellIcon: '/images/Patronus Charm.png',
            storyDescription: '"Expecto Patronum!" His silver stag Patronus drives away Dementors with the power of his happiest memories.'
        },
        {
            id: PlayerCharacter.HERMIONE,
            name: 'Hermione Granger',
            image: '/images/hermione.png',
            spell: 'Stupefy',
            spellIcon: '/images/Stupefy.png',
            storyDescription: '"Stupefy!" Her precise wand work and quick thinking have stunned countless enemies to protect her friends.'
        },
        {
            id: PlayerCharacter.RON,
            name: 'Ron Weasley',
            image: '/images/ron.png',
            spell: 'Wingardium Leviosa',
            spellIcon: '/images/Wingardium Leviosa.png',
            storyDescription: '"Wingardium Leviosa!" The levitation charm that helped defeat the mountain troll in their first year at Hogwarts.'
        }
    ];

    // if game started, show the small interface in the left bottom
    if (gameStarted) {
    const selectedCharacter = characters.find(char => char.id === currentCharacter) || characters[0];

    return (
        <div style={{
            position: 'fixed',
            left: '20px',
            bottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            zIndex: 1000
        }}>
            {/* left bottom character selection buttons */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                {characters.map((character) => (
                    <button
                        key={character.id}
                        onClick={() => {
                                if (switchCooldown > 0) {
                                // Character switch cooldown
                                return;
                            }
                                playCardClickSound(); // play card click sound
                                onCharacterSelect(character.id);
                        }}
                        style={{
                            width: '60px',
                            height: '60px',
                                border: currentCharacter === character.id ? '3px solid rgba(211, 166, 37, 0.8)' : '2px solid rgba(102, 102, 102, 0.6)',
                            borderRadius: '8px',
                                background: currentCharacter === character.id ? 'rgba(211, 166, 37, 0.15)' : 
                                           (switchCooldown > 0) ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                                cursor: (switchCooldown > 0) ? 'not-allowed' : 'pointer',
                            padding: '5px',
                            transition: 'all 0.3s ease',
                            transform: currentCharacter === character.id ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: currentCharacter === character.id ? '0 0 15px rgba(211, 166, 37, 0.3)' : 'none',
                                opacity: (switchCooldown > 0 && currentCharacter !== character.id) ? 0.4 : 0.85,
                                backdropFilter: 'blur(3px)',
                                position: 'relative',
                                overflow: 'hidden'
                        }}
                    >
                        <img 
                            src={character.image} 
                            alt={character.name}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                            
                            {/* character button cooldown mask */}
                            {switchCooldown > 0 && currentCharacter !== character.id && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFD700',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    fontFamily: 'Arial, sans-serif'
                                }}>
                                    {switchCooldown.toFixed(0)}
                                </div>
                            )}
                    </button>
                ))}
            </div>

                {/* character information display */}
            <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(211, 166, 37, 0.6)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                minWidth: '200px',
                maxWidth: '220px',
                boxShadow: '0 0 15px rgba(211, 166, 37, 0.15)',
                backdropFilter: 'blur(4px)',
                opacity: 0.95
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 8px',
                    border: '2px solid rgba(211, 166, 37, 0.6)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'rgba(211, 166, 37, 0.05)'
                }}>
                    <img 
                        src={selectedCharacter.image} 
                        alt={selectedCharacter.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
                </div>
                <h3 style={{
                    color: '#D3A625',
                    margin: '0 0 6px',
                    fontSize: '16px',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    {selectedCharacter.name}
                </h3>
                <p style={{
                    color: '#fff',
                    margin: '0 0 10px',
                    fontSize: '12px',
                    fontFamily: 'Arial, sans-serif'
                }}>
                    {selectedCharacter.spell}
                </p>
                
                {/* spell icon and key hint */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '10px'
                }}>
                    <div style={{
                        position: 'relative',
                        width: '45px',
                        height: '45px',
                        marginBottom: '6px'
                    }}>
                        <img 
                            src={selectedCharacter.spellIcon} 
                            alt={selectedCharacter.spell}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                        
                        {/* skill cooldown mask */}
                        {(() => {
                            let skillCooldown = 0;
                            switch (selectedCharacter.id) {
                                case PlayerCharacter.HARRY:
                                    skillCooldown = skillCooldowns.patronus;
                                    break;
                                case PlayerCharacter.HERMIONE:
                                    skillCooldown = skillCooldowns.stupefy;
                                    break;
                                case PlayerCharacter.RON:
                                    skillCooldown = skillCooldowns.wingardium;
                                    break;
                            }
                            return skillCooldown > 0 ? (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFD700',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    fontFamily: 'Arial, sans-serif',
                                    borderRadius: '6px'
                                }}>
                                    {skillCooldown.toFixed(1)}s
                                </div>
                            ) : null;
                        })()}
                    </div>
                    
                    {/* key hint */}
                    <div style={{
                        background: 'rgba(211, 166, 37, 0.15)',
                        border: '1px solid rgba(211, 166, 37, 0.4)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        color: '#D3A625',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold'
                    }}>
                        Press P
                    </div>
                </div>
                
                <div style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'center'
                }}>
                    {switchCooldown > 0 ? (
                        <div style={{ color: '#FF6666' }}>
                            Switch Cooldown
                        </div>
                    ) : (
                        <div style={{ color: '#00FF00' }}>
                            Ready to Switch
                        </div>
                    )}
                    <div style={{ 
                        color: '#ccc', 
                        fontSize: '9px', 
                        marginTop: '3px' 
                    }}>
                        Press 1/2/3 or click to switch
                    </div>
                </div>
            </div>
        </div>
    );
    }

    // show the big card selection interface before game start
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(ellipse at center, rgba(25, 25, 112, 0.9) 0%, rgba(72, 61, 139, 0.95) 30%, rgba(0, 0, 0, 0.98) 70%, rgba(0, 0, 0, 1) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)',
            fontFamily: '"Cinzel", "Times New Roman", serif'
        }}>
            {/* 魔法粒子背景效果 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `
                    radial-gradient(2px 2px at 20px 30px, gold, transparent),
                    radial-gradient(2px 2px at 40px 70px, silver, transparent),
                    radial-gradient(1px 1px at 90px 40px, gold, transparent),
                    radial-gradient(1px 1px at 130px 80px, silver, transparent),
                    radial-gradient(2px 2px at 160px 30px, gold, transparent)
                `,
                backgroundRepeat: 'repeat',
                backgroundSize: '200px 100px',
                animation: 'sparkle 4s ease-in-out infinite alternate',
                opacity: 0.6,
                pointerEvents: 'none'
            }} />

            {/* user menu - top right */}
            {user && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    zIndex: 2001
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
                        onClick={onShowLeaderboard}
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
                        onClick={onLogout}
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

            {/* title */}
            <h1 style={{
                color: '#FFD700',
                fontSize: '48px',
                marginTop: '20px',
                marginBottom: '8px',
                textAlign: 'center',
                fontFamily: '"Cinzel", "Times New Roman", serif',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)',
                fontWeight: 'bold',
                letterSpacing: '2px',
                textTransform: 'uppercase'
            }}>
                ⚡ Hogwarts Heroes ⚡
            </h1>
            
            <div style={{
                width: '250px',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #FFD700, transparent)',
                marginBottom: '15px'
            }} />
            
            <p style={{
                color: '#E6E6FA',
                fontSize: '18px',
                marginBottom: '30px',
                textAlign: 'center',
                fontFamily: '"Cinzel", "Georgia", serif',
                maxWidth: '600px',
                lineHeight: '1.6',
                fontStyle: 'italic',
                textShadow: '0 0 10px rgba(230, 230, 250, 0.5)'
            }}>
                "It is our choices, Harry, that show what we truly are, far more than our abilities."
                <br />
                <span style={{ fontSize: '15px', color: '#C0C0C0' }}>— Albus Dumbledore</span>
            </p>

            {/* character cards */}
            <div style={{
                display: 'flex',
                gap: '50px',
                maxWidth: '1400px',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                {characters.map((character) => (
                    <div
                        key={character.id}
                        onClick={() => {
                            playCardClickSound(); // play card click sound
                            onCharacterSelect(character.id);
                        }}
                        style={{
                            width: '340px',
                            height: '480px',
                            background: currentCharacter === character.id 
                                ? 'linear-gradient(145deg, rgba(255, 215, 0, 0.15) 0%, rgba(139, 69, 19, 0.8) 30%, rgba(25, 25, 112, 0.9) 100%)'
                                : 'linear-gradient(145deg, rgba(139, 69, 19, 0.7) 0%, rgba(25, 25, 112, 0.8) 50%, rgba(0, 0, 0, 0.9) 100%)',
                            border: currentCharacter === character.id 
                                ? '3px solid #FFD700' 
                                : '2px solid rgba(139, 69, 19, 0.6)',
                            borderRadius: '25px',
                            padding: '70px 30px 30px 30px',
                            cursor: 'pointer',
                            transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            transform: currentCharacter === character.id ? 'scale(1.08) translateY(-10px)' : 'scale(1)',
                            boxShadow: currentCharacter === character.id 
                                ? '0 25px 50px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 30px rgba(255, 215, 0, 0.1)' 
                                : '0 15px 35px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(139, 69, 19, 0.2)',
                            backdropFilter: 'blur(15px)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'visible'
                        }}
                        onMouseOver={(e) => {
                            if (currentCharacter !== character.id) {
                                e.currentTarget.style.transform = 'scale(1.04) translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 215, 0, 0.2), inset 0 0 25px rgba(139, 69, 19, 0.3)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (currentCharacter !== character.id) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(139, 69, 19, 0.2)';
                            }
                        }}
                    >
                        {/* magic halo effect */}
                        {currentCharacter === character.id && (
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                left: '-10px',
                                right: '-10px',
                                bottom: '-10px',
                                border: '2px solid rgba(255, 215, 0, 0.3)',
                                borderRadius: '30px',
                                animation: 'glow 2s ease-in-out infinite alternate'
                            }} />
                        )}

                        {/* 角色图片 */}
                        <div style={{
                            width: '160px',
                            height: '210px',
                            marginTop: '-90px',
                            marginBottom: '15px',
                            position: 'relative',
                            zIndex: 10
                        }}>
                            <img 
                                src={character.image} 
                                alt={character.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: currentCharacter === character.id 
                                        ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 215, 0, 0.4))'
                                        : 'drop-shadow(0 5px 15px rgba(0, 0, 0, 0.5))',
                                    transition: 'all 0.4s ease'
                                }}
                            />
                            {/* character glowing effect */}
                            {currentCharacter === character.id && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '220px',
                                    height: '220px',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 50%, transparent 70%)',
                                    borderRadius: '50%',
                                    animation: 'glow 2s ease-in-out infinite alternate',
                                    zIndex: -1
                                }} />
                            )}
                        </div>

                        {/* character name */}
                        <h2 style={{
                            color: currentCharacter === character.id ? '#FFD700' : '#DEB887',
                            fontSize: '24px',
                            margin: '0 0 15px',
                            fontFamily: '"Cinzel", "Times New Roman", serif',
                            textShadow: currentCharacter === character.id 
                                ? '0 0 15px rgba(255, 215, 0, 0.8)' 
                                : '0 0 10px rgba(222, 184, 135, 0.5)',
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                        }}>
                            {character.name}
                        </h2>

                        {/* spell name */}
                        <div style={{
                            background: currentCharacter === character.id 
                                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(139, 69, 19, 0.3) 100%)'
                                : 'linear-gradient(135deg, rgba(139, 69, 19, 0.3) 0%, rgba(0, 0, 0, 0.4) 100%)',
                            border: currentCharacter === character.id 
                                ? '2px solid rgba(255, 215, 0, 0.5)' 
                                : '2px solid rgba(139, 69, 19, 0.5)',
                            borderRadius: '15px',
                            padding: '12px 20px',
                            marginBottom: '20px',
                            width: '100%',
                            boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.3)'
                        }}>
                            <div style={{
                                color: currentCharacter === character.id ? '#FFD700' : '#DEB887',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                fontFamily: '"Cinzel", "Times New Roman", serif',
                                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
                                letterSpacing: '1px'
                            }}>
                                {character.spell}
                            </div>
                        </div>

                        {/* story description */}
                        <p style={{
                            color: '#F5F5DC',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            fontFamily: '"Cinzel", "Georgia", serif',
                            fontStyle: 'italic',
                            marginBottom: '0',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            textAlign: 'center',
                            textShadow: '0 0 8px rgba(245, 245, 220, 0.3)',
                            padding: '0 10px'
                        }}>
                            {character.storyDescription}
                        </p>
                    </div>
                ))}
            </div>

            {/* begin game button */}
            <div style={{
                marginTop: '35px',
                textAlign: 'center'
            }}>
                <button
                    onClick={() => {
                        playBeginQuestSound(); // play Begin Quest button sound
                        // delay 0.5 seconds before game start, let the sound play complete
                        setTimeout(() => {
                            if (onGameStart) {
                                onGameStart(currentCharacter);
                            }
                        }, 500);
                    }}
                    style={{
                        padding: '18px 50px',
                        fontSize: '26px',
                        fontWeight: 'bold',
                        fontFamily: '"Cinzel", "Times New Roman", serif',
                        background: 'linear-gradient(145deg, #FFD700 0%, #DAA520 50%, #B8860B 100%)',
                        color: '#8B4513',
                        border: '3px solid #B8860B',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        boxShadow: '0 15px 30px rgba(255, 215, 0, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                        marginBottom: '25px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08) translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 215, 0, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(145deg, #FFE55C 0%, #DDBF00 50%, #CD9500 100%)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(255, 215, 0, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.3)';
                        e.currentTarget.style.background = 'linear-gradient(145deg, #FFD700 0%, #DAA520 50%, #B8860B 100%)';
                    }}
                    onMouseDown={(e) => {
                        // press effect: down press, shrink, shadow reduce
                        e.currentTarget.style.transform = 'scale(0.95) translateY(2px)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 215, 0, 0.4), inset 0 4px 8px rgba(0, 0, 0, 0.2)';
                        e.currentTarget.style.background = 'linear-gradient(145deg, #E6C200 0%, #C9A800 50%, #A68B00 100%)';
                        e.currentTarget.style.transition = 'all 0.05s ease-out';
                    }}
                    onMouseUp={(e) => {
                        // release effect: restore hover state
                        e.currentTarget.style.transform = 'scale(1.08) translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(255, 215, 0, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(145deg, #FFE55C 0%, #DDBF00 50%, #CD9500 100%)';
                        e.currentTarget.style.transition = 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    }}
                >
                    ⚡ Begin Your Quest ⚡
                </button>
                
                <p style={{
                    color: '#C0C0C0',
                    fontSize: '16px',
                    fontFamily: '"Cinzel", "Georgia", serif',
                    fontStyle: 'italic',
                    textShadow: '0 0 5px rgba(192, 192, 192, 0.3)'
                }}>
                    Use WASD or Arrow Keys to move • SPACE to attack • Number keys to switch characters
                </p>
            </div>

            {/* import Google font */}
            <link 
                href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap" 
                rel="stylesheet"
            />
        </div>
    );
}; 