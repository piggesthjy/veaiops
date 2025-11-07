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

import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import { useCardTemplateTableConfig } from '@card-template';
import type { BaseQuery, CustomTableActionType } from '@veaiops/components';
import { logger } from '@veaiops/utils';
import type { AgentTemplate } from 'api-generate';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 卡片模板页面Hook返回值类型
 */
export interface UseCardTemplatePageReturn {
  // 表格引用
  tableRef: React.RefObject<CustomTableActionType<AgentTemplate, BaseQuery>>;

  // 引导相关状态
  showGuide: boolean;
  guideVisible: boolean;
  setGuideVisible: (visible: boolean) => void;
  shouldShowGuide: boolean; // showGuide && guideVisible

  // 管理逻辑（弹窗、表单、事件处理器等）
  managementLogic: {
    modalVisible: boolean;
    editingTemplate: AgentTemplate | null;
    form: ReturnType<typeof import('@arco-design/web-react').Form.useForm>[0];
    handleCancel: () => void;
    handleSubmit: (
      values:
        | import('api-generate').AgentTemplateCreateRequest
        | import('api-generate').AgentTemplateUpdateRequest,
    ) => Promise<boolean>;
  };

  // 表格配置
  dataSource: Record<string, unknown>;
  tableProps: Record<string, unknown>;
  handleColumns: ReturnType<typeof useCardTemplateTableConfig>['handleColumns'];
  handleFilters: ReturnType<typeof useCardTemplateTableConfig>['handleFilters'];
  queryFormat: ReturnType<typeof useCardTemplateTableConfig>['queryFormat'];

  // 操作按钮配置
  actions: React.ReactNode[];
}

/**
 * 卡片模板页面Hook
 * 封装页面级别的所有逻辑和状态
 */
export const useCardTemplatePage = (): UseCardTemplatePageReturn => {
  // ✅ 修复：tableRef 类型使用 AgentTemplate（单一数据源原则）
  const tableRef =
    useRef<CustomTableActionType<AgentTemplate, BaseQuery>>(null);
  const [, setData] = useState<AgentTemplate[]>([]);
  const [, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideVisible, setGuideVisible] = useState(false);

  // 表格配置
  // ✅ 使用 modules 版本的完整 Hook，支持 customTableProps 返回值结构
  // ✅ 修复：传递 tableRef 给 useCardTemplateTableConfig，确保刷新时使用同一个 ref
  const {
    customTableProps,
    handleColumns: tableHandleColumns,
    handleFilters: tableHandleFilters,
    queryFormat: tableQueryFormat,
    renderActions,
    modalVisible,
    editingTemplate,
    form,
    handleCancel,
    handleSubmit,
  } = useCardTemplateTableConfig({
    ref: tableRef,
  });

  // ✅ 从 customTableProps 中提取 dataSource 和 tableProps
  const { dataSource, tableProps } = useMemo(() => {
    const extracted = customTableProps as {
      dataSource: Record<string, unknown>;
      tableProps: Record<string, unknown>;
      [key: string]: unknown;
    };
    return {
      dataSource: extracted.dataSource || {},
      tableProps: extracted.tableProps || {},
    };
  }, [customTableProps]);

  // 🔍 调试：记录 useCardTemplateTableConfig 返回值
  useEffect(() => {
    logger.debug({
      message: '[useCardTemplatePage] useCardTemplateTableConfig 返回值',
      data: {
        hasCustomTableProps: Boolean(customTableProps),
        customTablePropsKeys: customTableProps
          ? Object.keys(customTableProps)
          : [],
        hasDataSource: Boolean(dataSource),
        dataSourceType: typeof dataSource,
        dataSourceKeys: dataSource ? Object.keys(dataSource) : [],
        hasRequest: Boolean((dataSource as any)?.request),
        requestType: typeof (dataSource as any)?.request,
        hasTableProps: Boolean(tableProps),
      },
      source: 'useCardTemplatePage',
      component: 'useCardTemplatePage',
    });
  }, [customTableProps, dataSource, tableProps]);

  // 🔍 调试：记录解构后的 dataSource
  useEffect(() => {
    logger.debug({
      message: '[useCardTemplatePage] 解构后的 dataSource',
      data: {
        hasDataSource: Boolean(dataSource),
        dataSourceType: typeof dataSource,
        dataSourceKeys: dataSource ? Object.keys(dataSource) : [],
        hasRequest: Boolean((dataSource as any)?.request),
        requestType: typeof (dataSource as any)?.request,
        ready: (dataSource as any)?.ready,
        manual: (dataSource as any)?.manual,
        isServerPagination: (dataSource as any)?.isServerPagination,
      },
      source: 'useCardTemplatePage',
      component: 'useCardTemplatePage',
    });
  }, [dataSource]);

  // 操作按钮配置
  const actions = renderActions({});

  // 检查是否需要显示引导页面
  useEffect(() => {
    const checkInitialState = async () => {
      try {
        setLoading(true);
        const response =
          await apiClient.agentTemplate.getApisV1ManagerEventCenterAgentTemplate(
            {
              limit: 10,
              skip: 0,
            },
          );

        if (response.data && response.data.length === 0) {
          setShowGuide(true);
          setGuideVisible(true);
        }
        setData(response.data || []);
      } catch (error: unknown) {
        // ✅ 正确：透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '获取模版列表失败，请重试';
        Message.error(errorMessage);
        logger.error({
          message: '检查初始状态失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'useCardTemplatePage',
          component: 'checkInitialState',
        });
      } finally {
        setLoading(false);
      }
    };

    checkInitialState();
  }, []);

  // ✅ 计算是否应该显示引导页面
  const shouldShowGuide = useMemo(
    () => showGuide && guideVisible,
    [showGuide, guideVisible],
  );

  // ✅ 使用 useMemo 稳定化返回值，避免每次渲染创建新对象引用
  return useMemo(
    () => ({
      // 表格引用
      tableRef,

      // 引导相关状态
      showGuide,
      guideVisible,
      setGuideVisible,
      shouldShowGuide,

      // 管理逻辑（包含弹窗状态和处理器）
      managementLogic: {
        modalVisible,
        editingTemplate,
        form,
        handleCancel,
        handleSubmit,
      },

      // 表格配置
      dataSource,
      tableProps,
      handleColumns: tableHandleColumns,
      handleFilters: tableHandleFilters,
      queryFormat: tableQueryFormat,

      // 操作按钮配置
      actions,
    }),
    [
      tableRef,
      showGuide,
      guideVisible,
      setGuideVisible,
      shouldShowGuide,
      modalVisible,
      editingTemplate,
      form,
      handleCancel,
      handleSubmit,
      dataSource,
      tableProps,
      tableHandleColumns,
      tableHandleFilters,
      tableQueryFormat,
      actions,
    ],
  );
};
