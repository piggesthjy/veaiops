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

import { Message } from '@arco-design/web-react';
import { TAB_KEYS } from '@datasource/lib';
import { logger, useManagementRefresh } from '@veaiops/utils';
import type { DataSource } from 'api-generate';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataSourceType } from '../lib/types';
import type { MonitorTableRef } from '../ui/components/tables/monitor-table';

/**
 * Delete parameters interface
 */
interface HandleDeleteParams {
  id: string;
  datasourceType: DataSourceType;
}

interface UseDataSourceHandlersProps {
  handleDelete: (params: HandleDeleteParams) => Promise<boolean>;
  handleTabChange?: (key: string) => void;
}

/**
 * Map data source type to tab key
 */
const mapDataSourceTypeToTabKey = (type: string): string | null => {
  const normalizedType = type.toLowerCase();
  switch (normalizedType) {
    case 'aliyun':
      return TAB_KEYS.ALIYUN;
    case 'volcengine':
      return TAB_KEYS.VOLCENGINE;
    case 'zabbix':
      return TAB_KEYS.ZABBIX;
    default:
      return null;
  }
};

/**
 * Data source event handler Hook
 */
export const useDataSourceHandlers = ({
  handleDelete,
  handleTabChange,
}: UseDataSourceHandlersProps) => {
  logger.info({
    message: '🚀 useDataSourceHandlers Hook initialized',
    data: {},
    source: 'useDataSourceHandlers',
    component: 'init',
  });

  // Connection management drawer state
  const [connectionDrawerVisible, setConnectionDrawerVisible] = useState(false);

  // Data source wizard state
  const [wizardVisible, setWizardVisible] = useState(false);

  // Currently editing data source
  const [editingDataSource, setEditingDataSource] = useState<DataSource | null>(
    null,
  );

  // Monitor connection management drawer state changes
  useEffect(() => {
    logger.info({
      message: '📊 connectionDrawerVisible changed',
      data: {
        visible: connectionDrawerVisible,
        timestamp: new Date().toISOString(),
      },
      source: 'useDataSourceHandlers',
      component: 'connectionDrawerVisible-effect',
    });
  }, [connectionDrawerVisible]);

  // Monitor data source wizard state changes
  useEffect(() => {
    logger.info({
      message: '📊 wizardVisible changed',
      data: {
        visible: wizardVisible,
        timestamp: new Date().toISOString(),
      },
      source: 'useDataSourceHandlers',
      component: 'wizardVisible-effect',
    });
  }, [wizardVisible]);

  // Table references
  const volcengineTableRef = useRef<MonitorTableRef>(null);
  const aliyunTableRef = useRef<MonitorTableRef>(null);
  const zabbixTableRef = useRef<MonitorTableRef>(null);

  // Use useManagementRefresh hook to uniformly manage refresh logic
  const volcengineRefresh = useManagementRefresh(async () => {
    if (volcengineTableRef.current?.refresh) {
      const result = await volcengineTableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: 'Volcengine 表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'DataSource',
          component: 'volcengineRefresh',
        });
      }
    }
  });

  const aliyunRefresh = useManagementRefresh(async () => {
    if (aliyunTableRef.current?.refresh) {
      const result = await aliyunTableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: 'Aliyun 表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'DataSource',
          component: 'aliyunRefresh',
        });
      }
    }
  });

  const zabbixRefresh = useManagementRefresh(async () => {
    if (zabbixTableRef.current?.refresh) {
      const result = await zabbixTableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: 'Zabbix 表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'DataSource',
          component: 'zabbixRefresh',
        });
      }
    }
  });

  // Create specific delete handler function for each data source type
  const handleDeleteZabbix = useCallback(
    async (monitorId: string, _dataSourceType?: DataSourceType) => {
      return await handleDelete({
        id: monitorId,
        datasourceType: 'Zabbix' as DataSourceType,
      });
    },
    [handleDelete],
  );

  const handleDeleteAliyun = useCallback(
    async (monitorId: string, _dataSourceType?: DataSourceType) => {
      return await handleDelete({
        id: monitorId,
        datasourceType: 'Aliyun' as DataSourceType,
      });
    },
    [handleDelete],
  );

  const handleDeleteVolcengine = useCallback(
    async (monitorId: string, _dataSourceType?: DataSourceType) => {
      return await handleDelete({
        id: monitorId,
        datasourceType: 'Volcengine' as DataSourceType,
      });
    },
    [handleDelete],
  );

  // Override add handler, use data source wizard
  const handleAdd = () => {
    logger.info({
      message: '➕ handleAdd called - opening DataSourceWizard',
      data: {
        currentState: { connectionDrawerVisible, wizardVisible },
      },
      source: 'useDataSourceHandlers',
      component: 'handleAdd',
    });

    setEditingDataSource(null); // Clear edit state
    setWizardVisible(true);
    logger.info({
      message: '✅ setWizardVisible(true) executed',
      data: { wizardVisible: true },
      source: 'useDataSourceHandlers',
      component: 'handleAdd',
    });
  };

  // Handle edit data source
  const handleEditDataSource = (dataSource: DataSource) => {
    // Only log key fields to avoid circular references
    logger.info({
      message: '✏️ handleEditDataSource called',
      data: {
        dataSourceId: dataSource?._id,
        dataSourceName: dataSource?.name,
        dataSourceType: dataSource?.type,
        currentState: { connectionDrawerVisible, wizardVisible },
      },
      source: 'useDataSourceHandlers',
      component: 'handleEditDataSource',
    });

    setEditingDataSource(dataSource);
    setWizardVisible(true);
    logger.info({
      message: '✅ setWizardVisible(true) executed for edit mode',
      data: { wizardVisible: true },
      source: 'useDataSourceHandlers',
      component: 'handleEditDataSource',
    });
  };

  // Handle data source wizard success
  const handleWizardSuccess = useCallback(
    async (dataSource: unknown) => {
      logger.info({
        message: '[handleWizardSuccess] 开始处理创建成功回调',
        data: {
          hasDataSource: Boolean(dataSource),
          dataSourceType: (dataSource as { type?: string })?.type,
          dataSourceName: (dataSource as { name?: string })?.name,
          hasHandleTabChange: Boolean(handleTabChange),
        },
        source: 'useDataSourceHandlers',
        component: 'handleWizardSuccess',
      });

      // Check if there are returnUrl and datasource_type parameters (redirected from threshold/config page)
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get('returnUrl');
      const datasourceTypeParam = searchParams.get('datasource_type');

      logger.info({
        message: '[handleWizardSuccess] 检查 URL 参数',
        data: {
          returnUrl,
          datasourceTypeParam,
          currentUrl: window.location.href,
        },
        source: 'useDataSourceHandlers',
        component: 'handleWizardSuccess',
      });

      setWizardVisible(false);

      // Refresh corresponding table based on data source type, use useManagementRefresh's afterCreate method
      const dataSourceInfo = dataSource as {
        type?: string;
        name?: string;
        dataSourceId?: string;
      };

      logger.info({
        message: '[handleWizardSuccess] 解析数据源信息',
        data: {
          dataSourceInfo,
          type: dataSourceInfo?.type,
          typeLowercase: dataSourceInfo?.type?.toLowerCase(),
          name: dataSourceInfo?.name,
        },
        source: 'useDataSourceHandlers',
        component: 'handleWizardSuccess',
      });

      if (dataSourceInfo?.type) {
        const normalizedType = dataSourceInfo.type.toLowerCase();

        // Show success message
        const dataSourceTypeText =
          normalizedType === 'aliyun'
            ? '阿里云'
            : normalizedType === 'volcengine'
              ? '火山引擎'
              : normalizedType === 'zabbix'
                ? 'Zabbix'
                : dataSourceInfo.type;
        const successMessage = dataSourceInfo.name
          ? `数据源 "${dataSourceInfo.name}" 创建成功`
          : `${dataSourceTypeText} 数据源创建成功`;

        Message.success(successMessage);

        logger.info({
          message: '[handleWizardSuccess] 显示成功提示',
          data: {
            successMessage,
            dataSourceTypeText,
          },
          source: 'useDataSourceHandlers',
          component: 'handleWizardSuccess',
        });

        // Refresh corresponding table
        logger.info({
          message: '[handleWizardSuccess] 准备刷新表格',
          data: {
            normalizedType,
          },
          source: 'useDataSourceHandlers',
          component: 'handleWizardSuccess',
        });

        switch (normalizedType) {
          case 'volcengine':
            logger.info({
              message: '[handleWizardSuccess] 刷新 Volcengine 表格',
              data: {},
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });
            await volcengineRefresh.afterCreate();
            break;
          case 'aliyun':
            logger.info({
              message: '[handleWizardSuccess] 刷新 Aliyun 表格',
              data: {},
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });
            await aliyunRefresh.afterCreate();
            break;
          case 'zabbix':
            logger.info({
              message: '[handleWizardSuccess] 刷新 Zabbix 表格',
              data: {},
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });
            await zabbixRefresh.afterCreate();
            break;
          default:
            logger.warn({
              message: '[handleWizardSuccess] 未知的数据源类型，无法刷新表格',
              data: {
                normalizedType,
                originalType: dataSourceInfo.type,
              },
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });
            break;
        }

        // Switch to corresponding tab
        logger.info({
          message: '[handleWizardSuccess] 准备切换到对应的 tab',
          data: {
            hasHandleTabChange: Boolean(handleTabChange),
            dataSourceType: dataSourceInfo.type,
            normalizedType,
          },
          source: 'useDataSourceHandlers',
          component: 'handleWizardSuccess',
        });

        if (handleTabChange) {
          const tabKey = mapDataSourceTypeToTabKey(dataSourceInfo.type);

          logger.info({
            message: '[handleWizardSuccess] Tab Key 映射结果',
            data: {
              originalType: dataSourceInfo.type,
              normalizedType,
              tabKey,
              tabKeys: TAB_KEYS,
            },
            source: 'useDataSourceHandlers',
            component: 'handleWizardSuccess',
          });

          if (tabKey) {
            logger.info({
              message: '[handleWizardSuccess] 执行 tab 切换',
              data: {
                dataSourceType: dataSourceInfo.type,
                tabKey,
                handleTabChangeType: typeof handleTabChange,
              },
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });

            try {
              handleTabChange(tabKey);

              logger.info({
                message: '[handleWizardSuccess] Tab 切换执行完成',
                data: {
                  tabKey,
                },
                source: 'useDataSourceHandlers',
                component: 'handleWizardSuccess',
              });
            } catch (error: unknown) {
              const errorObj =
                error instanceof Error ? error : new Error(String(error));
              logger.error({
                message: '[handleWizardSuccess] Tab 切换执行失败',
                data: {
                  error: errorObj.message,
                  stack: errorObj.stack,
                  errorObj,
                  tabKey,
                },
                source: 'useDataSourceHandlers',
                component: 'handleWizardSuccess',
              });
            }
          } else {
            logger.warn({
              message: '[handleWizardSuccess] 无法映射数据源类型到 tab key',
              data: {
                dataSourceType: dataSourceInfo.type,
                normalizedType,
                availableTabKeys: Object.values(TAB_KEYS),
              },
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });
          }
        } else {
          logger.warn({
            message:
              '[handleWizardSuccess] handleTabChange 未提供，无法切换 tab',
            data: {
              dataSourceType: dataSourceInfo.type,
            },
            source: 'useDataSourceHandlers',
            component: 'handleWizardSuccess',
          });
        }

        // If returnUrl and datasource_type parameters exist, redirect back to threshold/config page
        if (returnUrl && datasourceTypeParam) {
          logger.info({
            message: '[handleWizardSuccess] 准备跳转回 threshold/config 页面',
            data: {
              returnUrl,
              datasourceTypeParam,
              createdDataSourceType: dataSourceInfo.type,
            },
            source: 'useDataSourceHandlers',
            component: 'handleWizardSuccess',
          });

          // Build redirect URL, ensure datasource_type parameter is correct
          try {
            const returnUrlObj = new URL(returnUrl, window.location.origin);
            returnUrlObj.searchParams.set(
              'datasource_type',
              datasourceTypeParam,
            );
            const finalUrl = returnUrlObj.pathname + returnUrlObj.search;

            logger.info({
              message: '[handleWizardSuccess] 执行页面跳转',
              data: {
                finalUrl,
                datasourceType: datasourceTypeParam,
              },
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });

            // Use window.location.href for full page refresh to ensure data source list is updated
            window.location.href = finalUrl;
            // Do not execute subsequent logic after redirect
          } catch (error: unknown) {
            const errorObj =
              error instanceof Error ? error : new Error(String(error));
            logger.error({
              message: '[handleWizardSuccess] 跳转 URL 构建失败',
              data: {
                error: errorObj.message,
                stack: errorObj.stack,
                errorObj,
                returnUrl,
                datasourceTypeParam,
              },
              source: 'useDataSourceHandlers',
              component: 'handleWizardSuccess',
            });
            // When URL construction fails, continue executing original logic
          }
        }
      } else {
        logger.warn({
          message: '[handleWizardSuccess] 数据源信息中缺少 type 字段',
          data: {
            dataSourceInfo,
          },
          source: 'useDataSourceHandlers',
          component: 'handleWizardSuccess',
        });
      }
    },
    [volcengineRefresh, aliyunRefresh, zabbixRefresh, handleTabChange],
  );

  /**
   * Open connection management drawer
   */
  const handleOpenConnectionManager = () => {
    logger.info({
      message:
        '🔗 handleOpenConnectionManager called - opening ConnectionManager',
      data: {
        currentState: {
          connectionDrawerVisible,
          wizardVisible,
        },
      },
      source: 'useDataSourceHandlers',
      component: 'handleOpenConnectionManager',
    });

    setConnectionDrawerVisible(true);
    logger.info({
      message: '✅ setConnectionDrawerVisible(true) executed',
      data: { connectionDrawerVisible: true },
      source: 'useDataSourceHandlers',
      component: 'handleOpenConnectionManager',
    });
  };

  /**
   * Close connection management drawer
   */
  const handleCloseConnectionManager = () => {
    logger.info({
      message:
        '❌ handleCloseConnectionManager called - closing ConnectionManager',
      data: {
        currentState: { connectionDrawerVisible, wizardVisible },
      },
      source: 'useDataSourceHandlers',
      component: 'handleCloseConnectionManager',
    });
    setConnectionDrawerVisible(false);
    logger.info({
      message: '✅ setConnectionDrawerVisible(false) executed',
      data: { connectionDrawerVisible: false },
      source: 'useDataSourceHandlers',
      component: 'handleCloseConnectionManager',
    });
  };

  return {
    // State
    connectionDrawerVisible,
    wizardVisible,
    editingDataSource,
    volcengineTableRef,
    aliyunTableRef,
    zabbixTableRef,
    volcengineRefresh,
    aliyunRefresh,
    zabbixRefresh,

    // Event handlers
    handleDeleteZabbix,
    handleDeleteAliyun,
    handleDeleteVolcengine,
    handleAdd,
    handleEditDataSource,
    handleWizardSuccess,
    handleOpenConnectionManager,
    handleCloseConnectionManager,

    // Setters
    setWizardVisible,
    setEditingDataSource,
  };
};
