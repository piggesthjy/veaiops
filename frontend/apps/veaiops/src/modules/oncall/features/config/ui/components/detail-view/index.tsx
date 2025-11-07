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

import { Interest } from 'api-generate';
import type React from 'react';

import { BasicInfo, Examples, RegexDisplay } from './components';
import { useCopy } from './hooks';
import type { DetailViewProps } from './types';

/**
 * 详情查看组件
 *
 * 重构说明：
 * - 原分支 (feat/web-v2): 使用 rule-details-drawer.tsx，包含 RuleBasicInfo、RuleExamples、RuleRegexDisplay
 * - 当前分支: 重构为统一的 detail-view 目录结构，集成所有详情展示功能
 * - 功能等价性: ✅ 已对齐原分支的所有功能
 *   - 基本信息展示（UUID、版本号、创建时间、更新时间）✅
 *   - 正面/负面示例的 Collapse 展开折叠 ✅
 *   - 正则表达式的 Card 展示 ✅
 *   - 复制功能 ✅（统一使用 safeCopyToClipboard）
 */
export const DetailView: React.FC<DetailViewProps> = ({ rule }) => {
  // 使用统一的复制功能 Hook
  const copyHook = useCopy();

  // 处理 null 值，确保为数组
  const positiveExamples = rule.examples_positive ?? [];
  const negativeExamples = rule.examples_negative ?? [];

  return (
    <div className="rule-detail-view py-2">
      {/* 基本信息 */}
      <BasicInfo rule={rule} copyHook={copyHook} />

      {/* 正则表达式 */}
      {rule.inspect_category === Interest.inspect_category.RE &&
        rule.regular_expression && (
          <RegexDisplay
            regularExpression={rule.regular_expression}
            copyHook={copyHook}
          />
        )}

      {/* 示例展示 */}
      <Examples
        positiveExamples={positiveExamples}
        negativeExamples={negativeExamples}
        copyHook={copyHook}
      />
    </div>
  );
};

export type { DetailViewProps } from './types';
