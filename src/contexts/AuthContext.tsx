// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean; // 是否已认证
  isLoading: boolean;      // 添加状态以处理初始异步检查
  login: (password: string) => boolean; // 登录函数
  logout: () => void;      // 登出函数
  isNewTabVisit: boolean; // <--- 添加: 跟踪是否是新标签页访问
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 配置 ---
const CORRECT_PASSWORD = 'Gui-ai'; // 替换为你的实际密码
const TAB_SESSION_KEY = 'tab_auth_data'; // 使用 sessionStorage 存储标签页特定的数据
const SESSION_EXPIRY = 60 * 60 * 1000; // 会话有效期：1小时（毫秒）
const PAGE_VISIT_KEY = 'page_visit_history'; // 用于检测此标签页之前是否被访问过的键

// 标签页会话数据接口
interface TabSessionData {
  isAuthenticated: boolean;
  timestamp: number;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // isLoading 状态用于防止在初始检查 sessionStorage 时 UI 出现闪烁
  const [isNewTabVisit, setIsNewTabVisit] = useState<boolean>(true); // 初始化为 true，将在 effect 中检查

  // --- 会话验证逻辑 (标签页特定) ---
  const validateTabSession = useCallback(() => {
    // console.log("正在验证标签页会话..."); // 调试日志
    try {
      const sessionDataStr = sessionStorage.getItem(TAB_SESSION_KEY);
      if (sessionDataStr) {
        const sessionData: TabSessionData = JSON.parse(sessionDataStr);
        const now = Date.now();

        // 检查认证标志是否为 true 且时间戳在有效期内
        if (sessionData.isAuthenticated && (now - sessionData.timestamp <= SESSION_EXPIRY)) {
          // console.log("会话有效且未过期。");
          // 会话有效，更新时间戳以保持活动状态
          sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify({ ...sessionData, timestamp: now }));
          setIsAuthenticated(true);
          return; // 退出验证
        } else if (sessionData.isAuthenticated) {
           // console.log("会话已过期。");
           // 会话已过期，清除它
           sessionStorage.removeItem(TAB_SESSION_KEY);
        }
      } else {
        // console.log("在 sessionStorage 中未找到会话数据。");
      }
    } catch (error) {
      console.error("验证标签页会话时出错:", error);
      sessionStorage.removeItem(TAB_SESSION_KEY); // 清除可能已损坏的数据
    }
    // 如果执行到这里，说明此标签页的会话无效或不存在
    setIsAuthenticated(false);
  }, []);

  // --- Effects (副作用钩子) ---
  useEffect(() => {
    setIsLoading(true); // 开始加载

    // 检查这是否是此标签页会话中的首次访问
    const hasVisited = sessionStorage.getItem(PAGE_VISIT_KEY) === 'true';
    // console.log("Has visited before in this tab session:", hasVisited);
    setIsNewTabVisit(!hasVisited); // 设置 isNewTabVisit 状态
    if (!hasVisited) {
        sessionStorage.setItem(PAGE_VISIT_KEY, 'true'); // 标记为已访问
    }

    // 执行初始验证
    validateTabSession();

    setIsLoading(false); // 完成加载

    // 设置定时器进行周期性验证
    const intervalId = setInterval(validateTabSession, 60000); // 每分钟检查一次

    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, [validateTabSession]);

  // --- 认证操作 ---
  const login = (password: string): boolean => {
    if (password === CORRECT_PASSWORD) {
      const sessionData: TabSessionData = {
        isAuthenticated: true,
        timestamp: Date.now(),
      };
      try {
        sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify(sessionData));
        setIsAuthenticated(true);
        // 登录成功后，当前标签页不再是“新访问”了（即使它刚打开）
        setIsNewTabVisit(false);
        sessionStorage.setItem(PAGE_VISIT_KEY, 'true'); // 确保访问标记已设置
        // console.log("登录成功，会话已存储在 sessionStorage。");
        return true;
      } catch (error) {
        console.error("保存会话数据失败:", error);
        setIsAuthenticated(false);
        return false;
      }
    }
    // console.log("登录失败：密码错误。");
    setIsAuthenticated(false);
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(TAB_SESSION_KEY);
    // 登出时可以选择是否重置 PAGE_VISIT_KEY，取决于你希望登出后再访问是否算新访问
    // sessionStorage.removeItem(PAGE_VISIT_KEY);
    setIsAuthenticated(false);
    // 登出后，再访问此标签页（如果没关闭）可以认为需要重新验证，但它不是严格意义上的“新标签页打开”
    // isNewTabVisit 的状态在这里可以不更新，依赖下次加载时的 useEffect 重新判断
    // console.log("登出成功，会话已从 sessionStorage 移除。");
  };

  // --- 提供 Context 值 ---
  const contextValue = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    isNewTabVisit, // <--- 添加到 context 值中
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* 如果不在加载中，则显示子组件，否则可以显示加载指示器 */}
      {!isLoading ? children : null }
    </AuthContext.Provider>
  );
};

// --- 自定义 Hook ---
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
};