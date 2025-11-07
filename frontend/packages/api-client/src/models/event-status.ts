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
/**
 * Event status codes: 0=INITIAL, 1=SUBSCRIBED, 2=CARD_BUILT, 3=DISPATCHED, 4=NONE_DISPATCH, 11=CHATOPS_NOT_MATCHED, 12=CHATOPS_RULE_FILTERED, 13=CHATOPS_RULE_RESTRAINED
 */
export enum EventStatus {
  /**
   * 初始化
   */
  INITIAL = 0,
  /**
   * 已订阅
   */
  SUBSCRIBED = 1,
  /**
   * 已构建卡片
   */
  CARD_BUILT = 2,
  /**
   * 已分发
   */
  DISTRIBUTED = 3,
  /**
   * 无分发
   */
  NO_DISTRIBUTION = 4,
  /**
   * ChatOps未匹配
   */
  CHATOPS_NO_MATCH = 11,
  /**
   * ChatOps规则过滤
   */
  CHATOPS_RULE_FILTERED = 12,
  /**
   * ChatOps规则限制
   */
  CHATOPS_RULE_LIMITED = 13,
}
