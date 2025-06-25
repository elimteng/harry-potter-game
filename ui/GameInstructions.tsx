import React from 'react';

export const GameInstructions: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            border: '3px solid #D3A625',
            borderRadius: '20px',
            padding: '30px',
            color: 'white',
            textAlign: 'center',
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            zIndex: 500,
            maxWidth: '600px'
        }}>
            <h1 style={{
                color: '#D3A625',
                marginBottom: '20px',
                fontSize: '28px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
                🧙‍♂️ Harry Potter Shooting Game 🧙‍♀️
            </h1>
            
            <div style={{ marginBottom: '25px', fontSize: '16px', lineHeight: '1.6' }}>
                <p>Choose your character in the bottom left corner, then click "Start Game" to begin your adventure!</p>
                <p>Each character has unique magical abilities:</p>
                <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                    <li><strong style={{color: '#D3A625'}}>Harry Potter</strong> - Patronus Charm (against Dementors)</li>
                    <li><strong style={{color: '#D3A625'}}>Hermione Granger</strong> - Stupefy (stunning all enemies)</li>
                    <li><strong style={{color: '#D3A625'}}>Ron Weasley</strong> - Wingardium Leviosa</li>
                </ul>
            </div>
            
            <div style={{
                background: 'rgba(211, 166, 37, 0.1)',
                border: '1px solid #D3A625',
                borderRadius: '10px',
                padding: '15px',
                marginTop: '20px'
            }}>
                <h3 style={{ color: '#D3A625', marginBottom: '10px' }}>Game Controls</h3>
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    <p>🏃‍♂️ <strong>Movement:</strong> Arrow Keys or A/D Keys</p>
                    <p>⚡ <strong>Attack:</strong> Spacebar</p>
                    <p>🦌 <strong>Expecto Patronum:</strong> P Key (Harry only - "The spell that repels Dementors", 30s cooldown)</p>
                    <p>⚡ <strong>Stupefy:</strong> P Key (Hermione only - stuns all enemies for 10 seconds, 20s cooldown)</p>
                    <p>🪶 <strong>Wingardium Leviosa:</strong> P Key (Ron only - floats all enemies for 5 seconds, 15s cooldown)</p>
                    <p>🔄 <strong>Switch Character:</strong> 1 Key (Harry) / 2 Key (Hermione) / 3 Key (Ron)</p>
                    <p style={{ fontSize: '12px', color: '#ccc' }}>💡 Character switching has 15s cooldown</p>
                    <p>❌ <strong>Quit:</strong> Q Key</p>
                    <p style={{ fontSize: '12px', color: '#888' }}>🧪 <strong>Debug:</strong> B Key (Bellatrix), D Key (Dementor)</p>
                </div>
            </div>
            
            <p style={{
                marginTop: '20px',
                fontSize: '14px',
                color: '#ccc',
                fontStyle: 'italic'
            }}>
                Defeat enemies to earn points, protect your health, and survive as long as possible for higher scores!
            </p>
        </div>
    );
}; 