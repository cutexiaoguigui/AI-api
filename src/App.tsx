// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // <--- 引入 useLocation
import { ConfigProvider, theme as antdTheme, App as AntdApp, Spin } from 'antd'; // <--- 引入 Spin (可选的加载指示器)
import { ThemeProvider, DefaultTheme } from 'styled-components';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import ChatPage from './pages/ChatPage';
import SimpleChatPage from './pages/SimpleChatPage';
import CopilotChat from './pages/CopilotChat';
import CopilotChatPhone from './pages/CopilotChatPhone';
import SettingsPage from './pages/SettingsPage';
import PasswordPage from './pages/PasswordPage';

// 创建亮色主题
const createLightTheme = (primaryColor: string): DefaultTheme => ({
  primaryColor,
  isDarkMode: false,
  colors: {
    background: '#ffffff',
    text: '#333333',
    secondaryText: '#666666',
    border: '#f0f0f0',
    cardBackground: '#ffffff',
    messageBackground: {
      user: '#e6f7ff',
      assistant: '#ffffff',
      error: '#fff2f0',
    },
    messageBorder: {
      user: '#91d5ff',
      assistant: '#e8e8e8',
      error: '#ffccc7',
    },
    codeBackground: '#f7f7f7',
    inputBackground: 'rgba(255, 255, 255, 0.8)',
    sidebarBackground: '#fff',
    navbarBackground: 'rgba(255, 255, 255, 0.8)',
  }
});

// 创建暗色主题
const createDarkTheme = (primaryColor: string): DefaultTheme => ({
  primaryColor,
  isDarkMode: true,
  colors: {
    background: '#1f1f1f',
    text: '#f0f0f0',
    secondaryText: '#bbbbbb',
    border: '#333333',
    cardBackground: '#2c2c2c',
    messageBackground: {
      user: '#15395b',
      assistant: '#2c2c2c',
      error: '#5c1919',
    },
    messageBorder: {
      user: '#15395b',
      assistant: '#333333',
      error: '#5c1919',
    },
    codeBackground: '#2a2a2a',
    inputBackground: 'rgba(30, 30, 30, 0.8)',
    sidebarBackground: '#2c2c2c',
    navbarBackground: 'rgba(30, 30, 30, 0.8)',
  }
});

// 路由保护组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 解构需要的状态，移除 validateSession，添加 isLoading
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // 获取当前位置信息

  // --- 移除 useEffect 调用 validateSession ---
  // useEffect(() => {
  //   validateSession(); // 不再需要手动调用
  // }, [validateSession]);

  // 如果正在加载认证状态，显示加载指示器或返回 null
  if (isLoading) {
    // 你可以在这里放一个全局的加载动画
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
    // 或者 return null;
  }

  // 如果加载完成但未认证，重定向到密码页面
  // 将用户尝试访问的路径作为状态传递，以便登录后可以重定向回来 (可选)
  if (!isAuthenticated) {
    return <Navigate to="/password" state={{ from: location }} replace />;
  }

  // 如果已认证，渲染子组件
  return <>{children}</>;
};

// --- ThemedApp 和 AppWithProviders 组件保持不变 ---
const ThemedApp: React.FC = () => {
    const { settings } = useChat();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkDevice = () => {
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
        setIsMobile(mobile);
      };

      checkDevice();
      window.addEventListener('resize', checkDevice);

      return () => {
        window.removeEventListener('resize', checkDevice);
      };
    }, []);

    // 添加useEffect监听暗色模式变化并设置body属性
    useEffect(() => {
      // 根据暗色模式设置body的theme-mode属性
      document.body.setAttribute('theme-mode', settings.theme.darkMode ? 'dark' : 'light');
    }, [settings.theme.darkMode]);

    // 根据设置选择当前主题
    const currentTheme = settings.theme.darkMode 
      ? createDarkTheme(settings.theme.primaryColor) 
      : createLightTheme(settings.theme.primaryColor);

    return (
      <ThemeProvider theme={currentTheme}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: settings.theme.primaryColor,
              // 添加暗色模式的配置
              colorBgBase: settings.theme.darkMode ? '#1f1f1f' : '#ffffff',
              colorTextBase: settings.theme.darkMode ? '#f0f0f0' : '#333333',
              colorBorder: settings.theme.darkMode ? '#333333' : '#f0f0f0',
            },
            algorithm: settings.theme.darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          }}
        >
          <AntdApp>
            <Routes>
              {/* PasswordPage 不需要保护 */}
              <Route path="/password" element={<PasswordPage />} />

              {/* 其他页面都需要保护 */}
              <Route path="/" element={
                <ProtectedRoute>
                  {isMobile ? <CopilotChatPhone /> : <CopilotChat />}
                </ProtectedRoute>
              } />

              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />

              <Route path="/simple" element={
                <ProtectedRoute>
                  <SimpleChatPage />
                </ProtectedRoute>
              } />

              <Route path="/copilot" element={
                <ProtectedRoute>
                  <CopilotChat />
                </ProtectedRoute>
              } />

              <Route path="/mobile" element={
                <ProtectedRoute>
                  <CopilotChatPhone />
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />

              {/* 默认重定向到受保护的首页 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AntdApp>
        </ConfigProvider>
      </ThemeProvider>
    );
  };

  const AppWithProviders: React.FC = () => {
    return (
      <ChatProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ChatProvider>
    );
  };

  const App: React.FC = () => {
    return (
      <Router>
        <AppWithProviders />
      </Router>
    );
  };

export default App;
