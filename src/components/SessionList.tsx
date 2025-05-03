import React from 'react';
import styled from 'styled-components';
import { Button, List, Popconfirm, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useChat } from '../contexts/ChatContext';

const { Text } = Typography;

const SessionList: React.FC = () => {
  const { 
    sessions, 
    currentSessionId, 
    deleteSession,
    selectSession 
  } = useChat();

  return (
    <StyledSessionList>
      <List
        itemLayout="horizontal"
        dataSource={sessions}
        renderItem={(session) => (
          <SessionItem 
            key={session.id}
            active={session.id === currentSessionId}
            onClick={() => {
              selectSession(session.id);
            }}
          >
            <SessionIcon>💬</SessionIcon>
            <SessionTitle ellipsis>{session.title}</SessionTitle>
            <SessionActions onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Popconfirm
                title="确定要删除这个对话吗？"
                onConfirm={(e?: React.MouseEvent<HTMLElement>) => {
                  e?.stopPropagation();
                  deleteSession(session.id);
                }}
                okText="是"
                cancelText="否"
              >
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />} 
                  danger
                  aria-label="Delete session"
                />
              </Popconfirm>
            </SessionActions>
          </SessionItem>
        )}
      />
    </StyledSessionList>
  );
};

const StyledSessionList = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 0;
`;

const SessionItem = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  margin: 0 8px 4px 8px;
  background-color: ${props => props.active ? '#e6f7ff' : 'transparent'};
  border-left: 3px solid ${props => props.active ? '#1677ff' : 'transparent'};
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#d9f1ff' : '#f5f5f5'};
  }
`;

const SessionIcon = styled.span`
  margin-right: 12px;
  font-size: 16px;
`;

const SessionTitle = styled(Text)`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const SessionActions = styled.div`
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  align-items: center;

  ${SessionItem}:hover & {
    opacity: 1;
  }
`;

export default SessionList; 