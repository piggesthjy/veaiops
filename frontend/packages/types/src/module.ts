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
 * 模块类型枚举
 * 用于区分不同模块的订阅关系管理
 */
export enum ModuleType {
  /** 事件中心 */
  EVENT_CENTER = 'event-center',
  /** 时序异常检测 */
  TIMESERIES = 'timeseries',
  /** 智能阈值 */
  INTELLIGENT_THRESHOLD = 'intelligent-threshold',
  /** Oncall异动 */
  ONCALL = 'oncall',
}

/**
 * 模块类型配置
 */
export interface ModuleConfig {
  /** 模块类型 */
  type: ModuleType;
  /** 显示名称 */
  displayName: string;
  /** 页面标题 */
  pageTitle: string;
  /** 描述 */
  description: string;
  /** 路由路径匹配模式 */
  pathPattern: string;
}

/**
 * 模块配置映射
 */
export const MODULE_CONFIGS: Record<ModuleType, ModuleConfig> = {
  [ModuleType.EVENT_CENTER]: {
    type: ModuleType.EVENT_CENTER,
    displayName: '事件中心',
    pageTitle: '订阅关系管理',
    description: '管理事件中心的订阅关系',
    pathPattern: '/event-center/',
  },
  [ModuleType.TIMESERIES]: {
    type: ModuleType.TIMESERIES,
    displayName: '时序异常',
    pageTitle: '订阅规则管理',
    description: '管理时序异常检测的订阅规则',
    pathPattern: '/timeseries/',
  },
  [ModuleType.INTELLIGENT_THRESHOLD]: {
    type: ModuleType.INTELLIGENT_THRESHOLD,
    displayName: '智能阈值',
    pageTitle: '阈值订阅管理',
    description: '管理智能阈值的订阅关系',
    pathPattern: '/threshold/',
  },
  [ModuleType.ONCALL]: {
    type: ModuleType.ONCALL,
    displayName: 'Oncall异动',
    pageTitle: 'Oncall订阅管理',
    description: '管理Oncall异动的订阅关系',
    pathPattern: '/oncall/',
  },
};

/**
 * 根据路径检测模块类型
 * @param pathname 当前路径
 * @returns 检测到的模块类型
 */
export function detectModuleTypeFromPath(pathname: string): ModuleType {
  for (const config of Object.values(MODULE_CONFIGS)) {
    if (pathname.includes(config.pathPattern)) {
      return config.type;
    }
  }
  return ModuleType.EVENT_CENTER;
}

/**
 * 获取模块配置
 * @param moduleType 模块类型
 * @returns 模块配置
 */
export function getModuleConfig(moduleType: ModuleType): ModuleConfig {
  return MODULE_CONFIGS[moduleType];
}

/**
 * 获取所有模块类型
 * @returns 模块类型数组
 */
export function getAllModuleTypes(): ModuleType[] {
  return Object.values(ModuleType);
}
