import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInAnonymously, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

// Firebase配置 - 您需要替换为您的Firebase项目配置
const firebaseConfig = {
  apiKey: "AIzaSyCbzv4riFczK5vujYLMOy-yZ3LiSh0F1pY",
  authDomain: "hp-game-f154d.firebaseapp.com",
  projectId: "hp-game-f154d",
  storageBucket: "hp-game-f154d.firebasestorage.app",
  messagingSenderId: "412524381410",
  appId: "1:412524381410:web:af77b8bc87d5f67382cabb",
  measurementId: "G-6GRVE987DH"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 初始化Firebase服务
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google登录提供者
const googleProvider = new GoogleAuthProvider();

/**
 * 用户数据接口
 */
export interface UserData {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  highestScore: number;
  gamesPlayed: number;
  lastPlayed: Date;
}

/**
 * 分数记录接口
 */
export interface ScoreRecord {
  id?: string;
  uid: string;
  playerName: string;
  score: number;
  character: string;
  timestamp: Date;
  gameMode?: string;
}

/**
 * 排行榜数据接口
 */
export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  character: string;
  timestamp: Date;
}

/**
 * 工具函数：将Firestore Timestamp转换为JavaScript Date
 */
export const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) {
    return new Date();
  }
  
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  // 如果是Firebase Timestamp对象但instanceof检查失败
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  
  // 尝试直接创建Date对象
  return new Date(timestamp);
};

/**
 * Firebase认证和数据管理类
 */
export class FirebaseService {
  
  /**
   * Google登录
   */
  static async signInWithGoogle(): Promise<User | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 创建或更新用户数据
      await this.createOrUpdateUserData(user);
      
      return user;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  }

  /**
   * 匿名登录
   */
  static async signInAnonymously(): Promise<User | null> {
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;
      
      // 为匿名用户创建数据
      await this.createOrUpdateUserData(user, `Guest_${Date.now()}`);
      
      return user;
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      throw error;
    }
  }

  /**
   * 登出
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  /**
   * 创建或更新用户数据
   */
  static async createOrUpdateUserData(user: User, customDisplayName?: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      const userData: Partial<UserData> = {
        uid: user.uid,
        displayName: customDisplayName || user.displayName || 'Anonymous',
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        lastPlayed: new Date()
      };

      if (userDoc.exists()) {
        // 更新现有用户数据
        const existingData = userDoc.data();
        userData.highestScore = existingData.highestScore || 0;
        userData.gamesPlayed = (existingData.gamesPlayed || 0);
      } else {
        // 创建新用户数据
        userData.highestScore = 0;
        userData.gamesPlayed = 0;
      }

      await setDoc(userRef, userData, { merge: true });
    } catch (error) {
      console.error('Failed to create/update user data:', error);
      throw error;
    }
  }

  /**
   * 提交分数
   */
  static async submitScore(score: number, character: string, gameMode: string = 'normal'): Promise<void> {
    try {
      // 验证分数参数
      if (typeof score !== 'number') {
        console.error('Score is not a number:', score, typeof score);
        throw new Error(`Invalid score type: expected number, got ${typeof score}`);
      }
      
      if (score === 0) {
        console.warn('Score is exactly 0, this might be the issue');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not logged in');
      }

      // 获取用户数据
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // 创建分数记录
      const scoreRecord: Omit<ScoreRecord, 'id'> = {
        uid: user.uid,
        playerName: userData?.displayName || 'Unknown',
        score: score,
        character: character,
        timestamp: new Date(),
        gameMode: gameMode
      };

      // 添加到分数集合
      const docRef = await addDoc(collection(db, 'scores'), scoreRecord);

      // 更新用户的最高分和游戏次数
      const updates: Partial<UserData> = {
        gamesPlayed: (userData?.gamesPlayed || 0) + 1,
        lastPlayed: new Date()
      };

      if (!userData?.highestScore || score > userData.highestScore) {
        updates.highestScore = score;
      }

      await setDoc(userRef, updates, { merge: true });
    } catch (error) {
      console.error('=== FIREBASE SUBMIT SCORE ERROR ===');
      console.error('Failed to submit score:', error);
      throw error;
    }
  }

  /**
   * 获取排行榜 - 每个用户只显示最高分
   */
  static async getLeaderboard(limitCount: number = 10): Promise<LeaderboardEntry[]> {
    try {
      // 获取所有分数记录，按分数降序排列
      const q = query(
        collection(db, 'scores'),
        orderBy('score', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      // 用Map来存储每个用户的最高分记录
      const userBestScores = new Map<string, LeaderboardEntry>();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const uid = data.uid;
        
        // 正确处理Firestore Timestamp
        const timestamp = convertTimestamp(data.timestamp);
        
        // 如果这个用户还没有记录，或者当前分数比已记录的分数更高
        if (!userBestScores.has(uid) || data.score > userBestScores.get(uid)!.score) {
          userBestScores.set(uid, {
            rank: 0, // 稍后设置排名
            playerName: data.playerName,
            score: data.score,
            character: data.character,
            timestamp: timestamp
          });
        }
      });

      // 将Map转换为数组并按分数降序排列
      const leaderboard = Array.from(userBestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limitCount) // 限制返回数量
        .map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));

      return leaderboard;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  /**
   * 获取用户的分数历史
   */
  static async getUserScoreHistory(limitCount: number = 20): Promise<ScoreRecord[]> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not logged in');
      }

      const q = query(
        collection(db, 'scores'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const scores: ScoreRecord[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid === user.uid) {
          // 正确处理Firestore Timestamp
          const timestamp = convertTimestamp(data.timestamp);
            
          scores.push({
            id: doc.id,
            uid: data.uid,
            playerName: data.playerName,
            score: data.score,
            character: data.character,
            timestamp: timestamp,
            gameMode: data.gameMode
          });
        }
      });

      return scores;
    } catch (error) {
      console.error('Failed to get user score history:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户数据
   */
  static async getCurrentUserData(): Promise<UserData | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        // 正确处理Firestore Timestamp
        const lastPlayed = convertTimestamp(data.lastPlayed);
          
        return {
          uid: data.uid,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          highestScore: data.highestScore,
          gamesPlayed: data.gamesPlayed,
          lastPlayed: lastPlayed
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      throw error;
    }
  }
}

export default FirebaseService; 