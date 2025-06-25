import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import FirebaseService, { auth } from '../firebase.config';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // 监听认证状态变化
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        onLoginSuccess(user);
      }
    });

    return () => unsubscribe();
  }, [onLoginSuccess]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const user = await FirebaseService.signInWithGoogle();
      if (user) {
        // 登录成功
      }
    } catch (error: any) {
      setError(error.message || 'Google登录失败');
      console.error('Google登录错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const user = await FirebaseService.signInAnonymously();
      if (user) {
        // 匿名登录成功
      }
    } catch (error: any) {
      setError(error.message || '匿名登录失败');
      console.error('匿名登录错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: '"Cinzel", serif'
    }}>
      {/* 魔法粒子背景效果 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(2px 2px at 20px 30px, #FFD700, transparent),
          radial-gradient(2px 2px at 40px 70px, #87CEEB, transparent),
          radial-gradient(1px 1px at 90px 40px, #FFD700, transparent),
          radial-gradient(1px 1px at 130px 80px, #87CEEB, transparent),
          radial-gradient(2px 2px at 160px 30px, #FFD700, transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 100px',
        animation: 'twinkle 4s linear infinite',
        opacity: 0.6
      }} />

      <div style={{
        background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.8) 0%, rgba(25, 25, 112, 0.8) 100%)',
        padding: '3rem',
        borderRadius: '20px',
        border: '2px solid #FFD700',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 魔法光环效果 */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          borderRadius: '25px',
          background: 'linear-gradient(45deg, #FFD700, transparent, #FFD700)',
          opacity: 0.3,
          animation: 'glow 3s ease-in-out infinite alternate',
          zIndex: -1
        }} />

        <h1 style={{
          color: '#FFD700',
          fontSize: '2.5rem',
          marginBottom: '1rem',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          fontWeight: 'bold'
        }}>
          ⚡ Harry Potter Game ⚡
        </h1>

        <p style={{
          color: '#E6E6FA',
          fontSize: '1.1rem',
          marginBottom: '2rem',
          fontStyle: 'italic',
          lineHeight: '1.6'
        }}>
          "Happiness can be found even in the darkest of times,<br/>
          if one only remembers to turn on the light."<br/>
          <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>— Albus Dumbledore</span>
        </p>

        {error && (
          <div style={{
            background: 'rgba(220, 20, 60, 0.2)',
            border: '1px solid #DC143C',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#FFB6C1',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(45deg, #4285F4, #34A853)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(66, 133, 244, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isLoading ? 0.7 : 1,
              fontFamily: '"Cinzel", serif'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(66, 133, 244, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(66, 133, 244, 0.3)';
              }
            }}
          >
            {isLoading ? (
              <>🔄 Signing in...</>
            ) : (
              <>🧙‍♂️ Sign in with Google</>
            )}
          </button>

          <button
            onClick={handleAnonymousLogin}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(45deg, #8B4513, #DAA520)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '50px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)',
              opacity: isLoading ? 0.7 : 1,
              fontFamily: '"Cinzel", serif'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 69, 19, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 69, 19, 0.3)';
              }
            }}
          >
            🎭 Guest Login
          </button>
        </div>

        <p style={{
          color: '#B0C4DE',
          fontSize: '0.85rem',
          marginTop: '1.5rem',
          opacity: 0.8
        }}>
          Sign in to save your progress and compete on the leaderboard
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes glow {
          0% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen; 