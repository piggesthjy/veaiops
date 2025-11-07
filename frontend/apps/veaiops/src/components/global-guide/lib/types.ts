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

export type StepStatus = 'pending' | 'active' | 'completed' | 'error';
export type PlatformType = 'volcengine' | 'zabbix' | 'aliyun';

export type FeatureActionType = 'direct' | 'navigation';

export interface FrontendFeature {
  id: string;
  name: string;
  description: string;
  selector: string; // CSS selector for the target element
  tooltipContent?: string; // Content for x-guide tooltip (可选，对于直接触发抽屉等操作可不需要)
  actionType?: FeatureActionType; // 'direct': 直接触发功能 | 'navigation': 需要跳转并高亮引导
  targetRoute?: string; // 当actionType为navigation时，需要跳转的目标路由（可选，默认使用step的route）
  placement?: 'top' | 'bottom' | 'left' | 'right'; // 提示框位置，默认'top'
  prerequisiteSteps?: string[]; // 前置步骤ID列表，需要先完成这些步骤才能执行当前功能
  allowDisabled?: boolean; // 是否允许在元素禁用时显示引导（默认false，某些功能如"批量操作"需要提示用户先选择项）
}

export interface GlobalGuideStep {
  number: number;
  title: string;
  description: string;
  route: string;
  icon: string; // 步骤对应的icon名称
  frontendFeatures: FrontendFeature[]; // 前端功能列表
  completionCriteria: string[];
  commonIssues: Array<{
    issue: string;
    solution: string;
    action: string;
  }>;
}

export interface UserProgress {
  connection?: {
    isHealthy: boolean;
    lastChecked?: string;
    issues?: string[];
  };
  datasource?: {
    isValid: boolean;
    type?: PlatformType;
    config?: Record<string, any>;
  };
  metricModel?: {
    isComplete: boolean;
    modelId?: string;
    dimensions?: Record<string, any>;
  };
  metric?: {
    isValid: boolean;
    previewData?: any[];
    quality?: {
      coverage: number;
      gapRate: number;
    };
  };
  task?: {
    isTrained: boolean;
    taskId?: string;
    version?: number;
    results?: any[];
  };
  injection?: {
    isSimulated: boolean;
    platforms?: PlatformType[];
    strategy?: Record<string, any>;
  };
}

export interface GuideConfig {
  steps: GlobalGuideStep[];
  theme: 'light' | 'dark';
  position: 'top' | 'bottom' | 'left' | 'right';
  autoAdvance: boolean;
  showProgress: boolean;
}
