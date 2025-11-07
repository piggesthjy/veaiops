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

/**
 * 数据源连接面板组件
 */

import { useConnections } from '@/hooks/use-connections';
import { Alert, Button } from '@arco-design/web-react';
import { logger } from '@veaiops/utils';
import type { Connect, DataSourceType } from 'api-generate';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useConnectionPanelHandlers } from '../../hooks/use-connection-panel-handlers';
import { ConnectionModals } from '../modals/connection-modals';
import { ConnectionTable } from '../tables/connection-table';
import { ConnectionPanelHeader } from './connection-panel-header';

export interface ConnectionPanelProps {
  type: DataSourceType;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ type }) => {
  // 状态管理
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [editingConnect, setEditingConnect] = useState<Connect | null>(null);
  const [testingConnect, setTestingConnect] = useState<Connect | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  // 记录组件初始化日志
  useEffect(() => {
    logger.info({
      message: '[ConnectionPanel] 连接面板组件已初始化',
      data: {
        type,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'ConnectionPanel',
      component: 'init',
    });
  }, [type]);

  // 数据加载
  const {
    connections,
    loading,
    error,
    refresh,
    create,
    update,
    delete: remove,
  } = useConnections(type);

  useEffect(() => {
    logger.info({
      message: '[ConnectionPanel] 开始加载连接数据',
      data: {
        type,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'ConnectionPanel',
      component: 'loadData',
    });
    refresh();
  }, [refresh, type]);

  // 记录数据加载结果
  useEffect(() => {
    if (connections.length > 0) {
      logger.info({
        message: '[ConnectionPanel] 连接数据加载完成',
        data: {
          type,
          connectionCount: connections.length,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        source: 'ConnectionPanel',
        component: 'dataLoaded',
      });
    }
  }, [connections, type]);

  // 事件处理
  // 注意：update 函数已经使用对象解构参数，与 useConnectionPanelHandlers 的期望类型一致
  const handlers = useConnectionPanelHandlers({
    editingConnect,
    selectedRowKeys,
    create,
    update,
    remove,
    refresh,
    setCreateModalVisible,
    setEditModalVisible,
    setTestModalVisible,
    setEditingConnect,
    setTestingConnect,
    setSelectedRowKeys,
  });

  // 弹窗关闭处理
  const handleCreateCancel = () => {
    logger.info({
      message: '[ConnectionPanel] 取消创建连接',
      data: {
        type,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'ConnectionPanel',
      component: 'createCancel',
    });
    setCreateModalVisible(false);
  };

  const handleEditCancel = () => {
    logger.info({
      message: '[ConnectionPanel] 取消编辑连接',
      data: {
        type,
        editingConnectId: editingConnect?._id,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'ConnectionPanel',
      component: 'editCancel',
    });
    setEditModalVisible(false);
    setEditingConnect(null);
  };

  const handleTestClose = () => {
    logger.info({
      message: '[ConnectionPanel] 关闭连接测试',
      data: {
        type,
        testingConnectId: testingConnect?._id,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      source: 'ConnectionPanel',
      component: 'testClose',
    });
    setTestModalVisible(false);
    setTestingConnect(null);
  };

  return (
    <div className="connection-panel">
      {/* 头部 */}
      <ConnectionPanelHeader
        type={type}
        loading={loading}
        selectedCount={selectedRowKeys.length}
        onCreateClick={handlers.handleCreate}
        onRefreshClick={refresh}
        onBatchDeleteClick={handlers.handleBatchDelete}
      />

      {/* 错误提示 */}
      {error && (
        <Alert
          type="error"
          title="加载失败"
          content={error}
          className="mb-4"
          action={
            <Button size="small" onClick={refresh}>
              重试
            </Button>
          }
        />
      )}

      {/* 连接列表表格 */}
      <ConnectionTable
        type={type}
        connects={connections}
        loading={loading}
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={setSelectedRowKeys}
        onRefresh={refresh}
        onEdit={handlers.handleEdit}
        onDelete={handlers.handleDelete}
        onTest={handlers.handleTest}
        onCreateMonitor={handlers.handleCreateMonitor}
      />

      {/* 弹窗集合 */}
      <ConnectionModals
        type={type}
        createModalVisible={createModalVisible}
        editModalVisible={editModalVisible}
        testModalVisible={testModalVisible}
        editingConnect={editingConnect}
        testingConnect={testingConnect}
        onCreateSubmit={handlers.handleCreateSubmit}
        onEditSubmit={handlers.handleEditSubmit}
        onCreateCancel={handleCreateCancel}
        onEditCancel={handleEditCancel}
        onTestClose={handleTestClose}
      />
    </div>
  );
};

export default ConnectionPanel;
