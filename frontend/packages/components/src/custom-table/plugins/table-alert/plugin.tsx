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

import { TableAlert } from '@/custom-table/components/table-alert';
import { PluginNames } from '@/custom-table/constants/enum';
import type {
  PluginContext,
  PluginFactory,
  TableAlertConfig,
} from '@/custom-table/types';
import type { TableAlertProps } from '@/custom-table/types/components/table-alert';
import { devLog } from '@/custom-table/utils/log-utils';
/**
 * 表格提示信息插件
 */
import type React from 'react';
import { DEFAULT_TABLE_ALERT_CONFIG } from './config';

type ExtendedPluginContext = PluginContext & {
  props: {
    isAlertShow?: boolean;
    customAlertNode?: React.ReactNode;
    alertType?: 'info' | 'warning' | 'error';
    alertContent?: React.ReactNode;
  };
  state: {
    isAlertShow?: boolean;
    alertType?: 'info' | 'warning' | 'error';
    alertContent?: React.ReactNode;
    customAlertNode?: React.ReactNode;
    [key: string]: unknown;
  };
};

export const TableAlertPlugin: PluginFactory<TableAlertConfig> = (
  config: TableAlertConfig = {},
) => {
  const finalConfig = { ...DEFAULT_TABLE_ALERT_CONFIG, ...config };

  return {
    name: PluginNames.TABLE_ALERT,
    version: '1.0.0',
    description: '表格提示信息插件',
    priority: finalConfig.priority || 'medium',
    enabled: finalConfig.enabled !== false,
    config: finalConfig,
    dependencies: [],
    conflicts: [],

    install(_context: PluginContext): void {
      // 安装时的操作
    },

    setup(context: PluginContext): void {
      // 初始化提示信息处理
      const extContext = context as ExtendedPluginContext;
      const { props } = extContext;
      const {
        isAlertShow = false,
        customAlertNode,
        alertType = 'info',
        alertContent,
      } = props;

      // 🐛 Table Alert Plugin设置调试日志
      devLog.log({
        component: 'TableAlertPlugin',
        message: 'Setup阶段调试',
        data: {
          // 1. 从props接收到的值
          receivedProps: {
            isAlertShow,
            customAlertNode,
            alertType,
            alertContent,
            hasAlertContent: Boolean(alertContent),
          },
          // 2. 完整的props对象
          fullProps: props,
          // 3. Alert相关的关键props
          alertRelatedProps: {
            isAlertShow: props.isAlertShow,
            alertType: props.alertType,
            alertContent: props.alertContent,
            customAlertNode: props.customAlertNode,
          },
        },
      });

      // 插件设置逻辑 - 不调用 Hook，只进行配置
      // Hook 调用已移到组件层面
      // 直接使用 props 中的值设置状态
      Object.assign(context.state, {
        isAlertShow,
        alertType,
        alertContent,
        customAlertNode,
      });

      // 🐛 状态设置后的调试日志
      devLog.log({
        component: 'TableAlertPlugin',
        message: '状态设置完成',
        data: {
          contextState: context.state,
          alertState: {
            isAlertShow: context.state.isAlertShow,
            alertType: context.state.alertType,
            alertContent: context.state.alertContent,
            customAlertNode: context.state.customAlertNode,
          },
        },
      });

      // 添加提示信息相关方法到上下文
      Object.assign(context.helpers, {
        showAlert: (
          content: React.ReactNode,
          type: 'info' | 'warning' | 'error' = 'info',
        ) => {
          // 基于 Arco Design 的 Message 组件实现警告显示
          Object.assign(context.state, {
            isAlertShow: true,
            alertContent: content,
            alertType: type,
          });
        },
        hideAlert: () => {
          Object.assign(context.state, {
            isAlertShow: false,
            alertContent: null,
          });
        },
      });
    },

    // 渲染器 - 🐛 使用TableAlert组件，修复props传递问题
    render: {
      alert: (...args: unknown[]): React.ReactNode => {
        const context = args[0] as PluginContext;
        const extContext = context as ExtendedPluginContext;
        const { state, props } = extContext;

        // 🐛 修复：从两个地方获取Alert数据，优先使用props
        const isAlertShow = props.isAlertShow ?? state.isAlertShow;
        const alertType = props.alertType ?? state.alertType;
        const alertContent = props.alertContent ?? state.alertContent;
        const customAlertNode = props.customAlertNode ?? state.customAlertNode;

        // 详细调试日志，检查数据来源
        devLog.log({
          component: 'TableAlertPlugin',
          message: 'Alert渲染详细调试',
          data: {
            // 1. 从props获取的数据
            propsData: {
              isAlertShow: props.isAlertShow,
              alertType: props.alertType,
              alertContent: props.alertContent,
              customAlertNode: props.customAlertNode,
            },
            // 2. 从state获取的数据
            stateData: {
              isAlertShow: state.isAlertShow,
              alertType: state.alertType,
              alertContent: state.alertContent,
              customAlertNode: state.customAlertNode,
            },
            // 3. 最终使用的数据
            finalData: {
              isAlertShow,
              alertType,
              alertContent: Boolean(alertContent),
              customAlertNode: Boolean(customAlertNode),
            },
            // 4. 渲染决策
            willRender: Boolean(isAlertShow) && Boolean(alertContent),
          },
        });

        // 优先渲染自定义节点
        if (customAlertNode) {
          devLog.log({
            component: 'TableAlertPlugin',
            message: '返回自定义Alert节点',
          });
          return customAlertNode;
        }

        // 如果没有要显示的内容，直接返回null
        if (!isAlertShow || !alertContent) {
          return null;
        }

        const alertProps: TableAlertProps = {
          show: isAlertShow,
          type: alertType || 'info',
          content: alertContent,
        };

        devLog.log({
          component: 'TableAlertPlugin',
          message: '🚨 创建TableAlert组件:',
          data: {
            alertProps,
          },
        });

        // ✅ 直接使用TableAlert组件，移除了ConfigProvider包装
        return <TableAlert {...alertProps} />;
      },
    },

    // 生命周期方法
    beforeMount(_context: PluginContext): void {
      // 组件挂载前的处理
    },

    afterMount(_context: PluginContext): void {
      // 组件挂载后的处理
    },

    beforeUpdate(_context: PluginContext): void {
      // 组件更新前的处理
    },

    afterUpdate(_context: PluginContext): void {
      // 组件更新后的处理
    },

    beforeUnmount(_context: PluginContext): void {
      // 组件卸载前的处理
    },

    uninstall(_context: PluginContext): void {
      // 卸载插件时的清理工作
    },
  } as ReturnType<PluginFactory<TableAlertConfig>>;
};
