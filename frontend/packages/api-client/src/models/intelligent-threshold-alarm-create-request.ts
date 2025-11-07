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

/* generated using openapi-typescript-codegen -- do not edit */
export type IntelligentThresholdAlarmCreateRequest = {
  /**
   * 关联的任务ID
   */
  task_id: string;
  /**
   * 告警类型
   */
  alarm_type: IntelligentThresholdAlarmCreateRequest.alarm_type;
  /**
   * 告警级别
   */
  severity: IntelligentThresholdAlarmCreateRequest.severity;
  /**
   * 告警标题
   */
  title: string;
  /**
   * 告警消息
   */
  message: string;
  /**
   * 触发告警的指标值
   */
  metric_value?: number;
  /**
   * 阈值
   */
  threshold_value?: number;
};
export namespace IntelligentThresholdAlarmCreateRequest {
  /**
   * 告警类型
   */
  export enum alarm_type {
    THRESHOLD_BREACH = 'threshold_breach',
    ANOMALY_DETECTED = 'anomaly_detected',
    SYSTEM_ERROR = 'system_error',
  }
  /**
   * 告警级别
   */
  export enum severity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL',
  }
}
