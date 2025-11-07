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
export type VolcengineDataSourceConfig = {
  /**
   * 数据源名称
   */
  name?: string;
  /**
   * 连接名称
   */
  connect_name: string;
  /**
   * 火山引擎地域
   */
  region?: string;
  /**
   * 命名空间
   */
  namespace?: string;
  /**
   * 子命名空间
   */
  sub_namespace?: string;
  /**
   * 指标名称
   */
  metric_name?: string;
  /**
   * 实例列表
   */
  instances?: Array<Record<string, string>>;
  /**
   * 分组维度
   */
  group_by?: Array<string>;
};
