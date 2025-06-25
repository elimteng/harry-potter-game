import React from 'react';

interface GameHUDProps {
    score: number;
    lives: number;
    characterSwitchCooldown?: number;
    currentCharacter?: string;
    ultimateSkillCharges?: number;
    skillCooldowns?: {
        patronus: number;
        stupefy: number;
        wingardium: number;
    };
    mana?: {
        current: number;
        max: number;
    };
}

export const GameHUD: React.FC<GameHUDProps> = ({
    score,
    lives,
    characterSwitchCooldown = 0,
    currentCharacter = 'Harry',
    ultimateSkillCharges = 0,
    skillCooldowns = { patronus: 0, stupefy: 0, wingardium: 0 },
    mana = { current: 30, max: 30 }
}) => {
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            color: 'white',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '15px',
            borderRadius: '10px',
            border: '2px solid #D3A625',
            minWidth: '200px'
        }}>
            <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#D3A625' }}>Score:</strong> {score}
            </div>
            <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#D3A625' }}>Health:</strong> 
                <div style={{ 
                    marginTop: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {/* 血条容器 */}
                    <div style={{
                        width: '180px',
                        height: '20px',
                        backgroundColor: '#333',
                        border: '2px solid #666',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* 血条填充 */}
                        <div style={{
                            width: `${(lives / 5) * 100}%`,
                            height: '100%',
                            backgroundColor: lives > 2.5 ? '#00FF00' : lives > 1.25 ? '#FFFF00' : '#FF0000',
                            transition: 'width 0.3s ease, background-color 0.3s ease',
                            borderRadius: '8px'
                        }} />
                        
                        {/* 血条分段线 */}
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '20%',
                            width: '1px',
                            height: '100%',
                            backgroundColor: '#666'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '40%',
                            width: '1px',
                            height: '100%',
                            backgroundColor: '#666'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '60%',
                            width: '1px',
                            height: '100%',
                            backgroundColor: '#666'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '80%',
                            width: '1px',
                            height: '100%',
                            backgroundColor: '#666'
                        }} />
                    </div>
                    
                    {/* 数值显示 */}
                    <span style={{ 
                        fontSize: '14px', 
                        color: '#ccc',
                        minWidth: '40px'
                    }}>
                        {lives}/5
                    </span>
                </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#D3A625' }}>Mana:</strong> 
                <div style={{ 
                    marginTop: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {/* 魔法条容器 */}
                    <div style={{
                        width: '180px',
                        height: '16px',
                        backgroundColor: '#1a1a2e',
                        border: '2px solid #16213e',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        {/* 魔法条填充 */}
                        <div style={{
                            width: `${(mana.current / mana.max) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #0f3460, #2980b9, #5dade2)',
                            transition: 'width 0.3s ease',
                            borderRadius: '6px',
                            boxShadow: mana.current > 0 ? '0 0 10px rgba(93, 173, 226, 0.5)' : 'none'
                        }} />
                        
                        {/* 魔法条分段线（每5点一个分段） */}
                        {Array.from({ length: 5 }, (_, i) => (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: `${((i + 1) * 6 / 30) * 100}%`,
                                    width: '1px',
                                    height: '100%',
                                    backgroundColor: '#0e4f79'
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* 数值显示 */}
                    <span style={{ 
                        fontSize: '14px', 
                        color: '#5dade2',
                        minWidth: '50px',
                        fontWeight: 'bold'
                    }}>
                        {mana.current}/{mana.max}
                    </span>
                </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
                <strong style={{ color: '#D3A625' }}>Current Character:</strong> {currentCharacter}
            </div>

            {characterSwitchCooldown > 0 && (
                <div style={{ marginBottom: '8px', fontSize: '14px', color: '#FF6666' }}>
                    <strong>Switch Cooldown:</strong> {characterSwitchCooldown.toFixed(1)}s
                </div>
            )}
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                <div>Move: ↑↓←→ or WASD</div>
                <div>Attack: Spacebar</div>
                <div>Characters: 1(Harry) 2(Hermione) 3(Ron)</div>
                <div>Special Skills: P</div>
            </div>
        </div>
    );
}; 