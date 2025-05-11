import React, { useState } from 'react';
import { Spin, message } from 'antd';
import { CheckOutlined, CopyOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useChat } from '../contexts/ChatContext';

// 按需加载语言支持
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';

// 注册语言
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);

// 样式定义
const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 10px 0;
  border-radius: 6px;
  overflow: hidden;
  background-color: ${props => props.theme.isDarkMode ? 'rgb(40, 44, 52)' : '#f6f8fa'};
`;

const LanguageLabel = styled.span`
  position: absolute;
  top: 8px;
  left: 8px;
  background: ${props => props.theme.isDarkMode ? 'rgba(45, 45, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  border: 1px solid ${props => props.theme.isDarkMode ? '#444' : '#ddd'};
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: ${props => props.theme.isDarkMode ? '#aaa' : '#666'};
  z-index: 10;
  text-transform: uppercase;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: ${props => props.theme.isDarkMode ? 'rgba(45, 45, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
  border: 1px solid ${props => props.theme.isDarkMode ? '#444' : '#ddd'};
  border-radius: 4px;
  font-size: 12px;
  color: ${props => props.theme.isDarkMode ? '#aaa' : '#666'};
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.isDarkMode ? 'rgba(60, 60, 60, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
    color: ${props => props.theme.primaryColor};
    border-color: ${props => props.theme.primaryColor};
  }
`;

const CollapseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  background: ${props => props.theme.isDarkMode ? '#2a2a2a' : '#f0f0f0'};
  border: none;
  border-top: 1px solid ${props => props.theme.isDarkMode ? '#444' : '#e0e0e0'};
  cursor: pointer;
  font-size: 13px;
  color: ${props => props.theme.isDarkMode ? '#aaa' : '#666'};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.theme.isDarkMode ? '#3a3a3a' : '#e0e0e0'};
  }

  svg {
    margin-right: 8px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: ${props => props.theme.isDarkMode ? '#2a2a2a' : '#f9f9f9'};
  border-top: 1px solid ${props => props.theme.isDarkMode ? '#444' : '#eee'};
`;

// 添加错误边界组件
export class CodeBlockErrorBoundary extends React.Component<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}, {
  hasError: boolean;
  error: Error | null;
}> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，下次渲染时显示降级UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 可以在此处记录错误信息
    console.error('代码块组件错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 提供降级UI
      return this.props.fallback || (
        <div style={{ 
          padding: '10px', 
          border: '1px solid #ff4d4f', 
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 77, 79, 0.05)',
          color: '#ff4d4f'
        }}>
          <p>代码块渲染错误，请尝试刷新页面</p>
          <small>{this.state.error?.message}</small>
        </div>
      );
    }

    return this.props.children;
  }
}

// 提取代码块内容为单独组件以便错误边界捕获其错误
export const CodeBlockContent = ({ language, codeString }: { 
  language: string, 
  codeString: string
}) => {
  // 代码折叠功能
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);
  const codeLines = codeString.split('\n');
  const isLongCode = codeLines.length > 5;
  
  // 使用useContext访问主题信息，而不是直接从document.body读取
  const { settings } = useChat();
  const isDarkMode = settings.theme.darkMode;
  const codeStyle = isDarkMode ? oneDark : oneLight;

  const toggleExpand = () => {
    // 如果要展开
    if (!isExpanded && isLongCode/* && codeLines.length > 50 */) {
      // 设置加载状态
      setIsLoading(true);
      
      // 延迟渲染完整代码，先让加载动画显示出来
      setTimeout(() => {
        setShowFullCode(true);
        setIsExpanded(true);
        // 再延迟一点关闭加载状态，确保渲染已完成
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }, 50);
    } else {
      // 收起操作
      // setIsExpanded(!isExpanded);
      // setShowFullCode(!isExpanded);
      setIsLoading(true);
      setTimeout(() => {
        setShowFullCode(false);
        setIsExpanded(false);
        // 再延迟一点关闭加载状态，确保渲染已完成
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      }, 50);
    }
  };
  
  const copyCode = () => {
    navigator.clipboard.writeText(codeString).then(() => {
      setCopied(true);
      message.success('代码已复制到剪贴板');
      
      // 2秒后重置复制状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
      message.error('复制失败');
    });
  };

  // 修复展开逻辑，确保只显示一个代码块
  return (
    <>
      {/* 复制按钮 */}
      <CopyButton onClick={copyCode}>
        {copied ? <CheckOutlined /> : <CopyOutlined />}
        {copied ? ' 已复制' : ' 复制'}
      </CopyButton>
      
      {/* 只需要一个代码块，根据展开状态决定显示的内容 */}
      {isLongCode && !isExpanded ? (
        // 未展开时只显示前5行
        <>
          <SyntaxHighlighter 
            style={codeStyle as any} 
            language={language}
            PreTag="div"
          >
            {codeLines.slice(0, 5).join('\n')}
          </SyntaxHighlighter>
          <CollapseButton onClick={toggleExpand}>
            <DownOutlined /> 展开代码 ({codeLines.length - 5} 行未显示)
          </CollapseButton>
        </>
      ) : (
        // 展开时或代码不长时，显示完整代码
        <>
          {isLoading ? (
            <>
              <SyntaxHighlighter 
                style={codeStyle as any} 
                language={language}
                PreTag="div"
              >
                {codeLines.slice(0, 5).join('\n')}
              </SyntaxHighlighter>
              <LoadingContainer>
                <Spin tip="代码加载中..." />
              </LoadingContainer>
            </>
          ) : (
            <SyntaxHighlighter 
              style={codeStyle as any} 
              language={language}
              PreTag="div"
            >
              {codeString}
            </SyntaxHighlighter>
          )}
          
          {isLongCode && (
            <CollapseButton onClick={toggleExpand}>
              <UpOutlined /> 收起代码
            </CollapseButton>
          )}
        </>
      )}
    </>
  );
};

// 修改CodeBlock组件使用react-collapse
export const CodeBlock = (props: any) => {
  const { className, children, inline } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  
  // 使用useContext访问主题信息
  const { settings } = useChat();
  const isDarkMode = settings.theme.darkMode;

  // 如果是行内代码，直接返回不需要错误边界
  if (inline) {
    return <code className={className}>{children}</code>;
  }

  // 使用错误边界封装展开/折叠功能
  return !inline && language ? (
    <CodeBlockWrapper>
      {language && <LanguageLabel>{language}</LanguageLabel>}
      
      <CodeBlockErrorBoundary fallback={
        <div style={{ 
          padding: '16px', 
          border: '1px solid #ff4d4f', 
          borderRadius: '8px',
          backgroundColor: isDarkMode ? 'rgba(255, 77, 79, 0.1)' : 'rgba(255, 77, 79, 0.05)',
          color: isDarkMode ? '#ff7875' : '#ff4d4f'
        }}>
          <p>代码块渲染错误，请尝试刷新页面</p>
        </div>
      }>
        <CodeBlockContent 
          language={language}
          codeString={codeString}
        />
      </CodeBlockErrorBoundary>
    </CodeBlockWrapper>
  ) : (
    <code className={className}>
      {children}
    </code>
  );
}; 