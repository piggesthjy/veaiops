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

import { DataSourceWizard } from '@/components';
import { Tabs } from '@arco-design/web-react';
import type { DataSourceType, MonitorAccessProps } from '@datasource/lib';
import { XGuide } from '@veaiops/components'; // 暂时注释，有样式问题
import { logger } from '@veaiops/utils';
import { DataSourceType as ApiDataSourceType } from 'api-generate';
import type React from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { ConnectionManager } from '../../connection/ui/panels/connection-manager';
import { useDataSourceHandlers, useMonitorAccessLogic } from '../../hooks';
import { ManagementHeader, ManagementToolbar } from '../components';
import { renderDataSourceTabs } from './components';
import { createDataSourceConfigs } from './config';
import { useGuide } from './hooks/use-guide';
import { useTabManagement } from './hooks/use-tab-management';
import { useUrlParamHandlers } from './hooks/use-url-param-handlers';
import style from './index.module.less';

/**
 * 将小写的 tab key 转换为 DataSourceType 枚举值
 * @param tabKey - 小写的 tab key（如 'zabbix'）
 * @returns DataSourceType 枚举值（如 'Zabbix'）
 */
const convertTabKeyToDataSourceType = (tabKey: string): ApiDataSourceType => {
  const tabKeyLower = tabKey.toLowerCase();
  switch (tabKeyLower) {
    case 'zabbix':
      return ApiDataSourceType.ZABBIX;
    case 'aliyun':
      return ApiDataSourceType.ALIYUN;
    case 'volcengine':
      return ApiDataSourceType.VOLCENGINE;
    default:
      return ApiDataSourceType.VOLCENGINE; // 默认值
  }
};

/**
 * 监控接入管理页面
 * 提供监控接入的增删改查功能 - 使用拆分组件和业务逻辑分离
 *
 * 架构特点：
 * - 使用自定义Hook封装业务逻辑（useTabManagement, useMonitorAccessLogic, useDataSourceHandlers）
 * - 组件职责单一，易于维护（拆分为独立的组件和配置文件）
 * - 状态管理与UI渲染分离
 * - 支持配置化和扩展（createDataSourceConfigs）
 * - 模块化拆分：types.ts, config.ts, hooks/, components/
 */
export const MonitorAccessManagement: React.FC<MonitorAccessProps> = (
  props,
) => {
  logger.info({
    message: '🎨 MonitorAccessManagement component rendering',
    data: {},
    source: 'ManagementPage',
    component: 'render',
  });

  // Tab 管理逻辑
  const { activeTab, handleTabChange } = useTabManagement();

  // 引导配置
  const guideConfig = useGuide();

  // 🔥 监控组件挂载和卸载
  useEffect(() => {
    logger.info({
      message: '✨ MonitorAccessManagement mounted',
      data: {},
      source: 'ManagementPage',
      component: 'mount',
    });
    return () => {
      logger.info({
        message: '💥 MonitorAccessManagement unmounting',
        data: {},
        source: 'ManagementPage',
        component: 'unmount',
      });
    };
  }, []);

  // 使用自定义Hook获取所有业务逻辑
  const {
    // 状态
    pageTitle,

    // 事件处理器
    handleDelete,
  } = useMonitorAccessLogic(props);

  // 包装handleDelete函数以匹配 useDataSourceHandlers 期望的类型（对象参数，返回boolean）
  const wrappedHandleDeleteForHandlers = useCallback(
    async (params: {
      id: string;
      datasourceType: DataSourceType;
    }): Promise<boolean> => {
      const result = await handleDelete(params);
      return result.success;
    },
    [handleDelete],
  );

  // 数据源处理器逻辑
  const {
    // 状态
    connectionDrawerVisible,
    wizardVisible,
    editingDataSource,
    volcengineTableRef,
    aliyunTableRef,
    zabbixTableRef,

    // 事件处理器
    handleDeleteZabbix,
    handleDeleteAliyun,
    handleDeleteVolcengine,
    handleAdd,
    handleEditDataSource,
    handleWizardSuccess,
    handleOpenConnectionManager,
    handleCloseConnectionManager,

    // 设置器
    setWizardVisible,
    setEditingDataSource,
  } = useDataSourceHandlers({
    handleDelete: wrappedHandleDeleteForHandlers,
    handleTabChange,
  });

  // 🔥 监控 connectionDrawerVisible 状态变化
  useEffect(() => {
    logger.info({
      message: '📊 connectionDrawerVisible changed in ManagementPage',
      data: {
        visible: connectionDrawerVisible,
        timestamp: new Date().toISOString(),
      },
      source: 'ManagementPage',
      component: 'connectionDrawerVisible-effect',
    });
  }, [connectionDrawerVisible]);

  // 🔥 监控 wizardVisible 状态变化
  useEffect(() => {
    logger.info({
      message: '📊 wizardVisible changed in ManagementPage',
      data: {
        visible: wizardVisible,
        timestamp: new Date().toISOString(),
      },
      source: 'ManagementPage',
      component: 'wizardVisible-effect',
    });
  }, [wizardVisible]);

  // URL 参数处理逻辑（提取到独立 Hook）
  const {
    wrappedHandleOpenConnectionManager,
    wrappedHandleCloseConnectionManager,
    wrappedHandleAdd,
    wrappedHandleEditDataSource,
    wrappedSetWizardVisible,
  } = useUrlParamHandlers({
    connectionDrawerVisible,
    wizardVisible,
    handleOpenConnectionManager,
    handleCloseConnectionManager,
    handleAdd,
    handleEditDataSource,
    setWizardVisible,
  });

  // 数据源配置列表
  const dataSourceConfigs = useMemo(
    () =>
      createDataSourceConfigs({
        handleDeleteVolcengine,
        handleDeleteAliyun,
        handleDeleteZabbix,
      }),
    // 注意：wrappedHandleDeleteForConfig 未使用，但保留以备将来需要
    [handleDeleteVolcengine, handleDeleteAliyun, handleDeleteZabbix],
  );

  // 表格 Ref 映射
  const tableRefMap = useMemo(
    () => ({
      volcengineTableRef,
      aliyunTableRef,
      zabbixTableRef,
    }),
    [volcengineTableRef, aliyunTableRef, zabbixTableRef],
  );

  return (
    <div className="monitor-access-management">
      {/* 页面头部 */}
      <ManagementHeader pageTitle={pageTitle} />

      {/* 数据源Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        type="card-gutter"
        className={style.tabs}
        extra={
          <ManagementToolbar
            onOpenConnectionManager={wrappedHandleOpenConnectionManager}
            onAdd={wrappedHandleAdd}
          />
        }
      >
        {renderDataSourceTabs(
          dataSourceConfigs,
          tableRefMap,
          wrappedHandleEditDataSource,
        )}
      </Tabs>

      {/* 数据源创建/编辑向导 - 用于新增和编辑 */}
      <DataSourceWizard
        visible={wizardVisible}
        onClose={() => {
          wrappedSetWizardVisible(false);
          setEditingDataSource(null);
        }}
        onSuccess={handleWizardSuccess}
        editingDataSource={editingDataSource}
      />

      {/* 全局连接管理器 */}
      <ConnectionManager
        visible={connectionDrawerVisible}
        onClose={wrappedHandleCloseConnectionManager}
        defaultActiveTab={convertTabKeyToDataSourceType(activeTab)}
      />

      {/* 引导组件 */}
      <XGuide {...guideConfig} />
    </div>
  );
};

// 默认导出，用于向后兼容
export default MonitorAccessManagement;
