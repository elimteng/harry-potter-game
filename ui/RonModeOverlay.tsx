import React, { useState, useEffect } from 'react';
import { EventBus } from '../phaser/EventBus';
import './RonModeOverlay.css';

export const RonModeOverlay: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const handleRonModeActivated = (data: { duration: number }) => {
            setIsActive(true);
            setTimeLeft(data.duration);
        };

        const handleRonModeDeactivated = () => {
            setIsActive(false);
            setTimeLeft(0);
        };

        // 监听事件
        EventBus.on('ron-mode-activated', handleRonModeActivated);
        EventBus.on('ron-mode-deactivated', handleRonModeDeactivated);

        // 清理函数
        return () => {
            EventBus.off('ron-mode-activated', handleRonModeActivated);
            EventBus.off('ron-mode-deactivated', handleRonModeDeactivated);
        };
    }, []);

    // 每秒更新倒计时
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    const newTime = prev - 1;
                    if (newTime <= 0) {
                        setIsActive(false);
                        return 0;
                    }
                    return newTime;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isActive, timeLeft]);

    if (!isActive) {
        return null;
    }

    return (
        <div className="ron-mode-overlay">
            <div className="ron-mode-container">
                <div className="ron-mode-icon">
                    <img src="/images/ron-mode.png" alt="Ron's Invincible Mode" />
                </div>
                <div className="ron-mode-text">
                    <h2>🔥 RON'S INVINCIBLE MODE</h2>
                    <div className="countdown">{timeLeft}s</div>
                </div>
                <div className="ron-mode-glow"></div>
            </div>
        </div>
    );
}; 