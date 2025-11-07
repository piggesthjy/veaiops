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

import { Button, Drawer, Space } from '@arco-design/web-react';
import { useRuleDrawer } from '@oncall-config/hooks';
import type { RuleDrawerProps } from '@oncall-config/lib';
import { DetailView, EditForm } from '@oncall-config/ui';
import { DrawerFormContent } from '@veaiops/utils';

/**
 * 规则抽屉组件 - 详情查看和编辑
 *
 * 重构说明：
 * - 原分支 (feat/web-v2): rule-details-drawer.tsx 和 rule-edit-drawer.tsx 分别处理详情和编辑
 * - 当前分支: 重构为统一的 rule-drawer.tsx，支持详情查看和编辑两种模式
 * - 功能等价性: ✅ 已对齐原分支的所有功能
 *   - 告警等级字段 (level) ✅
 *   - 条件显示逻辑 (根据 inspect_category) ✅
 *   - 时间格式支持 (silence_delta) ✅
 *   - 正面/反面示例字段 (SEMANTIC模式) ✅
 *
 * 拆分说明：
 * - lib/types.ts: 类型定义
 * - hooks/use-rule-drawer.ts: 业务逻辑和状态管理
 * - ui/components/rule-detail-view.tsx: 详情查看组件
 * - ui/components/rule-edit-form.tsx: 编辑表单组件
 */
export const RuleDrawer = ({
  visible,
  isEdit,
  rule,
  form,
  onCancel,
  onSubmit,
  loading = false,
}: RuleDrawerProps) => {
  const {
    inspectCategory,
    currentSilenceDelta,
    setCurrentSilenceDelta,
    handleSubmit,
  } = useRuleDrawer({
    visible,
    isEdit,
    rule,
    form,
  });

  // 详情查看模式
  if (!isEdit && rule) {
    return (
      <Drawer
        title="内容识别规则详情"
        visible={visible}
        onCancel={onCancel}
        width={800}
        placement="right"
        maskClosable
        closable
        footer={null}
        focusLock={false}
      >
        <DetailView rule={rule} />
      </Drawer>
    );
  }

  // 编辑模式
  return (
    <Drawer
      title={isEdit ? '编辑规则' : '新增规则'}
      visible={visible}
      onCancel={onCancel}
      width={800}
      focusLock={false}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={() => {
              handleSubmit(onSubmit);
            }}
          >
            {isEdit ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <DrawerFormContent loading={Boolean(loading)}>
        <EditForm
          form={form}
          inspectCategory={inspectCategory}
          currentSilenceDelta={currentSilenceDelta}
          rule={rule}
          onSilenceDeltaChange={setCurrentSilenceDelta}
        />
      </DrawerFormContent>
    </Drawer>
  );
};

export type { RuleDrawerProps, RuleFormData } from '@oncall-config/lib';
