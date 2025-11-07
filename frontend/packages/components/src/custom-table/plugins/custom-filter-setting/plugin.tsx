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

import { PluginNames } from '@/custom-table/constants/enum';
import type { PluginContext, PluginFactory } from '@/custom-table/types';
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import { devLog } from '@/custom-table/utils/log-utils';
import { Button } from '@arco-design/web-react';
import { IconSettings } from '@arco-design/web-react/icon';
/**
 * Custom Filter Setting 插件
 */
import React from 'react';
import { DraggableFilterSetting } from './components';
import { DEFAULT_FILTER_SETTING_CONFIG } from './config';
import type { CustomFilterSettingConfig } from './types';

export const CustomFilterSettingPlugin: PluginFactory<
  CustomFilterSettingConfig
> = (config: CustomFilterSettingConfig = {}) => {
  const finalConfig = { ...DEFAULT_FILTER_SETTING_CONFIG, ...config };

  return {
    name: PluginNames.CUSTOM_FILTER_SETTING,
    version: '1.0.0',
    description: '自定义过滤器设置插件 - 支持拖拽排序和配置保存',
    priority: finalConfig.priority || PluginPriorityEnum.MEDIUM,
    enabled: finalConfig.enabled !== false,
    dependencies: [],
    conflicts: [],

    install(_context: PluginContext) {
      devLog.log({
        component: 'CustomFilterSetting Plugin',
        message: 'Installing plugin',
      });
    },

    setup(context: PluginContext) {
      const {
        props: { baseColumns },
      } = context;

      // 设置插件状态
      Object.assign(context.state, {
        enableFilterSetting: finalConfig.enableFilterSetting,
        filterSettingProps: finalConfig.filterSettingProps,
      });

      devLog.log({
        component: 'CustomFilterSetting Plugin',
        message: 'Plugin setup completed',
        data: {
          enableFilterSetting: context.state.enableFilterSetting,
        },
      });
    },

    update(_context: PluginContext) {
      // 当配置或数据更新时的操作
    },

    uninstall(_context: PluginContext) {
      devLog.log({
        component: 'CustomFilterSetting Plugin',
        message: 'Uninstalling plugin',
      });
    },

    // 渲染方法
    render: {
      // 渲染过滤器设置组件
      filterSetting(context: PluginContext) {
        const {
          state: { enableFilterSetting, filterSettingProps },
        } = context;

        if (!enableFilterSetting) {
          return null;
        }

        const props = {
          title: '搜索项设置',
          mode: ['select'] as Array<'select' | 'fixed'>,
          caseSelectText: (key: string) => key,
          saveFun: (settings: {
            fixed_fields: string[];
            selected_fields: string[];
            hidden_fields: string[];
          }) => {
            // 保存过滤器设置
          },
          ...filterSettingProps,
        };

        // 如果有自定义渲染函数，使用自定义渲染
        if (finalConfig.customRender) {
          return finalConfig.customRender(props);
        }

        // 否则使用默认的拖拽组件
        return (
          <DraggableFilterSetting key="custom-filter-setting" {...props}>
            <Button type="text" size="mini">
              <IconSettings />
              过滤器设置
            </Button>
          </DraggableFilterSetting>
        );
      },
    },

    // 插件钩子
    hooks: {
      onFilterSettingChange: (...args: unknown[]) => {
        const [settings] = args as [
          {
            fixed_fields: string[];
            selected_fields: string[];
            hidden_fields: string[];
          },
        ];
        devLog.log({
          component: 'CustomFilterSetting Plugin',
          message: 'Filter settings changed',
          data: {
            settings,
          },
        });
      },
    },
  };
};
