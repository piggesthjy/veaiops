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
 * 模板选择步骤组件
 * @description 用于选择Zabbix监控模板
 * @author AI Assistant
 * @date 2025-01-16
 */

import { Alert, Empty, Input, Radio, Typography } from '@arco-design/web-react';
import { IconDesktop, IconSearch } from '@arco-design/web-react/icon';
import type { Connect, ZabbixTemplate } from 'api-generate';
import React, { useEffect } from 'react';
import { SelectableItem } from '../../../components/selectable-item';
import styles from '../../../datasource-wizard.module.less';

const { Text } = Typography;

export interface TemplateSelectionStepProps {
  connect: Connect;
  templates: ZabbixTemplate[];
  selectedTemplate: ZabbixTemplate | null;
  loading: boolean;
  searchText: string;
  onTemplatesFetch: (connectName: string, name?: string) => void;
  onTemplateSelect: (template: ZabbixTemplate) => void;
  onSearchTextChange: (text: string) => void;
}

export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  connect,
  templates,
  selectedTemplate,
  loading,
  searchText,
  onTemplatesFetch,
  onTemplateSelect,
  onSearchTextChange,
}) => {
  const [debouncedSearchText, setDebouncedSearchText] = React.useState('');
  const [lastFetchParams, setLastFetchParams] = React.useState<{
    connectName: string;
    searchText?: string;
  } | null>(null);

  // 防抖处理搜索文本
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // 500ms 防抖

    return () => clearTimeout(timer);
  }, [searchText]);

  // 组件挂载时和搜索文本变化时获取模板列表
  useEffect(() => {
    if (connect?.name && !loading) {
      const currentParams = {
        connectName: connect.name,
        searchText: debouncedSearchText || undefined,
      };

      // 避免重复调用相同的参数
      if (
        !lastFetchParams ||
        lastFetchParams.connectName !== currentParams.connectName ||
        lastFetchParams.searchText !== currentParams.searchText
      ) {
        setLastFetchParams(currentParams);
        onTemplatesFetch(connect.name, debouncedSearchText || undefined);
      }
    }
  }, [
    connect?.name,
    debouncedSearchText,
    loading,
    lastFetchParams,
    onTemplatesFetch,
  ]);

  // 首次加载时，如果没有选中项且有可用模板，自动选中第一个
  // 注意：使用后端搜索，不会触发前端验证逻辑导致的循环，但只有在没有搜索文本时才自动选中（更好的 UX）
  useEffect(() => {
    if (!selectedTemplate && templates.length > 0 && !loading && !searchText) {
      onTemplateSelect(templates[0]);
    }
  }, [
    templates.length,
    loading,
    selectedTemplate,
    searchText,
    onTemplateSelect,
  ]);

  // 不再需要本地过滤，直接使用从API返回的模板列表
  const filteredTemplates = templates;

  // 将已选中的项放到第一位，方便编辑时快速查看
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aSelected = selectedTemplate?.templateid === a.templateid;
    const bSelected = selectedTemplate?.templateid === b.templateid;
    if (aSelected && !bSelected) {
      return -1;
    }
    if (!aSelected && bSelected) {
      return 1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>选择监控模板</div>
        <div className={styles.stepDescription}>
          正在从 {connect.name} 获取可用的监控模板...
        </div>
      </div>
    );
  }

  if (templates.length === 0 && !searchText) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>选择监控模板</div>
        <div className={styles.stepDescription}>
          从连接 {connect.name} 中选择一个监控模板
        </div>

        <Empty icon={<IconDesktop />} description="暂无可用的监控模板" />
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>选择监控模板</div>
      <div className={styles.stepDescription}>
        从连接 {connect.name} 中选择一个监控模板，模板定义了要监控的指标和主机
      </div>

      {/* 搜索框 */}
      <div className={styles.searchContainer}>
        <Input
          prefix={<IconSearch />}
          placeholder="搜索模板名称或描述..."
          value={searchText}
          onChange={onSearchTextChange}
          allowClear
        />
      </div>

      <div className={styles.selectionList}>
        <Radio.Group
          className="w-full"
          value={selectedTemplate?.templateid}
          onChange={(value) => {
            const template = templates.find((t) => t.templateid === value);
            if (template) {
              onTemplateSelect(template);
            }
          }}
        >
          {sortedTemplates.map((template) => (
            <SelectableItem
              key={template.templateid}
              selected={selectedTemplate?.templateid === template.templateid}
              radioValue={template.templateid}
              onClick={() => onTemplateSelect(template)}
              icon={<IconDesktop />}
              title={template.name}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  模板ID: {template.templateid}
                </Text>
              }
            />
          ))}
        </Radio.Group>
      </div>

      {sortedTemplates.length === 0 && searchText && (
        <Empty
          icon={<IconSearch />}
          description={`未找到包含 "${searchText}" 的模板`}
        />
      )}

      {selectedTemplate && (
        <Alert
          className={'mt-2'}
          type="success"
          content={`已选择模板: ${selectedTemplate.name}`}
          showIcon
          closable={false}
        />
      )}
    </div>
  );
};

export default TemplateSelectionStep;
