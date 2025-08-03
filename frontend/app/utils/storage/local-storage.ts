// localStorage 키 enum 정의
export enum StorageKeys {
  USER_DATA = 'user_data',
  // 향후 추가할 다른 키들
  // SETTINGS = 'settings',
  // THEME = 'theme',
  // TOKENS = 'tokens',
}

/**
 * 데이터를 localStorage에 저장합니다.
 * @param key 저장할 키
 * @param data 저장할 데이터
 */
export const saveToStorage = <T>(key: StorageKeys, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data to localStorage with key "${key}":`, error);
  }
};

/**
 * localStorage에서 데이터를 로드합니다.
 * @param key 로드할 키
 * @returns 저장된 데이터 또는 null
 */
export const loadFromStorage = <T>(key: StorageKeys): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Failed to load data from localStorage with key "${key}":`, error);
    return null;
  }
};

/**
 * localStorage에서 데이터를 삭제합니다.
 * @param key 삭제할 키
 */
export const removeFromStorage = (key: StorageKeys): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove data from localStorage with key "${key}":`, error);
  }
};

/**
 * localStorage에 해당 키의 데이터가 있는지 확인합니다.
 * @param key 확인할 키
 * @returns 데이터 존재 여부
 */
export const hasStorageData = (key: StorageKeys): boolean => {
  return loadFromStorage(key) !== null;
};

/**
 * 저장된 데이터의 특정 필드만 업데이트합니다.
 * @param key 업데이트할 키
 * @param updates 업데이트할 필드들
 */
export const updateStorageData = <T extends Record<string, unknown>>(
  key: StorageKeys, 
  updates: Partial<T>
): void => {
  const currentData = loadFromStorage<T>(key);
  if (currentData) {
    const updatedData = { ...currentData, ...updates };
    saveToStorage(key, updatedData);
  }
};

/**
 * localStorage의 모든 데이터를 삭제합니다.
 */
export const clearAllStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

/**
 * 특정 키들만 삭제합니다.
 * @param keys 삭제할 키들의 배열
 */
export const removeMultipleFromStorage = (keys: StorageKeys[]): void => {
  keys.forEach(key => removeFromStorage(key));
};
