import React, { useState, useEffect } from 'react';
import { StarOutlined } from '@ant-design/icons';
import './GitHubStars.css';

// IndexedDB 数据库名称和存储名称
const DB_NAME = 'github-stars-cache';
const STORE_NAME = 'stars';
const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

interface CacheData {
  stars: number;
  timestamp: number;
}

// 打开 IndexedDB 数据库
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'repo' });
      }
    };
  });
};

// 从 IndexedDB 获取缓存
const getCachedStars = async (repo: string): Promise<CacheData | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(repo);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({ stars: result.stars, timestamp: result.timestamp });
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
};


// 保存到 IndexedDB
const setCachedStars = async (repo: string, stars: number): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        repo,
        stars,
        timestamp: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('保存缓存失败:', error);
  }
};

// 从 GitHub API 获取 Star 数
const fetchStarsFromAPI = async (owner: string, repo: string): Promise<number> => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!response.ok) {
    throw new Error('获取 GitHub 数据失败');
  }
  const data = await response.json();
  return data.stargazers_count || 0;
};

interface GitHubStarsProps {
  owner: string;
  repo: string;
}

const GitHubStars: React.FC<GitHubStarsProps> = ({ owner, repo }) => {
  const [stars, setStars] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const repoKey = `${owner}/${repo}`;
    
    const fetchStars = async () => {
      try {
        // 先检查缓存
        const cached = await getCachedStars(repoKey);
        
        if (cached) {
          setStars(cached.stars);
          setLoading(false);
          
          // 检查缓存是否过期
          if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return; // 缓存未过期，直接使用
          }
        }
        
        // 从 API 获取最新数据
        const freshStars = await fetchStarsFromAPI(owner, repo);
        setStars(freshStars);
        await setCachedStars(repoKey, freshStars);
      } catch (error) {
        console.error('获取 Star 数失败:', error);
        // 如果 API 失败，使用缓存数据（如果有的话）
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, [owner, repo]);

  return (
    <span className="github-stars" title="GitHub Stars">
      <StarOutlined />
      <span className="stars-count">
        {loading ? '...' : stars}
      </span>
    </span>
  );
};

export default GitHubStars;
