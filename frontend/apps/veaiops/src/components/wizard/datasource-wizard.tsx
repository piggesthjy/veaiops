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
 * 数据源创建向导组件 - 重构版本
 * @description 支持 Zabbix、阿里云、火山引擎三种数据源的创建流程，使用模块化组件结构
 * @author AI Assistant
 * @date 2025-01-15
 */

import { Button, Drawer, Space, Typography } from '@arco-design/web-react';
import { IconClose, IconLeft, IconRight } from '@arco-design/web-react/icon';
import { logger } from '@veaiops/utils';

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  StepContent,
  StepIndicator,
  TypeSelection,
  useWizardController,
} from './components';
import styles from './datasource-wizard.module.less';
import { useDataSourceWizard } from './hooks/state/use-datasource-wizard';
import type { DataSourceType } from './types';
import { WizardStep } from './types';
import { prefillDataSourceConfig } from './utils/data/prefill';
import { getStepProgressText } from './utils/wizard-logic';

const { Text } = Typography;

export interface DataSourceWizardProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (dataSource: unknown) => void;
  editingDataSource?: any; // 正在编辑的数据源（用于编辑模式）
}

export const DataSourceWizard: React.FC<DataSourceWizardProps> = ({
  visible,
  onClose,
  onSuccess: _onSuccess,
  editingDataSource,
}) => {
  // 🔥 只记录关键字段，避免循环引用
  logger.info({
    message: '🎨 DataSourceWizard component rendering',
    data: {
      visible,
      editingDataSourceId: editingDataSource?._id || editingDataSource?.id,
      editingDataSourceName: editingDataSource?.name,
      editingDataSourceType: editingDataSource?.type,
    },
    source: 'DataSourceWizard',
    component: 'render',
  });

  const [selectedType, setSelectedType] = useState<DataSourceType | null>(null);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [hasInitializedEditMode, setHasInitializedEditMode] = useState(false);
  const { state, actions } = useDataSourceWizard();

  // 🔥 监控组件挂载和卸载
  useEffect(() => {
    logger.info({
      message: '✨ DataSourceWizard mounted',
      data: {},
      source: 'DataSourceWizard',
      component: 'mount',
    });
    return () => {
      logger.info({
        message: '💥 DataSourceWizard unmounting',
        data: {},
        source: 'DataSourceWizard',
        component: 'unmount',
      });
    };
  }, []);

  // 🔥 监控 visible 属性变化
  useEffect(() => {
    logger.info({
      message: '📊 visible prop changed',
      data: {
        visible,
        timestamp: new Date().toISOString(),
      },
      source: 'DataSourceWizard',
      component: 'visible-effect',
    });

    if (visible) {
      logger.info({
        message: '🔓 Drawer is opening',
        data: {},
        source: 'DataSourceWizard',
        component: 'visible-effect',
      });
    } else {
      logger.info({
        message: '🔒 Drawer is closing',
        data: {},
        source: 'DataSourceWizard',
        component: 'visible-effect',
      });
    }
  }, [visible]);

  // 🔥 监控 selectedType 变化
  useEffect(() => {
    logger.info({
      message: '📑 selectedType changed',
      data: { selectedType },
      source: 'DataSourceWizard',
      component: 'selectedType-effect',
    });
  }, [selectedType]);

  // 🔥 监控 state.currentStep 变化
  useEffect(() => {
    logger.info({
      message: '📍 currentStep changed',
      data: { currentStep: state.currentStep },
      source: 'DataSourceWizard',
      component: 'currentStep-effect',
    });
  }, [state.currentStep]);

  // 使用向导控制器
  const {
    handleTypeSelect,
    handleNext,
    handlePrev,
    canProceedToNext,
    getNextButtonText,
    getPrevButtonText,
    shouldShowPrevButton,
    CreationConfirmModalComponent,
  } = useWizardController({
    selectedType,
    setSelectedType,
    state,
    actions,
    onClose,
    onSuccess: _onSuccess,
    editingDataSource,
  });

  // 处理编辑模式初始化
  useEffect(() => {
    if (visible && editingDataSource && !hasInitializedEditMode) {
      // 编辑模式：自动设置数据源类型并进入第一步
      // 将类型转换为小写以匹配 DataSourceType 枚举值
      const dataSourceType =
        editingDataSource.type?.toLowerCase() as DataSourceType;

      setSelectedType(dataSourceType);
      actions.setDataSourceType(dataSourceType);

      // 编辑模式下直接跳到第一步，让用户可以看到和修改配置
      actions.setCurrentStep(WizardStep.FIRST_STEP);

      // 重置预填充标记
      setHasPrefilled(false);

      // 标记已初始化编辑模式
      setHasInitializedEditMode(true);

      actions.setEditingDataSourceId(
        editingDataSource._id || editingDataSource.id,
      );

      // 预填充数据源名称
      if (editingDataSource.name) {
        actions.setDataSourceName(editingDataSource.name);
      }

      // 预填充数据源描述
      if (editingDataSource.description) {
        actions.setDataSourceDescription(editingDataSource.description);
      }

      // 编辑模式下也需要加载连接列表

      actions.fetchConnects(dataSourceType).catch((_error) => {
        // 忽略连接获取错误
      });
    } else if (
      visible &&
      !editingDataSource &&
      state.currentStep === WizardStep.TYPE_SELECTION &&
      !selectedType
    ) {
      // 只有在向导完全关闭后重新打开时才重置状态
      // 避免在用户操作过程中意外重置

      actions.resetWizard();
      setSelectedType(null);
      setHasPrefilled(false);
      setHasInitializedEditMode(false);
    }
  }, [
    visible,
    editingDataSource,
    state.currentStep,
    selectedType,
    hasInitializedEditMode,
  ]); // 依赖检查条件中使用的变量

  // 预填充配置数据（在连接列表加载后）
  useEffect(() => {
    if (
      visible &&
      editingDataSource &&
      state.connects.length > 0 &&
      state.currentStep === WizardStep.FIRST_STEP &&
      !hasPrefilled
    ) {
      prefillDataSourceConfig(editingDataSource, actions, state);
      setHasPrefilled(true);
    }
  }, [
    visible,
    editingDataSource,
    state.connects.length,
    state.currentStep,
    hasPrefilled,
  ]);

  // 防止意外的键盘事件触发按钮点击
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果用户在类型选择阶段按 Enter 键，不要自动进入下一步
      if (
        event.key === 'Enter' &&
        state.currentStep === WizardStep.TYPE_SELECTION &&
        selectedType &&
        visible
      ) {
        event.preventDefault();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedType, state.currentStep, visible]);

  // Drawer 组件的回调函数，用于处理键盘事件

  const handleDrawerKeyDown = (event: React.KeyboardEvent) => {
    // 检查事件是否由 Drawer 组件自身触发，并处理 Enter 键
    if (
      event.key === 'Enter' &&
      state.currentStep === WizardStep.TYPE_SELECTION &&
      selectedType &&
      visible
    ) {
      event.preventDefault();
    }
  };

  // 处理关闭事件
  const handleClose = useCallback(() => {
    logger.info({
      message: '🚪 handleClose called - Drawer onCancel triggered',
      data: {
        currentState: {
          selectedType,
          currentStep: state.currentStep,
          dataSourceType: state.dataSourceType,
        },
      },
      source: 'DataSourceWizard',
      component: 'handleClose',
    });
    onClose();
    logger.info({
      message: '✅ onClose() executed',
      data: {},
      source: 'DataSourceWizard',
      component: 'handleClose',
    });
  }, [onClose, state.currentStep, selectedType, state.dataSourceType]);

  // 处理抽屉完全关闭后的清理工作（Arco Design Drawer 的 afterClose 回调）
  const handleAfterClose = useCallback(() => {
    logger.info({
      message: '🧹 handleAfterClose called - Drawer afterClose triggered',
      data: {},
      source: 'DataSourceWizard',
      component: 'handleAfterClose',
    });

    // 重置所有本地状态
    setSelectedType(null);
    setHasPrefilled(false);
    setHasInitializedEditMode(false);

    // 重置向导状态（包括所有步骤数据、选择项等）
    actions.resetWizard();
    logger.info({
      message: '✅ Wizard state reset completed',
      data: {},
      source: 'DataSourceWizard',
      component: 'handleAfterClose',
    });
  }, [actions]);

  const footerContent = (
    <div className={styles.wizardFooter}>
      <div className={styles.footerLeft}>
        <Space>
          {shouldShowPrevButton() && (
            <Button onClick={handlePrev} icon={<IconLeft />}>
              {getPrevButtonText()}
            </Button>
          )}
        </Space>
      </div>

      <div className={styles.footerRight}>
        <Space>
          {selectedType && state.currentStep >= 0 && (
            <Text type="secondary" className={styles.stepIndicator}>
              {getStepProgressText(selectedType, state.currentStep)}
            </Text>
          )}
          <Button
            type="primary"
            disabled={!canProceedToNext()}
            onClick={handleNext}
            title={!selectedType ? '请先选择数据源类型' : ''}
            className={styles.wizardButton}
          >
            {getNextButtonText()}
            <IconRight style={{ marginLeft: 4 }} />
          </Button>
        </Space>
      </div>
    </div>
  );

  return (
    <>
      <Drawer
        width={1200}
        title={editingDataSource ? '编辑监控数据源' : '新增监控数据源'}
        visible={visible}
        onCancel={handleClose}
        afterClose={handleAfterClose}
        footer={footerContent}
        closable
        maskClosable={false}
        escToExit
        className={styles.dataSourceWizard}
        closeIcon={<IconClose />}
        unmountOnExit
        focusLock={false}
      >
        <div className={styles.wizardContainer}>
          {/* 步骤指示器 */}
          {selectedType && state.currentStep >= WizardStep.FIRST_STEP && (
            <StepIndicator
              selectedType={selectedType}
              currentStep={state.currentStep}
            />
          )}

          {/* 步骤内容 */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {selectedType && state.currentStep >= WizardStep.FIRST_STEP ? (
              <StepContent
                selectedType={selectedType}
                currentStep={state.currentStep}
                state={state}
                actions={actions}
              />
            ) : (
              <TypeSelection
                selectedType={selectedType}
                onTypeSelect={handleTypeSelect}
              />
            )}
          </div>
        </div>
      </Drawer>

      {/* 创建确认弹窗 */}
      {CreationConfirmModalComponent}
    </>
  );
};

export default DataSourceWizard;
