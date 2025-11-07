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

import type { FormInstance } from '@arco-design/web-react';
import type {
  InformStrategy,
  InformStrategyCreate,
  InformStrategyUpdate,
} from 'api-generate';

/**
 * 策略弹窗组件属性接口
 *
 * 类型分析（基于 Python 源码三方对照）：
 * - editingStrategy 接收 InformStrategy（API 响应格式）
 * - 表单内部通过 adaptStrategyForEdit 转换为包含 bot_id 和 chat_ids 的格式
 * - 提交时使用 InformStrategyCreate 或 InformStrategyUpdate（API 请求格式）
 */
export interface StrategyModalProps {
  visible: boolean;
  // ✅ 统一使用 InformStrategy（api-generate），符合单一数据源原则
  editingStrategy: InformStrategy | null;
  onCancel: () => void;
  onSubmit: (
    values: InformStrategyCreate | InformStrategyUpdate,
  ) => Promise<boolean>;
  form: FormInstance;
  /**
   * 抽屉宽度，默认为800px
   */
  width?: number;
}
