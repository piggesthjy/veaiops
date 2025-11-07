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
 * 数据源连接管理常量定义
 */

import { DataSourceType } from "api-generate";

// 数据源类型显示名称映射
export const DATA_SOURCE_DISPLAY_NAMES = {
  [DataSourceType.ZABBIX]: "Zabbix",
  [DataSourceType.ALIYUN]: "阿里云",
  [DataSourceType.VOLCENGINE]: "火山引擎",
} as const;

// 连接状态
export const CONNECTION_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

// 表格配置
export const TABLE_CONFIG = {
  PAGE_SIZE: 10,
  SCROLL_X: 1200, // 调整宽度，因为现在每种类型只显示自己的配置列
} as const;

// 表单验证规则
export const FORM_RULES = {
  NAME: {
    required: true,
    message: "请输入连接名称",
  },
  ZABBIX_API_URL: {
    required: true,
    message: "请输入Zabbix API地址",
  },
  ZABBIX_API_USER: {
    required: true,
    message: "请输入Zabbix API用户名",
  },
  ZABBIX_API_PASSWORD: {
    required: true,
    message: "请输入Zabbix API密码",
  },
  ALIYUN_ACCESS_KEY_ID: {
    required: true,
    message: "请输入阿里云Access Key ID",
  },
  ALIYUN_ACCESS_KEY_SECRET: {
    required: true,
    message: "请输入阿里云Access Key Secret",
  },
  VOLCENGINE_ACCESS_KEY_ID: {
    required: true,
    message: "请输入火山引擎Access Key ID",
  },
  VOLCENGINE_ACCESS_KEY_SECRET: {
    required: true,
    message: "请输入火山引擎Access Key Secret",
  },
} as const;

// 操作按钮文本
export const ACTION_TEXTS = {
  TEST: "测试连接",
  EDIT: "编辑连接",
  DELETE: "删除连接",
  CREATE_MONITOR: "新增监控",
  REFRESH: "刷新",
  CREATE: "新建连接",
} as const;

// 确认对话框文本
export const CONFIRM_TEXTS = {
  DELETE_TITLE: "确定要删除这个连接吗？",
  DELETE_CONTENT: "删除后无法恢复，请谨慎操作。",
} as const;

// 空状态文本
export const EMPTY_TEXTS = {
  NO_DATA: "暂无数据",
  NO_CONNECTION: "暂无连接",
  CLICK_REFRESH: "点击下方按钮刷新或新建连接",
} as const;

// 列宽配置
export const COLUMN_WIDTHS = {
  NAME: 150,
  STATUS: 100,
  API_URL: 300,
  API_USER: 150,
  ACCESS_KEY: 200,
  CREATED_AT: 150,
  ACTIONS: 200,
} as const;
