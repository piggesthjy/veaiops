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

import { useConnections } from '@/hooks/use-connections';
import { CreateConnectionModal } from '@/modules/system/features/datasource/connection/ui/modals';
import { Button, Card, Message, Typography } from '@arco-design/web-react';
import { IconLocation, IconPlus } from '@arco-design/web-react/icon';
import {
  DataSourceType as ApiDataSourceType,
  type Connect,
  type ConnectCreateRequest,
  DataSource,
} from '@veaiops/api-client';
import { logger } from '@veaiops/utils';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import styles from '../../../datasource-wizard.module.less';
import {
  DataSourceType,
  type WizardActions,
  type WizardState,
} from '../../../types';
import { RegionInput } from '../../shared/components/region-input';
import { ConnectList } from './connect-list';

const { Title, Text } = Typography;

/**
 * 将向导的 DataSourceType（小写）转换为 API 的 DataSourceType（首字母大写）
 *
 * @param wizardType - 向导中的 DataSourceType（小写：'zabbix', 'aliyun', 'volcengine'）
 * @returns API 的 DataSourceType（首字母大写：'Zabbix', 'Aliyun', 'Volcengine'）
 */
const convertWizardTypeToApiType = (
  wizardType: DataSource.type | null,
): ApiDataSourceType | undefined => {
  if (!wizardType) {
    return undefined;
  }

  switch (wizardType) {
    case DataSource.type.ZABBIX:
      return ApiDataSourceType.ZABBIX;
    case DataSource.type.ALIYUN:
      return ApiDataSourceType.ALIYUN;
    case DataSource.type.VOLCENGINE:
      return ApiDataSourceType.VOLCENGINE;
    default:
      return undefined;
  }
};

export interface ConnectSelectionStepProps {
  connects: Connect[];
  selectedConnect: Connect | null;
  actions: WizardActions;
  state: WizardState;
}

const ConnectSelectionStep: React.FC<ConnectSelectionStepProps> = ({
  connects,
  selectedConnect,
  actions,
  state,
}) => {
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 将向导的 DataSourceType 转换为 API 的 DataSourceType
  const apiDataSourceType = useMemo(
    () => convertWizardTypeToApiType(state.dataSourceType),
    [state.dataSourceType],
  );

  // 获取创建连接的方法（需要 API 的 DataSourceType）
  const { create } = useConnections(apiDataSourceType!);

  // 根据数据源类型判断是否需要显示 Region 输入
  const showRegionInput =
    state.dataSourceType === DataSource.type.ALIYUN ||
    state.dataSourceType === DataSource.type.VOLCENGINE;

  // 获取当前的 Region 值（避免嵌套三元表达式）
  let currentRegion = '';
  if (state.dataSourceType === DataSource.type.VOLCENGINE) {
    currentRegion = state.volcengine.region || '';
  } else if (state.dataSourceType === DataSource.type.ALIYUN) {
    currentRegion = state.aliyun.region || '';
  }

  // 获取 Region 修改处理器（避免嵌套三元表达式）
  let handleRegionChange: ((region: string) => void) | undefined;
  if (state.dataSourceType === DataSource.type.VOLCENGINE) {
    handleRegionChange = actions.setVolcengineRegion;
  } else if (state.dataSourceType === DataSource.type.ALIYUN) {
    handleRegionChange = actions.setAliyunRegion;
  }

  // 获取 provider 类型
  const regionProvider =
    state.dataSourceType === DataSource.type.VOLCENGINE
      ? 'volcengine'
      : 'aliyun';

  // 打开创建连接弹窗
  const handleOpenCreateModal = useCallback(() => {
    setCreateModalVisible(true);
  }, []);

  // 取消创建连接
  const handleCancelCreate = useCallback(() => {
    setCreateModalVisible(false);
  }, []);

  // 提交创建连接
  const handleCreateSubmit = useCallback(
    async (values: ConnectCreateRequest): Promise<boolean> => {
      try {
        const response = await create(values);

        if (response?._id) {
          Message.success(`连接 "${response.name}" 创建成功`);
          setCreateModalVisible(false);

          // 刷新连接列表（使用向导的 DataSourceType）
          await actions.fetchConnects(state.dataSourceType ?? undefined);

          // 自动选中新创建的连接
          actions.setSelectedConnect(response);

          return true;
        } else {
          Message.warning('创建可能未完全成功，请检查连接列表');
          setCreateModalVisible(false);
          return false;
        }
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));

        logger.error({
          message: '创建连接失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            dataSourceType: state.dataSourceType,
          },
          source: 'ConnectSelectionStep',
          component: 'handleCreateSubmit',
        });

        Message.error(errorObj.message || '创建连接失败，请重试');

        // 将错误转换为 Error 对象再抛出（符合规范）
        throw errorObj;
      }
    },
    [create, actions, state.dataSourceType],
  );

  return (
    <>
      <Card className={styles.configCard}>
        {/* Region 配置区域（仅阿里云和火山引擎需要） */}
        {showRegionInput && handleRegionChange && (
          <>
            <div className={styles.configHeader}>
              <Title heading={6} className={styles.configTitle}>
                <div className="flex items-center gap-2">
                  <IconLocation style={{ fontSize: 18, color: '#165DFF' }} />
                  <span>Region 配置</span>
                </div>
              </Title>
              <Text type="secondary" className={styles.configDescription}>
                {state.dataSourceType === DataSource.type.VOLCENGINE
                  ? '请输入火山引擎 Region ID，用于获取监控数据'
                  : '请输入阿里云 Region ID，用于获取监控数据'}
              </Text>
            </div>
            <div className={styles.configContent}>
              <RegionInput
                region={currentRegion || ''}
                onRegionChange={handleRegionChange}
                provider={regionProvider}
              />
            </div>
          </>
        )}

        <div
          className={styles.configHeader}
          style={{ marginTop: showRegionInput ? 24 : 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <Title heading={6} className={styles.configTitle}>
                连接配置
              </Title>
              <Text type="secondary" className={styles.configDescription}>
                选择已配置的数据源连接，或创建新的连接
              </Text>
            </div>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={handleOpenCreateModal}
            >
              创建新连接
            </Button>
          </div>
        </div>

        <div className={styles.configContent}>
          <ConnectList
            connects={connects}
            selectedConnect={selectedConnect}
            onConnectSelect={actions.setSelectedConnect}
          />
        </div>
      </Card>

      {/* 创建连接弹窗 */}
      {apiDataSourceType && (
        <CreateConnectionModal
          type={apiDataSourceType}
          visible={createModalVisible}
          onSubmit={handleCreateSubmit}
          onCancel={handleCancelCreate}
        />
      )}
    </>
  );
};

export default ConnectSelectionStep;
