import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// src/App.tsx，大约在第4行附近添加
import { ConfigProvider, theme, App as AntdApp } from 'antd';
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
  const { isAuthenticated, validateSession } = useAuth();
  
  // 每次导航时验证会话
  useEffect(() => {
    validateSession();
  }, [validateSession]);
  
  if (!isAuthenticated) {
    return <Navigate to="/password" replace />;
  }
  
  return <>{children}</>;
};

// 自定义主题提供器，从聊天上下文获取主题
const ThemedApp: React.FC = () => {
  const { settings } = useChat();
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测设备类型
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
            <Route path="/password" element={<PasswordPage />} />
            
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
            
            {/* 默认重定向 */}
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