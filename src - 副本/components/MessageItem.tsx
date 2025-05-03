import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Avatar, Typography, Button, Table } from 'antd';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';
import { UserOutlined, RobotOutlined, CopyOutlined, CheckOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Message } from '../interfaces';

const { Text } = Typography;

interface MessageItemProps {
  message: Message;
}

// 代码块组件
const CodeBlock: React.FC<{children: string, language?: string}> = ({ children, language }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);
  
  const lines = children.split('\n');
  const isLongCode = lines.length > 5;
  const displayedLines = expanded || !isLongCode ? lines : lines.slice(0, 5);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <CodeBlockContainer>
      <CodeHeader>
        <CodeLanguage>{language || '代码'}</CodeLanguage>
        <CopyButton 
          type="text" 
          size="small" 
          icon={copied ? <CheckOutlined /> : <CopyOutlined />} 
          onClick={handleCopy}
        >
          {copied ? '已复制' : '复制'}
        </CopyButton>
      </CodeHeader>
      <Pre>
        <Code ref={codeRef}>
          {displayedLines.join('\n')}
          {isLongCode && !expanded && <FadedOverlay />}
        </Code>
      </Pre>
      {isLongCode && (
        <ExpandButton 
          type="link" 
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <UpOutlined /> : <DownOutlined />}
        >
          {expanded ? '收起代码' : `展开代码 (共${lines.length}行)`}
        </ExpandButton>
      )}
    </CodeBlockContainer>
  );
};

// 表格解析函数
const parseMarkdownTable = (tableStr: string) => {
  const lines = tableStr.trim().split('\n');
  if (lines.length < 3) return null;
  
  // 提取表头
  const headerLine = lines[0];
  const headers = headerLine.split('|')
    .map(h => h.trim())
    .filter(h => h !== '');
  
  // 跳过分隔行
  // 提取数据行
  const dataRows = lines.slice(2).map(line => {
    return line.split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '');
  });
  
  return {
    headers,
    dataRows
  };
};

// 处理 markdown 内容，提取代码块和表格
const renderMarkdown = (content: string): React.ReactNode => {
  // 解析代码块的正则表达式
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  
  // 解析表格的正则表达式
  const tableRegex = /\|(.*\|.*)\n\|([\s-:|]*\|[\s-:|]*)\n(\|.*(\n\|.*)*)/g;
  
  // 用于替换的占位符
  const CODE_PLACEHOLDER = "___CODE_BLOCK_PLACEHOLDER___";
  const TABLE_PLACEHOLDER = "___TABLE_PLACEHOLDER___";
  
  // 存储提取出的代码块和表格
  const codeBlocks: { placeholder: string, jsx: React.ReactNode }[] = [];
  const tables: { placeholder: string, jsx: React.ReactNode }[] = [];
  
  // 第一步：提取所有代码块并替换为占位符
  let processedContent = content;
  let match;
  let index = 0;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1];
    const code = match[2];
    const placeholder = `${CODE_PLACEHOLDER}${index}`;
    
    codeBlocks.push({
      placeholder,
      jsx: (
        <CodeBlock key={`code-${index}`} language={language || undefined}>
          {code}
        </CodeBlock>
      )
    });
    
    processedContent = processedContent.replace(match[0], placeholder);
    codeBlockRegex.lastIndex = 0; // 重置正则表达式
    index++;
  }
  
  // 第二步：提取所有表格并替换为占位符
  index = 0;
  tableRegex.lastIndex = 0;
  
  while ((match = tableRegex.exec(processedContent)) !== null) {
    const tableStr = match[0];
    const parsedTable = parseMarkdownTable(tableStr);
    
    if (parsedTable) {
      const placeholder = `${TABLE_PLACEHOLDER}${index}`;
      
      const columns = parsedTable.headers.map((header, i) => ({
        title: header,
        dataIndex: `col${i}`,
        key: `col${i}`,
      }));
      
      const dataSource = parsedTable.dataRows.map((row, rowIndex) => {
        const rowData: Record<string, string> = { key: `row-${rowIndex}` };
        row.forEach((cell, cellIndex) => {
          if (cellIndex < columns.length) {
            rowData[`col${cellIndex}`] = cell;
          }
        });
        return rowData;
      });
      
      tables.push({
        placeholder,
        jsx: (
          <StyledAntTable 
            key={`table-${index}`}
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="small"
            bordered
          />
        )
      });
      
      processedContent = processedContent.replace(tableStr, placeholder);
      tableRegex.lastIndex = 0; // 重置正则表达式
      index++;
    }
  }
  
  // 第三步：分割内容并替换回占位符
  const parts = processedContent.split(/(<\/?p>|___CODE_BLOCK_PLACEHOLDER___|___TABLE_PLACEHOLDER___\d+)/g)
    .filter(Boolean)
    .map((part, idx) => {
      // 检查是否是代码块占位符
      const codeMatch = part.match(new RegExp(`^${CODE_PLACEHOLDER}(\\d+)$`));
      if (codeMatch) {
        const codeIndex = parseInt(codeMatch[1], 10);
        return codeBlocks[codeIndex]?.jsx || <></>;
      }
      
      // 检查是否是表格占位符
      const tableMatch = part.match(new RegExp(`^${TABLE_PLACEHOLDER}(\\d+)$`));
      if (tableMatch) {
        const tableIndex = parseInt(tableMatch[1], 10);
        return tables[tableIndex]?.jsx || <></>;
      }
      
      // 普通文本使用ReactMarkdown渲染
      return (
        <ReactMarkdown key={`text-${idx}`}>
          {part}
        </ReactMarkdown>
      );
    });
    
  return parts;
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <MessageContainer isUser={isUser}>
      <MessageWrapper isUser={isUser}>
        <AvatarWrapper isUser={isUser}>
          <Avatar 
            icon={isUser ? <UserOutlined /> : <RobotOutlined />} 
            style={{ 
              backgroundColor: isUser ? '#1677ff' : '#52c41a',
            }} 
            size={40}
          />
        </AvatarWrapper>
        
        <MessageContent isUser={isUser}>
          {!isUser && (
            <MessageRole>
              {isUser ? '您' : 'AI 助手'}
            </MessageRole>
          )}
          
          <MessageText>
            {message.role === 'assistant' ? (
              <MarkdownContainer>
                {renderMarkdown(message.content || '正在思考...')}
              </MarkdownContainer>
            ) : (
              message.content
            )}
          </MessageText>
        </MessageContent>
      </MessageWrapper>
    </MessageContainer>
  );
};

// 外层容器，控制左右边距
const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  width: 100%;
`;

// 内层包装，用于控制消息和头像的排列
const MessageWrapper = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
  align-items: flex-start;
  max-width: 80%;
  width: 100%;
`;

const AvatarWrapper = styled.div<{ isUser: boolean }>`
  margin: ${props => props.isUser ? '0 0 0 16px' : '0 16px 0 0'};
  flex-shrink: 0;
`;

const MessageContent = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: ${props => props.isUser ? '#e6f7ff' : 'white'};
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: ${props => props.isUser ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.06)'};
  border: ${props => props.isUser ? '1px solid #d9d9d9' : 'none'};
  max-width: 100%;
`;

const MessageRole = styled(Text)`
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
  font-weight: 500;
`;

const MessageText = styled.div`
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
`;

// Ant Design 表格样式
const StyledAntTable = styled(Table)`
  margin: 16px 0;
  
  .ant-table-thead > tr > th {
    background-color: #fafafa;
    font-weight: 600;
  }
  
  .ant-table-tbody > tr > td {
    padding: 10px;
  }
  
  .ant-table-tbody > tr:nth-child(2n) {
    background-color: #fafafa;
  }
`;

// 代码块样式
const CodeBlockContainer = styled.div`
  position: relative;
  margin: 16px 0;
  border-radius: 6px;
  overflow: hidden;
  background-color: rgb(40, 44, 52);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: rgb(30, 34, 42);
  color: #eee;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
`;

const CodeLanguage = styled.span`
  text-transform: uppercase;
  color: #aaa;
`;

const CopyButton = styled(Button)`
  color: #eee;
  &:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 0;
  position: relative;
  overflow: auto;
`;

const Code = styled.div`
  padding: 12px 16px;
  overflow: auto;
  color: #eee;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
`;

const FadedOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, rgba(40, 44, 52, 0.9));
`;

const ExpandButton = styled(Button)`
  width: 100%;
  border-radius: 0;
  background-color: rgb(30, 34, 42);
  color: #eee;
  height: 32px;
  &:hover {
    color: #fff;
    background-color: rgb(35, 39, 47);
  }
`;

// 使用容器包装 ReactMarkdown 而不是直接样式化它
const MarkdownContainer = styled.div`
  & > * {
    margin: 0;
  }
  
  & > * + * {
    margin-top: 1em;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    line-height: 1.25;
    margin-top: 24px;
    margin-bottom: 16px;
  }
  
  h1 {
    font-size: 1.5em;
  }
  
  h2 {
    font-size: 1.3em;
  }
  
  h3 {
    font-size: 1.2em;
  }
  
  h4 {
    font-size: 1.1em;
  }
  
  h5, h6 {
    font-size: 1em;
  }
  
  a {
    color: #52c41a;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  blockquote {
    padding: 0 1em;
    color: #666;
    border-left: 0.25em solid #ddd;
    margin: 0;
  }
  
  ul, ol {
    padding-left: 2em;
    margin-top: 0;
    margin-bottom: 0;
  }
  
  li + li {
    margin-top: 0.25em;
  }
  
  p {
    margin-top: 0;
    margin-bottom: 1em;
  }
  
  code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 85%;
  }
  
  /* 表格样式 */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    overflow-x: auto;
    display: block;
  }
  
  th {
    padding: 10px;
    text-align: left;
    font-weight: 600;
    background-color: #fafafa;
    border: 1px solid #e8e8e8;
  }
  
  td {
    padding: 10px;
    border: 1px solid #e8e8e8;
  }
  
  tr {
    border-top: 1px solid #e8e8e8;
  }
  
  tr:nth-child(2n) {
    background-color: #fafafa;
  }
`;

export default MessageItem; 