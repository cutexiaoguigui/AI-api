// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'; // <--- 引入 useLocation
import { ConfigProvider, theme, App as AntdApp, Spin } from 'antd'; // <--- 引入 Spin (可选的加载指示器)
import { ThemeProvider } from 'styled-components';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import ChatPage from './pages/ChatPage';
import SimpleChatPage from './pages/SimpleChatPage';
import CopilotChat from './pages/CopilotChat';
import CopilotChatPhone from './pages/CopilotChatPhone';
import SettingsPage from './pages/SettingsPage';
import PasswordPage from './pages/PasswordPage';

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

    return (
      <ThemeProvider theme={{ primaryColor: settings.theme.primaryColor }}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: settings.theme.primaryColor,
            },
            algorithm: theme.defaultAlgorithm,
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
