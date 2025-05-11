import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message } from 'antd';
import styled, { keyframes } from 'styled-components';
import { LockOutlined } from '@ant-design/icons';
import logoImage from '../logo.png';
import { useAuth } from '../contexts/AuthContext';

// 获取当前主题模式(在密码页面中，我们不能使用useChat获取theme设置，因此从body属性读取)
const getCurrentThemeMode = (): 'dark' | 'light' => {
  const themeMode = document.body.getAttribute('theme-mode');
  return themeMode === 'dark' ? 'dark' : 'light';
};

// 样式定义
const Container = styled.div<{isDark: boolean}>`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: ${props => props.isDark ? '#1f1f1f' : '#ffffff'};
  background-image: ${props => props.isDark
    ? 'radial-gradient(circle at center, rgba(30, 60, 90, 0.2) 0%, rgba(15, 15, 15, 0) 20vw)'
    : 'radial-gradient(circle at center, rgba(112, 186, 255, 0.25) 0%, rgb(255, 255, 255) 20vw)'};
`;

const LoginCard = styled.div<{isDark: boolean}>`
  width: 400px;
  padding: 40px;
  border-radius: 18px;
  background: ${props => props.isDark ? '#2c2c2c' : 'white'};
  box-shadow: ${props => props.isDark 
    ? '0 10px 30px rgba(0, 0, 0, 0.3)' 
    : '0 10px 30px rgba(0, 0, 0, 0.08)'};
  @media (max-width: 768px) {
    box-shadow: none;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const LogoImg = styled.img`
  height: 80px;
  margin-bottom: 24px;
`;

const Title = styled.h1<{isDark: boolean}>`
  font-size: 24px;
  margin-bottom: 24px;
  color: ${props => props.isDark ? '#f0f0f0' : '#333'};
  text-align: center;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const FormItem = styled.div`
  width: 100%;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.5s ease-out forwards;
`;

const StyledInput = styled(Input.Password)<{isDark: boolean}>`
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 16px;
  height: 48px;
  background-color: ${props => props.isDark ? '#3a3a3a' : 'white'};
  color: ${props => props.isDark ? '#f0f0f0' : 'inherit'};
  border-color: ${props => props.isDark ? '#444' : '#d9d9d9'};
  
  &:hover, &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  .ant-input {
    background-color: ${props => props.isDark ? '#3a3a3a' : 'white'};
    color: ${props => props.isDark ? '#f0f0f0' : 'inherit'};
  }
`;

const LoginButton = styled(Button)`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: 0.1s;
  opacity: 0;
`;

const ErrorText = styled.div`
  color: #ff4d4f;
  margin-top: 16px;
  font-size: 14px;
  text-align: center;
`;

const PasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(getCurrentThemeMode());
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    // 如果已认证，重定向到主页
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 添加监听body主题模式变化的副作用
  useEffect(() => {
    // 创建MutationObserver监听body的theme-mode属性变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'theme-mode'
        ) {
          setThemeMode(getCurrentThemeMode());
        }
      });
    });

    // 开始监听body元素的属性变化
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['theme-mode'],
    });

    // 组件卸载时清理observer
    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLogin = () => {
    const success = login(password);
    if (success) {
      message.success('验证成功');
      navigate('/');
    } else {
      setError('密码错误，请重试');
      setAttempts(attempts + 1);
      // 清空密码输入框
      setPassword('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Container isDark={themeMode === 'dark'}>
      <LoginCard isDark={themeMode === 'dark'}>
        <LogoImg src={logoImage} alt="AI Chat Logo" />
        <Title isDark={themeMode === 'dark'}>AI 聊天应用</Title>
        
        <FormItem>
          <StyledInput
            prefix={<LockOutlined style={{ color: themeMode === 'dark' ? '#8c8c8c' : '#bfbfbf', marginRight: 8 }} />}
            placeholder="请输入访问密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            isDark={themeMode === 'dark'}
          />
        </FormItem>
        
        <LoginButton 
          type="primary" 
          onClick={handleLogin}
          disabled={!password.trim()}
        >
          登录
        </LoginButton>
        
        {error && <ErrorText>{error}</ErrorText>}
      </LoginCard>
    </Container>
  );
};

export default PasswordPage; 