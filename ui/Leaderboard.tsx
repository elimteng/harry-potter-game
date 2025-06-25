import React, { useState, useEffect } from 'react';
import FirebaseService, { LeaderboardEntry, UserData, convertTimestamp } from '../firebase.config';
import { User } from 'firebase/auth';

interface LeaderboardProps {
  user: User | null;
  isVisible: boolean;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ user, isVisible, onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isVisible && user) {
      loadData();
    }
  }, [isVisible, user]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // 并行加载排行榜和用户数据
      const [leaderboardData, currentUserData] = await Promise.all([
        FirebaseService.getLeaderboard(10),
        FirebaseService.getCurrentUserData()
      ]);

      setLeaderboard(leaderboardData);
      setUserData(currentUserData);
    } catch (error: any) {
      setError(error.message || 'Failed to load data');
      console.error('Failed to load leaderboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCharacterEmoji = (character: string): string => {
    switch (character.toLowerCase()) {
      case 'harry': return '⚡';
      case 'hermione': return '📚';
      case 'ron': return '🪄';
      default: return '🧙';
    }
  };

  const formatDate = (timestamp: Date): string => {
    try {
      // Use the convertTimestamp utility function
      const date = convertTimestamp(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          color: '#000',
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        };
      case 2:
        return {
          background: 'linear-gradient(45deg, #C0C0C0, #A9A9A9)',
          color: '#000',
          fontWeight: 'bold'
        };
      case 3:
        return {
          background: 'linear-gradient(45deg, #CD7F32, #8B4513)',
          color: '#FFF',
          fontWeight: 'bold'
        };
      default:
        return {
          background: 'rgba(25, 25, 112, 0.6)',
          color: '#E6E6FA'
        };
    }
  };

  if (!isVisible) return null;

  return (
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
      zIndex: 2100,
      fontFamily: '"Cinzel", serif'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(139, 69, 19, 0.95) 0%, rgba(25, 25, 112, 0.95) 100%)',
        borderRadius: '20px',
        border: '2px solid #FFD700',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(220, 20, 60, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '1.2rem',
            cursor: 'pointer',
            zIndex: 2101,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = 'rgba(220, 20, 60, 1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(220, 20, 60, 0.8)';
          }}
        >
          ×
        </button>

        <div style={{ padding: '2rem' }}>
          {/* 标题 */}
          <h2 style={{
            color: '#FFD700',
            fontSize: '2.2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            fontWeight: 'bold'
          }}>
            🏆 Wizards Leaderboard 🏆
          </h2>

          {/* 用户个人数据 */}
          {userData && (
            <div style={{
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid #FFD700',
              borderRadius: '15px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#FFD700', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                Your Stats
              </h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-around', 
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ color: '#E6E6FA' }}>
                  <strong>Best Score:</strong> {userData.highestScore}
                </div>
                <div style={{ color: '#E6E6FA' }}>
                  <strong>Games Played:</strong> {userData.gamesPlayed}
                </div>
              </div>
            </div>
          )}

          {/* 排行榜内容 */}
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            {isLoading ? (
              <div style={{
                textAlign: 'center',
                color: '#E6E6FA',
                fontSize: '1.1rem',
                padding: '2rem'
              }}>
                🔄 Loading...
              </div>
            ) : error ? (
              <div style={{
                textAlign: 'center',
                color: '#FFB6C1',
                fontSize: '1.1rem',
                padding: '2rem',
                background: 'rgba(220, 20, 60, 0.2)',
                borderRadius: '10px',
                border: '1px solid #DC143C'
              }}>
                ❌ {error}
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={loadData}
                    style={{
                      background: '#FFD700',
                      color: '#000',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontFamily: '"Cinzel", serif'
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#E6E6FA',
                fontSize: '1.1rem',
                padding: '2rem'
              }}>
                🏁 No records yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      ...getRankStyle(entry.rank),
                      padding: '1rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: user?.uid === entry.rank.toString() ? '2px solid #00FF00' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* 排名光环效果 */}
                    {entry.rank <= 3 && (
                      <div style={{
                        position: 'absolute',
                        top: '-2px',
                        left: '-2px',
                        right: '-2px',
                        bottom: '-2px',
                        borderRadius: '14px',
                        background: getRankStyle(entry.rank).background,
                        opacity: 0.3,
                        zIndex: -1
                      }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}>
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                      </div>
                      
                      <div>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {getCharacterEmoji(entry.character)} {entry.playerName}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          opacity: 0.8
                        }}>
                          {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      textAlign: 'right'
                    }}>
                      {entry.score.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 刷新按钮 */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={loadData}
              disabled={isLoading}
              style={{
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                color: '#000',
                border: 'none',
                padding: '0.8rem 2rem',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.7 : 1,
                fontFamily: '"Cinzel", serif'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isLoading ? '🔄 Refreshing...' : '🔄 Refresh Leaderboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 