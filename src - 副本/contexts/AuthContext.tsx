// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  validateSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 密码验证和会话管理
const CORRECT_PASSWORD = 'Gui-ai'; // 替换为实际密码
const SESSION_KEY = 'auth_session';
const SESSION_TIMESTAMP_KEY = 'auth_timestamp';
const TAB_ID_KEY = 'auth_tab_id';
const SESSION_EXPIRY = 60 * 60 * 1000; // 1小时会话有效期

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tabId] = useState<string>(() => {
    return Math.random().toString(36).substring(2, 15);
  });

  // 初始化时检查会话是否有效
  useEffect(() => {
    validateSession();
    
    // 定期验证会话
    const intervalId = setInterval(validateSession, 60000); // 每分钟验证一次
    
    return () => clearInterval(intervalId);
  }, []);

  // 验证会话是否有效
  const validateSession = () => {
    // 1. 检查当前标签页是否已登录（通过sessionStorage）
    const currentTabValue = sessionStorage.getItem(TAB_ID_KEY);
    const isCurrentTabAuthenticated = currentTabValue === tabId;
    
    // 2. 检查是否有全局会话，以及会话是否过期
    const globalSessionExists = localStorage.getItem(SESSION_KEY) === 'true';
    let isGlobalSessionValid = false;
    
    if (globalSessionExists) {
      const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);
      if (timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const now = Date.now();
        
        if (now - timestamp <= SESSION_EXPIRY) {
          // 会话未过期，更新时间戳
          localStorage.setItem(SESSION_TIMESTAMP_KEY, now.toString());
          isGlobalSessionValid = true;
        }
      }
    }
    
    // 标签页已登录，或者全局会话有效且当前标签也已登录
    if (isCurrentTabAuthenticated) {
      setIsAuthenticated(true);
    } else {
      // 当前标签未登录
      setIsAuthenticated(false);
    }
  };

  // 登录
  const login = (password: string) => {
    if (password === CORRECT_PASSWORD) {
      // 在全局存储会话
      localStorage.setItem(SESSION_KEY, 'true');
      localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      
      // 标记当前标签页为已登录
      sessionStorage.setItem(TAB_ID_KEY, tabId);
      
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  // 登出
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
    sessionStorage.removeItem(TAB_ID_KEY);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      validateSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};