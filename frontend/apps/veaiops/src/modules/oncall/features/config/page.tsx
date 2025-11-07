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

import { useBotList } from '@/modules/system/features/bot/hooks';
import { Form, Message } from '@arco-design/web-react';
import {
  RuleDrawer,
  RulesTable,
  type RulesTableRef,
} from '@oncall-config/components';
import type { RuleFormData, RuleSubmitData } from '@oncall-config/lib';
import { oncallRuleService } from '@oncall/api';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { useManagementRefresh } from '@veaiops/hooks';
import { logger } from '@veaiops/utils';
import { Interest } from 'api-generate';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';

/**
 * Oncall 配置页面
 * 对应路由: /oncall/config
 * 功能: Oncall 规则配置管理（包含表格、抽屉等所有 UI）
 *
 * 重构说明：
 * - 原分支 (feat/web-v2): 使用 useOncallRules hook 和独立的表格组件
 * - 当前分支: 使用 CustomTable 标准化架构
 * - 功能等价性: ✅ 已实现所有原分支功能
 *   - 规则列表获取 ✅
 *   - 规则状态切换 ✅
 *   - 规则编辑 ✅
 *   - 规则详情查看 ✅
 *   - 表格刷新 ✅
 */
export const OncallConfigPage: React.FC = () => {
  const { bots } = useBotList();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRule, setCurrentRule] = useState<Interest | undefined>();
  const [form] = Form.useForm();

  // CustomTable ref用于获取刷新函数
  const tableRef = useRef<RulesTableRef>(null);

  // 获取表格刷新函数
  const getRefreshTable = useCallback(async () => {
    if (tableRef.current?.refresh) {
      const result = await tableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: 'oncall规则表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'OncallConfigPage',
          component: 'getRefreshTable',
        });
      }
    }
  }, []);

  // 使用管理刷新 Hook，提供编辑后刷新功能
  const { afterUpdate } = useManagementRefresh(getRefreshTable);

  // 状态切换处理 - 实现真实的API调用
  interface HandleToggleStatusParams {
    ruleUuid: string;
    isActive: boolean;
  }
  const handleToggleStatus = useCallback(
    async ({
      ruleUuid,
      isActive,
    }: HandleToggleStatusParams): Promise<boolean> => {
      try {
        const response = await oncallRuleService.updateInterestActiveStatus(
          ruleUuid,
          isActive,
        );

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success({
            content: isActive ? '规则已启用' : '规则已停止',
            duration: 20000,
          });
          // 刷新表格
          await getRefreshTable();
          return true;
        }

        Message.error({
          content: response.message || '更新规则状态失败',
          duration: 20000,
        });
        logger.error({
          message: '更新规则状态失败',
          data: { ruleUuid, isActive, response },
          source: 'OncallConfigPage',
          component: 'handleToggleStatus',
        });
        return false;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '更新规则状态失败，请重试';
        Message.error({ content: errorMessage, duration: 20000 });
        logger.error({
          message: errorMessage,
          data: { error: errorObj, ruleUuid, isActive },
          source: 'OncallConfigPage',
          component: 'handleToggleStatus',
        });
        return false;
      }
    },
    [getRefreshTable],
  );

  // 查看详情
  const handleViewDetails = useCallback((rule: Interest) => {
    setCurrentRule(rule);
    setIsEdit(false);
    setDrawerVisible(true);
  }, []);

  // 编辑规则
  const handleEdit = useCallback((rule: Interest) => {
    setCurrentRule(rule);
    setIsEdit(true);
    setDrawerVisible(true);
  }, []);

  // 关闭抽屉
  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
    setCurrentRule(undefined);
    setIsEdit(false);
    form.resetFields();
  }, [form]);

  // 提交表单 - 实现真实的API调用
  const handleSubmit = useCallback(
    async (values: RuleFormData) => {
      if (!currentRule?.uuid) {
        Message.error({ content: '规则ID不存在', duration: 20000 });
        return;
      }

      try {
        // 根据检测类别处理表单数据
        const inspectCategory = currentRule.inspect_category;
        const updateData: RuleSubmitData = {
          name: values.name,
          description: values.description,
          level: values.level,
          silence_delta: values.silence_delta,
          is_active: values.is_active,
          inspect_history: values.inspect_history,
        };

        // 根据检测类别添加对应的可编辑字段
        if (inspectCategory === Interest.inspect_category.SEMANTIC) {
          updateData.examples_positive = values.examples_positive
            ? values.examples_positive
                .split('\n')
                .filter((s: string) => s.trim())
            : [];
          updateData.examples_negative = values.examples_negative
            ? values.examples_negative
                .split('\n')
                .filter((s: string) => s.trim())
            : [];
        } else if (inspectCategory === Interest.inspect_category.RE) {
          updateData.regular_expression = values.regular_expression;
        }

        const response = await oncallRuleService.updateInterestRule(
          currentRule.uuid,
          updateData,
        );

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success({
            content: '规则更新成功',
            duration: 20000,
          });
          // 使用 useManagementRefresh 的 afterUpdate 方法刷新表格
          const refreshResult = await afterUpdate();
          if (!refreshResult.success && refreshResult.error) {
            logger.warn({
              message: '更新后刷新表格失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
              },
              source: 'OncallConfigPage',
              component: 'handleSubmit',
            });
          }
          handleCloseDrawer();
        } else {
          Message.error({
            content: response.message || '更新规则失败',
            duration: 20000,
          });
          logger.error({
            message: '更新规则失败',
            data: { currentRule, values, response },
            source: 'OncallConfigPage',
            component: 'handleSubmit',
          });
        }
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '更新规则失败，请重试';
        Message.error({ content: errorMessage, duration: 20000 });
        logger.error({
          message: errorMessage,
          data: { error: errorObj, currentRule, values },
          source: 'OncallConfigPage',
          component: 'handleSubmit',
        });
      }
    },
    [currentRule, afterUpdate, handleCloseDrawer],
  );

  return (
    <>
      {/* 规则表格 */}
      <RulesTable
        ref={tableRef}
        bots={bots}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
      />

      {/* 规则抽屉 */}
      <RuleDrawer
        visible={drawerVisible}
        isEdit={isEdit}
        rule={currentRule}
        form={form}
        onCancel={handleCloseDrawer}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default OncallConfigPage;
