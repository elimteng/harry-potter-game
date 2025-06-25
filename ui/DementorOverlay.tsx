import React from 'react';

interface DementorOverlayProps {
    isVisible: boolean;
}

export const DementorOverlay: React.FC<DementorOverlayProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)', // 降低透明度，让画面更清晰
            pointerEvents: 'none', // 不阻止鼠标事件
            zIndex: 100, // 在游戏画面之上，但在UI元素之下
            transition: 'opacity 0.8s ease-in-out', // 更慢的过渡效果
            animation: isVisible ? 'dementorIntensePulse 2s infinite ease-in-out' : 'none'
        }}>
            <style>{`
                @keyframes dementorIntensePulse {
                    0% { 
                        opacity: 0.35; 
                        background: radial-gradient(circle at center, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%);
                    }
                    25% { 
                        opacity: 0.5; 
                        background: radial-gradient(circle at center, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.6) 100%);
                    }
                    50% { 
                        opacity: 0.6; 
                        background: radial-gradient(circle at center, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%);
                    }
                    75% { 
                        opacity: 0.45; 
                        background: radial-gradient(circle at center, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.55) 100%);
                    }
                    100% { 
                        opacity: 0.35; 
                        background: radial-gradient(circle at center, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%);
                    }
                }
            `}</style>
            
            {/* 添加额外的阴影层增强效果，但降低透明度 */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle at 50% 30%, rgba(50, 0, 50, 0.15) 0%, rgba(0, 0, 0, 0.3) 70%)',
                animation: isVisible ? 'dementorShadowPulse 3s infinite ease-in-out' : 'none'
            }} />
            
            <style>{`
                @keyframes dementorShadowPulse {
                    0%, 100% { 
                        opacity: 0.3;
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 0.5;
                        transform: scale(1.02);
                    }
                }
            `}</style>
        </div>
    );
}; 