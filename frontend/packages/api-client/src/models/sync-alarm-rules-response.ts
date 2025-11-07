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
export type SyncAlarmRulesResponse = {
  /**
   * 处理的规则总数
   */
  total: number;
  /**
   * 创建的规则数量
   */
  created: number;
  /**
   * 更新的规则数量
   */
  updated: number;
  /**
   * 删除的规则数量
   */
  deleted: number;
  /**
   * 失败的规则数量
   */
  failed: number;
  /**
   * 创建的规则ID列表
   */
  created_rule_ids?: Array<string>;
  /**
   * 更新的规则ID列表
   */
  updated_rule_ids?: Array<string>;
  /**
   * 删除的规则ID列表
   */
  deleted_rule_ids?: Array<string>;
  /**
   * 规则操作列表
   */
  rule_operations?: Array<Record<string, any>>;
};
