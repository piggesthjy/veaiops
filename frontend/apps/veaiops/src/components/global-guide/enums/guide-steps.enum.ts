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
 * Global guide step enumeration
 */
export enum GlobalGuideStepNumber {
  /** Step 1: Connection Management */
  CONNECTION = 1,
  /** Step 2: Data Source */
  DATASOURCE = 2,
  /** Step 3: Metric Template */
  TEMPLATE = 3,
  /** Step 4: Metric Configuration */
  METRIC_CONFIG = 4,
  /** Step 5: Intelligent Threshold Task */
  TASK = 5,
  /** Step 6: Inject Alert Rule */
  INJECTION = 6,
  /** Step 7: Chat Bot Management */
  BOT_MANAGEMENT = 7,
  /** Step 8: Card Template Management */
  CARD_TEMPLATE = 8,
  /** Step 9: Account Management */
  ACCOUNT = 9,
  /** Step 10: Project Management */
  PROJECT = 10,
  /** Step 11: Content Recognition Rule */
  ONCALL_CONFIG = 11,
  /** Step 12: Content Recognition Rule */
  ONCALL_RULES = 12,
  /** Step 13: Oncall Change History */
  ONCALL_HISTORY = 13,
  /** Step 14: Oncall Change Statistics */
  ONCALL_STATS = 14,
}

/**
 * Global guide step path enumeration
 */
export enum GlobalGuideStepPath {
  /** Connection management path - 🔥 Remove URL parameters, only navigate to page */
  CONNECTION = '/system/datasource',
  /** Data source path */
  DATASOURCE = '/system/datasource#config',
  /** Metric template path */
  TEMPLATE = '/threshold/template',
  /** Intelligent threshold task path */
  METRIC_CONFIG = '/threshold/config',
  /** Chat bot management path */
  BOT_MANAGEMENT = '/system/bot-management',
  /** Card template management path */
  CARD_TEMPLATE = '/system/card-template',
  /** Account management path */
  ACCOUNT = '/system/account',
  /** Project management path */
  PROJECT = '/system/project',
  /** Content recognition rule path */
  ONCALL_CONFIG = '/oncall/config',
  /** Content recognition rule path */
  ONCALL_RULES = '/oncall/rules',
  /** Oncall change history path */
  ONCALL_HISTORY = '/oncall/history',
  /** Oncall change statistics path */
  ONCALL_STATS = '/oncall/stats',
}

/**
 * Global guide step parameters enumeration
 * 🔥 Deprecated: No longer use URL parameters to automatically open drawer, changed to only highlight button
 */
export enum GlobalGuideStepParams {
  /** Connection management parameter (deprecated) */
  CONNECTION_DRAWER = 'connectDrawerShow=true',
  /** Data source parameter (deprecated) */
  DATASOURCE_WIZARD = 'dataSourceWizardShow=true',
}
