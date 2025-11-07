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
import { Empty, Input, Message, Select, Spin } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import type { ZabbixTemplate } from 'api-generate';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

interface TemplateSelectorProps {
  connectName: string;
  value?: string;
  onChange?: (templateId: string, template: ZabbixTemplate) => void;
  placeholder?: string;
}

/**
 * Zabbix模板选择器组件
 * @description 支持远程搜索的模板选择器，可以根据模板名称进行模糊匹配
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  connectName,
  value,
  onChange,
  placeholder = '请选择模板',
}) => {
  const [templates, setTemplates] = useState<ZabbixTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // 获取模板列表
  const fetchTemplates = useCallback(
    async (name?: string) => {
      if (!connectName) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await apiClient.dataSources.getApisV1DatasourceZabbixTemplates({
            connectName,
            name, // 使用name参数进行远程搜索
          });

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          setTemplates(response.data);
        } else {
          throw new Error(response.message || '获取模板列表失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';

        Message.error('获取模板列表失败，请重试');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    },
    [connectName],
  );

  // 防抖搜索
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(
    (searchText: string) => {
      setSearchValue(searchText);

      // 清除之前的定时器
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      // 设置新的防抖定时器
      const timer = setTimeout(() => {
        fetchTemplates(searchText || undefined);
      }, 300);

      setSearchTimer(timer);
    },
    [fetchTemplates, searchTimer],
  );

  // 初始加载
  useEffect(() => {
    fetchTemplates();

    // 清理定时器
    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [connectName]);

  // 处理模板选择
  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates.find((t) => t.templateid === templateId);
    if (selectedTemplate && onChange) {
      onChange(templateId, selectedTemplate);
    }
  };

  // 渲染选项
  const renderOption = (template: ZabbixTemplate) => (
    <Select.Option key={template.templateid} value={template.templateid}>
      <div className="template-option">
        <div className="template-name">{template.name}</div>
        <div className="template-id">ID: {template.templateid}</div>
      </div>
    </Select.Option>
  );

  return (
    <div className="template-selector">
      <div className="search-input-wrapper">
        <Input
          prefix={<IconSearch />}
          placeholder="搜索模板名称..."
          value={searchValue}
          onChange={handleSearch}
          allowClear
          style={{ marginBottom: 8 }}
        />
      </div>

      <Select
        placeholder={placeholder}
        value={value}
        onChange={handleTemplateChange}
        loading={loading}
        showSearch={false} // 使用自定义搜索
        allowClear
        style={{ width: '100%' }}
        notFoundContent={
          loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size={16} />
              <div style={{ marginTop: 8 }}>正在搜索模板...</div>
            </div>
          ) : (
            <Empty
              description={
                searchValue
                  ? `未找到包含"${searchValue}"的模板`
                  : '暂无模板数据'
              }
            />
          )
        }
      >
        {templates.map(renderOption)}
      </Select>

      {/* 搜索提示 */}
      {searchValue && (
        <div
          className="search-hint"
          style={{
            fontSize: 12,
            color: '#86909c',
            marginTop: 4,
          }}
        >
          搜索结果：{templates.length} 个模板
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
