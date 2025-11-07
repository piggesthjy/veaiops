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
export type IntelligentThresholdConfig = {
  /**
   * 开始小时
   */
  start_hour: number;
  /**
   * 结束小时
   */
  end_hour: number;
  /**
   * 上界
   */
  upper_bound?: number | null;
  /**
   * 下界
   */
  lower_bound?: number | null;
  /**
   * 窗口大小
   */
  window_size: number;
};
