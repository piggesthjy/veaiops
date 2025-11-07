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

import type {
  FilterPluginHooks,
  FilterPluginRenderProps,
  PluginConfig,
} from '@veaiops/types';
import { pluginExtensionManager } from './manager';

// 导出扩展管理器
export { pluginExtensionManager };

/**
 * 预定义的插件全局配置
 */
export const PLUGIN_GLOBAL_CONFIGS: Record<string, PluginConfig> = {
  // 输入类组件的通用配置
  Input: {
    allowClear: true,
    placeholder: '请输入...',
    size: 'default',
  },

  InputNumber: {
    allowClear: true,
    placeholder: '请输入数字...',
    precision: 0,
    size: 'default',
  },

  InputTag: {
    allowClear: true,
    placeholder: '请输入标签...',
    size: 'default',
  },

  // 选择类组件的通用配置
  Select: {
    allowClear: true,
    placeholder: '请选择',
    size: 'default',
    filterOption: true,
  },

  Cascader: {
    allowClear: true,
    placeholder: '请选择',
    size: 'default',
    expandTrigger: 'click',
  },

  TreeSelect: {
    allowClear: true,
    placeholder: '请选择',
    size: 'default',
    treeDefaultExpandAll: false,
  },

  // 日期组件的通用配置
  DatePicker: {
    allowClear: true,
    placeholder: '请选择日期...',
    size: 'default',
  },

  RangePicker: {
    allowClear: true,
    placeholder: ['开始日期', '结束日期'],
    size: 'default',
  },

  // 特殊组件配置
  XByteTreeSelector: {
    allowClear: true,
    placeholder: '请选择服务...',
    size: 'default',
  },
};

/**
 * 预定义的插件钩子
 */
export const PLUGIN_HOOKS: Record<string, FilterPluginHooks> = {
  // 通用日志钩子
  _global: {
    beforeRender: (props: any) => {
      return props;
    },
    afterRender: (element: any, props: any) => {
      return element;
    },
    validateConfig: (config: any) => {
      if (!config || typeof config !== 'object') {
        return '配置必须是一个对象';
      }
      return true;
    },
  },

  // Input 组件特定钩子
  Input: {
    beforeRender: (props: FilterPluginRenderProps) => {
      // 为 Input 组件添加额外的样式类
      return {
        ...props,
        hijackedProps: {
          ...props.hijackedProps,
          className: `${
            typeof props.hijackedProps.className === 'string'
              ? props.hijackedProps.className
              : ''
          } filter-input-enhanced`.trim(),
        },
      };
    },
  },

  // Select 组件特定钩子
  Select: {
    beforeRender: (props: FilterPluginRenderProps) => {
      // 为 Select 组件添加搜索功能的增强
      return {
        ...props,
        hijackedProps: {
          ...props.hijackedProps,
          showSearch: props.hijackedProps.showSearch !== false, // 默认开启搜索
          filterOption: (input: string, option: unknown) => {
            const optionLabel = (option as { label?: string })?.label || '';
            return optionLabel.toLowerCase().includes(input.toLowerCase());
          },
        },
      };
    },
  },

  // 日期组件钩子
  DatePicker: {
    beforeRender: (props: FilterPluginRenderProps) => {
      // 添加日期格式化，如果有showTime则使用带时间的格式
      const hasShowTime = props.hijackedProps?.showTime;
      const defaultFormat = hasShowTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';

      return {
        ...props,
        hijackedProps: {
          ...props.hijackedProps,
          format: props.hijackedProps.format || defaultFormat,
        },
      };
    },
  },

  RangePicker: {
    beforeRender: (props: FilterPluginRenderProps) => {
      // 添加日期范围格式化，如果有showTime则使用带时间的格式
      const hasShowTime = props.hijackedProps?.showTime;
      const defaultFormat = hasShowTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';

      return {
        ...props,
        hijackedProps: {
          ...props.hijackedProps,
          format: props.hijackedProps.format || defaultFormat,
        },
      };
    },
  },
};

/**
 * 初始化插件扩展配置
 */
export const initializePluginExtensions = (): void => {
  // 设置全局配置
  Object.entries(PLUGIN_GLOBAL_CONFIGS).forEach(([pluginType, config]) => {
    pluginExtensionManager.setGlobalConfig({ pluginType, config });
  });

  // 注册钩子
  Object.entries(PLUGIN_HOOKS).forEach(([pluginType, hooks]) => {
    pluginExtensionManager.registerHooks({ pluginType, hooks });
  });
};

/**
 * 获取插件配置的辅助函数
 */
export const getPluginConfig = (
  pluginType: string,
  instanceConfig: PluginConfig = {},
): PluginConfig => {
  return pluginExtensionManager.mergeConfig(pluginType, instanceConfig);
};

/**
 * 添加自定义插件配置
 */
export const addCustomPluginConfig = (
  pluginType: string,
  config: PluginConfig,
): void => {
  pluginExtensionManager.setGlobalConfig({
    pluginType,
    config: {
      ...pluginExtensionManager.getGlobalConfig(pluginType),
      ...config,
    },
  });
};

/**
 * 添加自定义插件钩子
 */
export const addCustomPluginHooks = (
  pluginType: string,
  hooks: FilterPluginHooks,
): void => {
  const existingHooks = pluginExtensionManager.getHooks(pluginType) || {};
  pluginExtensionManager.registerHooks({
    pluginType,
    hooks: {
      ...existingHooks,
      ...hooks,
    },
  });
};
