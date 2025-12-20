// IndexedDB 工具函数 - 用于持久化用户偏好设置

const DB_NAME = 'leetcode-visualizer-db';
const DB_VERSION = 1;
const SETTINGS_STORE = 'settings';

// 打开数据库
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
};

// 保存设置
export const saveSetting = async <T>(key: string, value: T): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value, timestamp: Date.now() });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('保存设置失败:', error);
  }
};

// 读取设置
export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(SETTINGS_STORE, 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);
      
      request.onerror = () => resolve(defaultValue);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : defaultValue);
      };
    });
  } catch (error) {
    console.error('读取设置失败:', error);
    return defaultValue;
  }
};

// 设置键名常量
export const SETTING_KEYS = {
  PLAYBACK_SPEED: 'playbackSpeed',
  SELECTED_LANGUAGE: 'selectedLanguage',
} as const;
