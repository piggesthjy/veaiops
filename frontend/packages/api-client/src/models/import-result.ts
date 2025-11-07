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
import type { ImportLog } from './import-log';
export type ImportResult = {
  /**
   * 总行数
   */
  total_rows: number;
  /**
   * 成功导入数量
   */
  successful_imports: number;
  /**
   * 失败导入数量
   */
  failed_imports: number;
  /**
   * 跳过行数
   */
  skipped_rows: number;
  /**
   * 错误信息列表
   */
  errors: Array<string>;
  /**
   * 导入日志列表
   */
  logs: Array<ImportLog>;
  /**
   * 开始时间
   */
  start_time: string;
  /**
   * 结束时间
   */
  end_time?: string | null;
};
