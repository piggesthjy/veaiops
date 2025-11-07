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
 * 智能阈值清洗结果相关类型定义
 */

export interface ThresholdConfig {
  /** 开始小时 */
  start_hour: number;
  /** 结束小时 */
  end_hour: number;
  /** 上界阈值 */
  upper_bound: number;
  /** 下界阈值 */
  lower_bound: number;
  /** 窗口大小 */
  window_size: number;
}

export interface IntelligentThresholdResult {
  /** 唯一标识，作为主键 */
  id?: string;
  /** 指标名称 */
  name: string;
  /** 阈值配置列表 */
  thresholds: ThresholdConfig[];
  /** 标签信息 */
  labels: Record<string, string>;
  /** 唯一标识 */
  unique_key: string;
  /** 索引签名，满足 BaseRecord 约束 */
  [key: string]: any;
}

export interface CleaningResultDrawerProps {
  /** 抽屉是否可见 */
  visible: boolean;
  /** 任务记录 */
  taskRecord?: any;
  /** 版本记录 */
  versionRecord?: any;
  /** 关闭回调 */
  onClose: () => void;
}
