import React, { useState } from 'react';
// src/pages/SettingsPage.tsx，大约在第17行附近添加
import { Button, Form, Input, InputNumber, Card, Typography, Space, Divider, Switch, Select, Modal, Tabs, Tooltip, App } from 'antd';
import styled from 'styled-components';
import { ArrowLeftOutlined, ClearOutlined, SaveOutlined, ReloadOutlined, InfoCircleOutlined, UserOutlined, ApiOutlined, BgColorsOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import { AppSettings } from '../interfaces';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const ColorPicker = React.forwardRef<HTMLInputElement, { defaultValue: string; onChange?: (value: string) => void }>(
  ({ defaultValue, onChange }, ref) => {
    const [color, setColor] = useState(defaultValue);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setColor(newColor);
      onChange?.(newColor);
    };
    
    return (
      <Space>
        <input
          ref={ref}
          type="color"
          value={color}
          onChange={handleChange}
          style={{ width: 80, height: 32, padding: 4, border: '1px solid #d9d9d9', borderRadius: 2 }}
        />
        <Text>{color}</Text>
      </Space>
    );
  }
);

const SettingsPage: React.FC = () => {
  const { settings, setSettings, clearCache } = useChat();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('api');
  
  const { message: messageApi } = App.useApp();
  
  // 使用useModal钩子
  const [modal, contextHolder] = Modal.useModal();

  const onFinish = (values: AppSettings) => {
    setSettings({
      ...settings,
      ...values,
      theme: {
        ...settings.theme,
        primaryColor: values.theme?.primaryColor || '#49D9FD',
        darkMode: values.theme?.darkMode
      }
    });
    messageApi.success('设置已保存');
  };

  const handleClearCache = () => {
    modal.confirm({
      title: '确认清除所有缓存',
      content: '这将删除所有聊天记录和设置，恢复应用到初始状态。此操作不可撤销，是否继续？',
      okText: '确认清除',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        clearCache();
        messageApi.success('缓存已清除，应用已重置');
        // 刷新表单以显示默认值
        form.resetFields();
        
        // 为了确保完全重置，可以考虑在短暂延迟后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      },
    });
  };

  const handleTestConnection = async () => {
  const apiEndpoint = form.getFieldValue('apiEndpoint');
  const apiKey = form.getFieldValue('apiKey');
  
  if (!apiEndpoint || !apiKey) {
    messageApi.error('请先填写API接口地址和密钥');
    return;
  }
  
  try {
    // 显示加载中提示
    const hide = messageApi.loading('正在测试连接...', 0);
    
    // 规范化API端点URL
    const baseUrl = apiEndpoint.endsWith('/') 
      ? apiEndpoint.slice(0, -1) 
      : apiEndpoint;
    
    // 构建测试请求URL
    const testUrl = `${baseUrl}/models`;
    
    // 发送实际请求测试连接
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    // 关闭加载提示
    hide();
    
    if (response.ok) {
      // 关闭加载提示
    hide();
      // 请求成功
      messageApi.success('连接成功！API密钥有效');
      
      // 可选：显示可用的模型
      try {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          // 如果返回了模型列表，可以更新模型选择下拉框
          console.log('可用模型:', data.data);
          // 这里可以更新模型选择器的选项
        }
      } catch (e) {
        console.error('解析响应数据失败', e);
      }
    } else {
      // 请求失败
      // 关闭加载提示
    hide();
      let errorMessage = `连接失败 (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch (e) {
        // 如果不是JSON格式，尝试获取文本
        try {
          errorMessage = await response.text();
        } catch {
          // 忽略文本获取错误
        }
      }
      messageApi.error(errorMessage);
    }
  } catch (error) {
    // 网络错误或其他异常
    messageApi.error(`测试连接出错: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

  const modelOptions = [
    { "label": "chat-bison-001", "value": "chat-bison-001" },
    { "label": "text-bison-001", "value": "text-bison-001" },
    { "label": "embedding-gecko-001", "value": "embedding-gecko-001" },
    { "label": "gemini-1.0-pro-vision-latest", "value": "gemini-1.0-pro-vision-latest" },
    { "label": "gemini-pro-vision", "value": "gemini-pro-vision" },
    { "label": "gemini-1.5-pro-latest", "value": "gemini-1.5-pro-latest" },
    { "label": "gemini-1.5-pro-001", "value": "gemini-1.5-pro-001" },
    { "label": "gemini-1.5-pro-002", "value": "gemini-1.5-pro-002" },
    { "label": "gemini-1.5-pro", "value": "gemini-1.5-pro" },
    { "label": "gemini-1.5-flash-latest", "value": "gemini-1.5-flash-latest" },
    { "label": "gemini-1.5-flash-001", "value": "gemini-1.5-flash-001" },
    { "label": "gemini-1.5-flash-001-tuning", "value": "gemini-1.5-flash-001-tuning" },
    { "label": "gemini-1.5-flash", "value": "gemini-1.5-flash" },
    { "label": "gemini-1.5-flash-002", "value": "gemini-1.5-flash-002" },
    { "label": "gemini-1.5-flash-8b", "value": "gemini-1.5-flash-8b" },
    { "label": "gemini-1.5-flash-8b-001", "value": "gemini-1.5-flash-8b-001" },
    { "label": "gemini-1.5-flash-8b-latest", "value": "gemini-1.5-flash-8b-latest" },
    { "label": "gemini-1.5-flash-8b-exp-0827", "value": "gemini-1.5-flash-8b-exp-0827" },
    { "label": "gemini-1.5-flash-8b-exp-0924", "value": "gemini-1.5-flash-8b-exp-0924" },
    { "label": "gemini-2.5-pro-exp-03-25", "value": "gemini-2.5-pro-exp-03-25" },
    { "label": "gemini-2.5-pro-preview-03-25", "value": "gemini-2.5-pro-preview-03-25" },
    { "label": "gemini-2.5-flash-preview-04-17", "value": "gemini-2.5-flash-preview-04-17" },
    { "label": "gemini-2.0-flash-exp", "value": "gemini-2.0-flash-exp" },
    { "label": "gemini-2.0-flash", "value": "gemini-2.0-flash" },
    { "label": "gemini-2.0-flash-001", "value": "gemini-2.0-flash-001" },
    { "label": "gemini-2.0-flash-exp-image-generation", "value": "gemini-2.0-flash-exp-image-generation" },
    { "label": "gemini-2.0-flash-lite-001", "value": "gemini-2.0-flash-lite-001" },
    { "label": "gemini-2.0-flash-lite", "value": "gemini-2.0-flash-lite" },
    { "label": "gemini-2.0-flash-lite-preview-02-05", "value": "gemini-2.0-flash-lite-preview-02-05" },
    { "label": "gemini-2.0-flash-lite-preview", "value": "gemini-2.0-flash-lite-preview" },
    { "label": "gemini-2.0-pro-exp", "value": "gemini-2.0-pro-exp" },
    { "label": "gemini-2.0-pro-exp-02-05", "value": "gemini-2.0-pro-exp-02-05" },
    { "label": "gemini-exp-1206", "value": "gemini-exp-1206" },
    { "label": "gemini-2.0-flash-thinking-exp-01-21", "value": "gemini-2.0-flash-thinking-exp-01-21" },
    { "label": "gemini-2.0-flash-thinking-exp", "value": "gemini-2.0-flash-thinking-exp" },
    { "label": "gemini-2.0-flash-thinking-exp-1219", "value": "gemini-2.0-flash-thinking-exp-1219" },
    { "label": "learnlm-1.5-pro-experimental", "value": "learnlm-1.5-pro-experimental" },
    { "label": "learnlm-2.0-flash-experimental", "value": "learnlm-2.0-flash-experimental" },
    { "label": "gemma-3-1b-it", "value": "gemma-3-1b-it" },
    { "label": "gemma-3-4b-it", "value": "gemma-3-4b-it" },
    { "label": "gemma-3-12b-it", "value": "gemma-3-12b-it" },
    { "label": "gemma-3-27b-it", "value": "gemma-3-27b-it" },
    { "label": "embedding-001", "value": "embedding-001" },
    { "label": "text-embedding-004", "value": "text-embedding-004" },
    { "label": "gemini-embedding-exp-03-07", "value": "gemini-embedding-exp-03-07" },
    { "label": "gemini-embedding-exp", "value": "gemini-embedding-exp" },
    { "label": "aqa", "value": "aqa" },
    { "label": "imagen-3.0-generate-002", "value": "imagen-3.0-generate-002" },
    { "label": "gemini-2.0-flash-live-001", "value": "gemini-2.0-flash-live-001" }
  
  ];

  return (
    <SettingsContainer>
      {contextHolder}
      <Header>
        <Link to="/">
          <Button type="text" icon={<ArrowLeftOutlined />} size="large">
            返回
          </Button>
        </Link>
        <Title level={3}>设置</Title>
        <Space>
          <Tooltip title="清除所有缓存和设置">
            <Button 
              type="text"
              danger
              icon={<ClearOutlined />}
              onClick={handleClearCache}
            >
              清除缓存
            </Button>
          </Tooltip>
        </Space>
      </Header>

      <SettingsTabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<TabLabel icon={<ApiOutlined />} text="API 设置" />} key="api">
          <SettingsCard>
            <Form
              form={form}
              layout="vertical"
              initialValues={settings}
              onFinish={onFinish}
              requiredMark={false}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4}>API 连接配置</Title>
                <Paragraph type="secondary">
                  配置 API 连接参数，支持 OpenAI API 及兼容接口
                </Paragraph>
                
                <Form.Item
                  name="apiEndpoint"
                  label="API 接口地址"
                  rules={[{ required: true, message: '请输入 API 接口地址' }]}
                  tooltip={{ title: "支持官方、代理或自建，确保接口格式兼容", icon: <InfoCircleOutlined /> }}
                >
                  <Input 
                    placeholder="https://api.openai.com/v1"
                    addonAfter={
                      <Tooltip title="测试连接">
                        <Button 
                          type="text" 
                          icon={<ReloadOutlined />} 
                          onClick={handleTestConnection}
                          style={{ border: 'none', padding: '0 8px' }}
                        />
                      </Tooltip>
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="apiKey"
                  label="API 密钥"
                  rules={[{ required: true, message: '请输入 API 密钥' }]}
                >
                  <Input.Password placeholder="sk-..." />
                </Form.Item>

                <Form.Item
                  name="model"
                  label="模型"
                  tooltip={{ title: "选择您要使用的AI模型", icon: <InfoCircleOutlined /> }}
                >
                  <Select
                    showSearch
                    placeholder="选择模型"
                    options={modelOptions}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="systemPrompt"
                  label="系统提示词"
                  tooltip={{ title: "设置AI的行为和角色定位", icon: <InfoCircleOutlined /> }}
                >
                  <TextArea
                    placeholder="你是一个有用的AI助手。"
                    autoSize={{ minRows: 2, maxRows: 6 }}
                  />
                </Form.Item>

              </Space>
              
              <Divider />
              
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </SettingsCard>
        </TabPane>

        <TabPane tab={<TabLabel icon={<BgColorsOutlined />} text="界面设置" />} key="appearance">
          <SettingsCard>
            <Form
              form={form}
              layout="vertical"
              initialValues={settings}
              onFinish={onFinish}
              requiredMark={false}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={4}>外观设置</Title>
                <Paragraph type="secondary">
                  自定义应用主题和界面样式
                </Paragraph>

                <Form.Item
                  name={['theme', 'primaryColor']}
                  label="主题色"
                  tooltip={{ title: "选择应用的主题色", icon: <InfoCircleOutlined /> }}
                >
                  <ColorPicker defaultValue={form.getFieldValue(['theme', 'primaryColor']) || '#49D9FD'} />
                </Form.Item>

                <Form.Item
                  name={['theme', 'darkMode']}
                  label="夜间模式"
                  valuePropName="checked"
                  tooltip={{ title: "启用夜间模式", icon: <InfoCircleOutlined /> }}
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="enableMarkdown"
                  label="启用Markdown"
                  valuePropName="checked"
                  tooltip={{ title: "启用Markdown渲染", icon: <InfoCircleOutlined /> }}
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  name="showTimestamp"
                  label="显示时间戳"
                  valuePropName="checked"
                  tooltip={{ title: "在消息下方显示发送时间", icon: <InfoCircleOutlined /> }}
                >
                  <Switch />
                </Form.Item>

                <Form.Item
                  name="enableStreaming"
                  label="流式输出"
                  valuePropName="checked"
                  tooltip={{ title: "启用流式响应，实时显示AI输出", icon: <InfoCircleOutlined /> }}
                >
                  <Switch />
                </Form.Item>
                
              </Space>

                <Divider />

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存设置
                  </Button>
              </Form.Item>
              </Form>
          </SettingsCard>
        </TabPane>
      </SettingsTabs>
    </SettingsContainer>
  );
};

const SettingsContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  
  h3 {
    margin: 0;
    flex-grow: 1;
    text-align: center;
    color: ${props => props.theme.colors.text};
  }
`;

const SettingsCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px ${props => props.theme.isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
  margin-bottom: 24px;
  background-color: ${props => props.theme.colors.cardBackground};
  
  .ant-card-body {
    color: ${props => props.theme.colors.text};
  }
  
  .ant-typography {
    color: ${props => props.theme.colors.text};
  }
  
  .ant-typography-secondary {
    color: ${props => props.theme.colors.secondaryText};
  }
  
  .ant-form-item-label > label {
    color: ${props => props.theme.colors.text};
  }
`;

const SettingsTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px;
  }
  
  .ant-tabs-tab {
    color: ${props => props.theme.colors.secondaryText};
    
    &:hover {
      color: ${props => props.theme.primaryColor};
    }
    
    &.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: ${props => props.theme.primaryColor} !important;
    }
  }
  
  .ant-tabs-ink-bar {
    background-color: ${props => props.theme.primaryColor};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const ColorPickerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TabLabel: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <Space>
    {icon}
    <span>{text}</span>
  </Space>
);

export default SettingsPage; 