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
import type { MetricThresholdResult } from './metric-threshold-result';
export type UpdateTaskResultRequest = {
  /**
   * 任务ID
   */
  task_id: string;
  /**
   * 任务版本
   */
  task_version: number;
  /**
   * 任务状态
   */
  status: UpdateTaskResultRequest.status;
  /**
   * 算法结果
   */
  results?: Array<MetricThresholdResult>;
};
export namespace UpdateTaskResultRequest {
  /**
   * 任务状态
   */
  export enum status {
    UNKNOWN = 'Unknown',
    LAUNCHING = 'Launching',
    RUNNING = 'Running',
    STOPPED = 'Stopped',
    SUCCESS = 'Success',
    FAILED = 'Failed',
  }
}
