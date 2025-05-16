import React from 'react';
import styled from 'styled-components';
import { Button, List, Popconfirm, Typography } from 'antd';
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { useChat } from '../contexts/ChatContext';
import { 
  DndContext, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  closestCenter,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

// 会话接口
interface SessionProps {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt?: number;
}

// 可排序项属性
interface SortableSessionItemProps {
  session: SessionProps;
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

// 可排序的会话项组件
const SortableSessionItem: React.FC<SortableSessionItemProps> = ({ 
  session, 
  currentSessionId, 
  onSelect, 
  onDelete 
}) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as 'relative',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <SessionItem 
      ref={setNodeRef}
      style={style}
      active={session.id === currentSessionId}
      dragging={isDragging}
      onClick={() => onSelect(session.id)}
    >
      <DragHandle {...attributes} {...listeners}>
        <HolderOutlined />
      </DragHandle>
      <SessionIcon>💬</SessionIcon>
      <SessionTitle ellipsis>{session.title}</SessionTitle>
      <SessionActions onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Popconfirm
          title="确定要删除这个对话吗？"
          onConfirm={(e?: React.MouseEvent<HTMLElement>) => {
            e?.stopPropagation();
            onDelete(session.id);
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
  );
};

const SessionList: React.FC = () => {
  const { 
    sessions, 
    currentSessionId, 
    deleteSession,
    selectSession,
    reorderSessions,
  } = useChat();

  // 配置传感器，控制拖拽行为
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // 需要拖动至少0px才激活拖拽
      },
    })
  );

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = sessions.findIndex(session => session.id === active.id);
      const newIndex = sessions.findIndex(session => session.id === over.id);
      
      // 调用上下文中的重排方法
      reorderSessions(oldIndex, newIndex);
    }
  };

  return (
    <StyledSessionList>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={sessions.map(session => session.id)}
          strategy={verticalListSortingStrategy}
        >
          <List
            itemLayout="horizontal"
            dataSource={sessions}
            renderItem={(session) => (
              <SortableSessionItem
                key={session.id}
                session={session}
                currentSessionId={currentSessionId}
                onSelect={selectSession}
                onDelete={deleteSession}
              />
            )}
          />
        </SortableContext>
      </DndContext>
    </StyledSessionList>
  );
};

const StyledSessionList = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 0;
`;

const SessionItem = styled.div<{ active: boolean; dragging?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: ${props => props.dragging ? 'grabbing' : 'pointer'};
  border-radius: 4px;
  margin: 0 8px 4px 8px;
  background-color: ${props => props.active ? '#e6f7ff' : 'transparent'};
  border-left: 3px solid ${props => props.active ? '#1677ff' : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#d9f1ff' : '#f5f5f5'};
    border-left-color: ${props => props.active ? '#1677ff' : '#d9d9d9'};
  }
`;

const DragHandle = styled.div`
  margin-right: 8px;
  cursor: grab;
  color: #999;
  
  &:hover {
    color: #666;
  }
  
  &:active {
    cursor: grabbing;
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