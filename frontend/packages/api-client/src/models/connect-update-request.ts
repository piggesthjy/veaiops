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
export type ConnectUpdateRequest = {
  /**
   * 连接名称
   */
  name?: string;
  /**
   * 是否激活
   */
  is_active?: boolean;
  /**
   * Zabbix API URL
   */
  zabbix_api_url?: string;
  /**
   * Zabbix API 用户名
   */
  zabbix_api_user?: string;
  /**
   * Zabbix API 密码
   */
  zabbix_api_password?: string;
  /**
   * 阿里云 Access Key ID
   */
  aliyun_access_key_id?: string;
  /**
   * 阿里云 Access Key Secret
   */
  aliyun_access_key_secret?: string;
  /**
   * 火山引擎 Access Key ID
   */
  volcengine_access_key_id?: string;
  /**
   * 火山引擎 Access Key Secret
   */
  volcengine_access_key_secret?: string;
};
