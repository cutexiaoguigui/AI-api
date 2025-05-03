import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message } from 'antd';
import styled, { keyframes } from 'styled-components';
import { LockOutlined } from '@ant-design/icons';
import logoImage from '../logo.png';
import { useAuth } from '../contexts/AuthContext';

// 样式定义
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #ffffff;
  background-image: radial-gradient(circle at center, rgba(112, 186, 255, 0.25) 0%, rgb(255, 255, 255) 20vw);
`;

const LoginCard = styled.div`
  width: 400px;
  padding: 40px;
  border-radius: 18px;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
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

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: #333;
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

const StyledInput = styled(Input.Password)`
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 16px;
  height: 48px;
  
  &:hover, &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
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
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    // 如果已认证，重定向到主页
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    <Container>
      <LoginCard>
        <LogoImg src={logoImage} alt="AI Chat Logo" />
        <Title>AI 聊天应用</Title>
        
        <FormItem>
          <StyledInput
            prefix={<LockOutlined style={{ color: '#bfbfbf', marginRight: 8 }} />}
            placeholder="请输入访问密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
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