// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  Alert,
  Button,
  Divider,
  Drawer,
  Space,
  Typography,
  Upload,
} from '@arco-design/web-react';
import {
  IconDownload,
  IconFile,
  IconUpload,
} from '@arco-design/web-react/icon';
import type React from 'react';
import { useState } from 'react';

const { Text, Title } = Typography;

interface ProjectImportDrawerProps {
  visible: boolean;
  loading: boolean;
  onImport: (file: File) => Promise<boolean>;
  onClose: () => void;
}

/**
 * 项目导入抽屉组件
 */
export const ProjectImportDrawer: React.FC<ProjectImportDrawerProps> = ({
  visible,
  loading,
  onImport,
  onClose,
}) => {
  const [fileList, setFileList] = useState<any[]>([]);

  const handleUpload = async () => {
    if (fileList.length > 0) {
      const file = fileList[0].originFile;
      if (file) {
        const success = await onImport(file);
        if (success) {
          setFileList([]);
        }
      }
    }
  };

  const handleClose = () => {
    setFileList([]);
    onClose();
  };

  const downloadTemplate = () => {
    // 创建CSV模板
    const csvContent =
      'project_id,name,description\n' +
      'PROJ001,示例项目1,这是一个示例项目描述\n' +
      'PROJ002,示例项目2,这是另一个示例项目描述';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'project_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Drawer
      title={
        <Space>
          <IconUpload />
          <Title heading={6} className="m-0">
            导入项目数据
          </Title>
        </Space>
      }
      visible={visible}
      onCancel={handleClose}
      width={520}
      focusLock={false}
      maskClosable={false}
      footer={
        <div className="text-right">
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={fileList.length === 0}
              onClick={handleUpload}
            >
              开始导入
            </Button>
          </Space>
        </div>
      }
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* 导入说明 */}
        <Alert
          type="info"
          content={
            <Space direction="vertical" size="small">
              <Text>请按照以下要求准备CSV文件：</Text>
              <Text>• 文件格式：CSV (逗号分隔值)</Text>
              <Text>• 字符编码：UTF-8</Text>
              <Text>• 必填字段：project_id, name</Text>
              <Text>• 可选字段：description</Text>
            </Space>
          }
        />

        {/* 模板下载 */}
        <div>
          <Space>
            <Button
              type="outline"
              icon={<IconDownload />}
              onClick={downloadTemplate}
            >
              下载模板文件
            </Button>
            <Text type="secondary">建议先下载模板文件，按格式填写数据</Text>
          </Space>
        </div>

        <Divider />

        {/* 文件上传 */}
        <div>
          <Title heading={6} className="mb-4">
            选择文件
          </Title>
          <Upload
            fileList={fileList}
            onChange={setFileList}
            accept=".csv"
            limit={1}
            drag
            tip="支持拖拽上传，仅支持CSV格式文件"
            autoUpload={false}
            beforeUpload={() => true}
          >
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <IconFile style={{ fontSize: '48px', color: '#C9CDD4' }} />
              <div style={{ marginTop: '16px' }}>
                <Text>点击或拖拽文件到此区域上传</Text>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" className="text-xs">
                  支持 .csv 格式，文件大小不超过 10MB
                </Text>
              </div>
            </div>
          </Upload>
        </div>

        {/* 注意事项 */}
        <Alert
          type="warning"
          content={
            <Space direction="vertical" size="small">
              <Text className="font-bold">注意事项：</Text>
              <Text>• 导入过程中请勿关闭页面或刷新浏览器</Text>
              <Text>• 如果项目ID已存在，将跳过该条记录</Text>
            </Space>
          }
        />
      </Space>
    </Drawer>
  );
};

export default ProjectImportDrawer;
