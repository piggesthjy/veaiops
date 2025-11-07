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

import type { StrategyScheduleConfig } from '../../../event-center';

export interface ThresholdRule {
  id: string;
  name: string;
  description: string;
  template_id: string;
  template_name: string;
  metric_query: string;
  threshold_config: ThresholdConfig;
  notification_config: NotificationConfig;
  schedule_config: StrategyScheduleConfig;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface ThresholdConfig {
  warning_threshold: number;
  critical_threshold: number;
  comparison_operator: string;
  evaluation_window: number;
  evaluation_frequency: number;
  recovery_threshold?: number;
}

export interface NotificationConfig {
  channels: string[];
  recipients: string[];
  message_template: string;
  suppress_duration: number;
}

export interface Template {
  id: string;
  name: string;
}

export interface ComparisonOperator {
  label: string;
  value: string;
}

export interface ChannelOption {
  label: string;
  value: string;
}
