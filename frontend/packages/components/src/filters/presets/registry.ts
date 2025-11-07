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

import * as businessPresets from './business';
/**
 * 预设注册器
 */
import type { PresetGenerator, PresetRegistry } from './types';

/**
 * 预设注册器类
 */
class FilterPresetRegistry {
  private presets: PresetRegistry = {};

  /**
   * 注册预设
   */
  register({
    name,
    generator,
  }: {
    name: string;
    generator: PresetGenerator;
  }): void {
    this.presets[name] = generator;
  }

  /**
   * 批量注册预设
   */
  registerBatch(presets: Record<string, PresetGenerator>): void {
    Object.entries(presets).forEach(([name, generator]) => {
      this.register({ name, generator });
    });
  }

  /**
   * 获取预设
   */
  get(name: string): PresetGenerator | undefined {
    return this.presets[name];
  }

  /**
   * 检查预设是否存在
   */
  has(name: string): boolean {
    return name in this.presets;
  }

  /**
   * 获取所有预设名称
   */
  getNames(): string[] {
    return Object.keys(this.presets);
  }

  /**
   * 获取预设统计信息
   */
  getStats(): {
    total: number;
    names: string[];
  } {
    return {
      total: Object.keys(this.presets).length,
      names: this.getNames(),
    };
  }

  /**
   * 清空所有预设
   */
  clear(): void {
    this.presets = {};
  }
}

// 创建单例实例
export const filterPresetRegistry = new FilterPresetRegistry();

// 注册默认的业务预设
filterPresetRegistry.registerBatch({
  // 账户相关
  'account-select': businessPresets.accountSelectPreset,
  'customer-select': businessPresets.accountSelectPreset, // 别名

  // 产品相关
  'product-select': businessPresets.productSelectPreset,

  // 事件相关
  'event-type-select': businessPresets.eventTypeSelectPreset,
  'event-id-input': businessPresets.eventIdInputPreset,
  'subscription-name-input': businessPresets.subscriptionNameInputPreset,

  // 业务场景
  'business-scene-cascader': businessPresets.businessSceneCascaderPreset,

  // 数据源
  'datasource-type-select': businessPresets.datasourceTypeSelectPreset,

  // 任务相关
  'task-status-select': businessPresets.taskStatusSelectPreset,
  'task-id-select': businessPresets.taskIdSelectPreset,
});

// 导出类供自定义使用
export { FilterPresetRegistry };
