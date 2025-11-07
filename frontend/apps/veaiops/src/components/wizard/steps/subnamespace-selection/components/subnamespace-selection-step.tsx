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
 * 火山引擎子命名空间选择步骤组件
 * @description 提供火山引擎子命名空间选择功能
 * @author AI Assistant
 * @date 2025-01-16
 */

import { Alert, Empty, Input, Radio, Typography } from '@arco-design/web-react';
import { IconCloud, IconSearch } from '@arco-design/web-react/icon';
import { logger } from '@veaiops/utils';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SelectableItem } from '../../../components/selectable-item';
import type { VolcengineProduct } from '../../../types';

const { Title, Text } = Typography;

export interface SubnamespaceSelectionStepProps {
  selectedProduct: VolcengineProduct | null;
  subNamespaces: string[];
  selectedSubnamespace: string | null;
  loading: boolean;
  onSubNamespacesFetch: (namespace: string) => void;
  onSubnamespaceSelect: (subnamespace: string | null) => void;
}

export const SubnamespaceSelectionStep: React.FC<
  SubnamespaceSelectionStepProps
> = ({
  selectedProduct,
  subNamespaces,
  selectedSubnamespace,
  loading,
  onSubNamespacesFetch,
  onSubnamespaceSelect,
}) => {
  // 使用 useRef 同步跟踪已获取的命名空间，避免 useState 异步更新导致的重复请求
  const fetchedNamespaceRef = useRef<string | null>(null);

  // 搜索文本状态
  const [searchText, setSearchText] = useState<string>('');

  // 当选择的产品改变时，自动获取子命名空间并清空搜索文本
  useEffect(() => {
    if (
      selectedProduct?.namespace &&
      selectedProduct.namespace !== fetchedNamespaceRef.current &&
      !loading
    ) {
      const previousNamespace = fetchedNamespaceRef.current;
      const currentNamespace = selectedProduct.namespace;

      logger.info({
        message: '产品切换，开始获取子命名空间',
        data: {
          previousNamespace,
          currentNamespace,
          productDescription: selectedProduct.description,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'useEffect-product-change',
      });

      // 使用 ref 同步更新，防止 React Strict Mode 下的重复调用
      fetchedNamespaceRef.current = currentNamespace;
      onSubNamespacesFetch(currentNamespace);
      // 切换产品时清空搜索文本
      setSearchText('');

      logger.info({
        message: '产品切换完成，已清空搜索文本',
        data: {
          namespace: currentNamespace,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'useEffect-product-change',
      });
    }
  }, [selectedProduct?.namespace, loading, onSubNamespacesFetch]);

  // 首次加载时，如果没有选中项且有可用子命名空间，自动选中第一个
  // 注意：只有在没有搜索文本时才自动选中，避免搜索时触发自动选中导致循环
  useEffect(() => {
    const hasNoSearch = !searchText.trim();
    if (
      !selectedSubnamespace &&
      subNamespaces.length > 0 &&
      !loading &&
      hasNoSearch
    ) {
      const firstSubNamespace = subNamespaces[0];

      logger.info({
        message: '首次加载，自动选中第一个子命名空间',
        data: {
          subNamespace: firstSubNamespace,
          totalCount: subNamespaces.length,
          allSubNamespaces: subNamespaces,
          searchText: searchText || undefined,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'useEffect-auto-select-first',
      });

      onSubnamespaceSelect(firstSubNamespace);
    }
  }, [
    subNamespaces.length,
    loading,
    selectedSubnamespace,
    searchText,
    onSubnamespaceSelect,
  ]);

  // 验证选中项的有效性：
  // 1. 如果选中的子命名空间不在当前列表中，清空选中状态
  // 2. 如果有搜索输入，且选中的项不在搜索结果中，清空选中状态
  useEffect(() => {
    if (!selectedSubnamespace || loading) {
      return;
    }

    // 情况 1: 选中的子命名空间不在原始列表中（无论是否有搜索都要检查）
    if (
      subNamespaces.length > 0 &&
      !subNamespaces.includes(selectedSubnamespace)
    ) {
      logger.warn({
        message: '选中的子命名空间不在当前列表中，清空选中状态',
        data: {
          selectedSubNamespace: selectedSubnamespace,
          availableSubNamespaces: subNamespaces,
          totalCount: subNamespaces.length,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'useEffect-validate-selection',
      });

      onSubnamespaceSelect(null);
      return;
    }

    // 情况 2: 有搜索输入，且选中的项不在搜索结果中
    // 注意：只有在有搜索文本时才验证，避免无搜索时误清空
    const trimmedSearch = searchText.trim();
    if (!trimmedSearch) {
      return;
    }

    const searchLower = trimmedSearch.toLowerCase();
    const isSelectedInFiltered = subNamespaces
      .filter((ns) => {
        if (!ns || typeof ns !== 'string') {
          return false;
        }
        return ns.toLowerCase().includes(searchLower);
      })
      .includes(selectedSubnamespace);

    if (!isSelectedInFiltered) {
      logger.info({
        message: '搜索时选中项不匹配搜索条件，清空选中状态',
        data: {
          searchText: trimmedSearch,
          selectedSubNamespace: selectedSubnamespace,
          availableSubNamespaces: subNamespaces,
          totalCount: subNamespaces.length,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'useEffect-validate-selection',
      });

      onSubnamespaceSelect(null);
    }
  }, [
    selectedSubnamespace,
    subNamespaces,
    searchText,
    loading,
    onSubnamespaceSelect,
  ]);

  const handleSubNamespaceSelect = (subNamespace: string) => {
    logger.info({
      message: '用户选择子命名空间',
      data: {
        subNamespace,
        previousSelection: selectedSubnamespace,
        isSearching: Boolean(searchText.trim()),
        searchText: searchText.trim() || undefined,
      },
      source: 'SubnamespaceSelectionStep',
      component: 'handleSubNamespaceSelect',
    });

    onSubnamespaceSelect(subNamespace);
  };

  // 前端过滤：根据搜索文本过滤子命名空间列表
  // 边界情况处理：
  // 1. 空数组或 undefined/null 处理
  // 2. 搜索文本为空或只有空格时返回全部
  // 3. 即使选中项不在搜索结果中，也要包含它（确保选中状态可见）
  const filteredSubNamespaces = useMemo(() => {
    // 边界情况 1: 空数组或无效数据
    if (!Array.isArray(subNamespaces) || subNamespaces.length === 0) {
      logger.debug({
        message: '子命名空间列表为空，返回空数组',
        data: {
          subNamespacesType: typeof subNamespaces,
          isArray: Array.isArray(subNamespaces),
          length: Array.isArray(subNamespaces) ? subNamespaces.length : 0,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'filteredSubNamespaces',
      });
      return [];
    }

    // 边界情况 2: 搜索文本为空或只有空格
    const trimmedSearch = searchText.trim();
    if (!trimmedSearch) {
      logger.debug({
        message: '搜索文本为空，返回全部子命名空间',
        data: {
          totalCount: subNamespaces.length,
          subNamespaces,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'filteredSubNamespaces',
      });
      return subNamespaces;
    }

    // 边界情况 3: 搜索过滤（不区分大小写）
    const searchLower = trimmedSearch.toLowerCase();
    const filtered = subNamespaces.filter((subNamespace) => {
      // 边界情况 4: 处理 null/undefined 子命名空间
      if (!subNamespace || typeof subNamespace !== 'string') {
        return false;
      }
      return subNamespace.toLowerCase().includes(searchLower);
    });

    // 边界情况 5: 当有搜索输入时，如果选中的项不在搜索结果中，应该清空选中状态
    // 这样可以确保搜索时只显示匹配的结果，避免显示不相关的选中项
    if (
      selectedSubnamespace &&
      subNamespaces.includes(selectedSubnamespace) &&
      !filtered.includes(selectedSubnamespace)
    ) {
      logger.debug({
        message: '选中项不在搜索结果中，将在渲染时清空选中状态',
        data: {
          searchText: trimmedSearch,
          selectedSubNamespace: selectedSubnamespace,
          filteredCount: filtered.length,
          filteredSubNamespaces: filtered,
        },
        source: 'SubnamespaceSelectionStep',
        component: 'filteredSubNamespaces',
      });
      // 注意：不在这里清空选中状态，而是在 useEffect 中处理，避免在渲染过程中修改状态
    }

    logger.debug({
      message: '搜索过滤完成',
      data: {
        searchText: trimmedSearch,
        originalCount: subNamespaces.length,
        filteredCount: filtered.length,
        filteredSubNamespaces: filtered,
        selectedSubNamespace: selectedSubnamespace,
        isSelectedInFiltered: filtered.includes(selectedSubnamespace || ''),
      },
      source: 'SubnamespaceSelectionStep',
      component: 'filteredSubNamespaces',
    });

    return filtered;
  }, [subNamespaces, searchText, selectedSubnamespace]);

  // 将已选中的项放到第一位，方便编辑时快速查看
  // 边界情况处理：确保数组非空，避免排序错误
  const sortedSubNamespaces = useMemo(() => {
    if (
      !Array.isArray(filteredSubNamespaces) ||
      filteredSubNamespaces.length === 0
    ) {
      return [];
    }

    return [...filteredSubNamespaces].sort((a, b) => {
      // 边界情况：处理 null/undefined 值
      if (!a || !b) {
        return 0;
      }

      const aSelected = selectedSubnamespace === a;
      const bSelected = selectedSubnamespace === b;
      if (aSelected && !bSelected) {
        return -1;
      }
      if (!aSelected && bSelected) {
        return 1;
      }
      // 如果都不是选中项或都是选中项，按字母顺序排序
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });
  }, [filteredSubNamespaces, selectedSubnamespace]);

  if (!selectedProduct) {
    return (
      <div>
        <Empty icon={<IconCloud />} description="请先选择火山引擎产品" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title heading={6}>选择子命名空间</Title>
        <Text type="secondary">
          为产品 "{selectedProduct.description}"
          选择一个子命名空间，用于指标监控配置
        </Text>
      </div>

      {/* 搜索输入框 */}
      {/* 边界情况：只有在有数据且不在加载状态时才显示搜索框 */}
      {Array.isArray(subNamespaces) && subNamespaces.length > 0 && !loading && (
        <div style={{ marginBottom: 16 }}>
          <Input
            prefix={<IconSearch />}
            placeholder="搜索子命名空间"
            value={searchText || ''}
            onChange={(value) => {
              // 边界情况：确保 value 是字符串类型
              const newSearchText = typeof value === 'string' ? value : '';
              const previousSearchText = searchText;

              logger.debug({
                message: '搜索文本变化',
                data: {
                  previousSearchText,
                  newSearchText,
                  isClearing: newSearchText === '',
                  originalValueType: typeof value,
                },
                source: 'SubnamespaceSelectionStep',
                component: 'search-input-onChange',
              });

              setSearchText(newSearchText);
            }}
            allowClear
            onClear={() => {
              logger.info({
                message: '用户清空搜索文本',
                data: {
                  previousSearchText: searchText,
                  totalSubNamespaces: subNamespaces.length,
                },
                source: 'SubnamespaceSelectionStep',
                component: 'search-input-onClear',
              });

              // 边界情况：清空时确保设置为空字符串
              setSearchText('');
            }}
          />
        </div>
      )}

      {/* 边界情况处理：空数组、null、undefined */}
      {(!Array.isArray(subNamespaces) || subNamespaces.length === 0) &&
      !loading ? (
        <Empty
          icon={<IconCloud />}
          description="该产品下暂无可用的子命名空间"
        />
      ) : (
        <div>
          {/* 搜索后无结果提示 */}
          {/* 边界情况：搜索文本不为空且过滤结果为空 */}
          {sortedSubNamespaces.length === 0 && searchText.trim() ? (
            <Empty
              icon={<IconSearch />}
              description={`未找到包含 "${searchText.trim()}" 的子命名空间`}
            />
          ) : (
            <Radio.Group
              className="w-full"
              value={selectedSubnamespace || undefined}
              onChange={(value) => {
                // 边界情况：确保 value 是字符串类型
                const validValue =
                  typeof value === 'string' && value.trim()
                    ? value.trim()
                    : null;

                logger.info({
                  message: 'Radio.Group 选择变化',
                  data: {
                    rawValue: value,
                    validValue,
                    previousSelection: selectedSubnamespace,
                    valueType: typeof value,
                    isSearching: Boolean(searchText.trim()),
                    searchText: searchText.trim() || undefined,
                  },
                  source: 'SubnamespaceSelectionStep',
                  component: 'radio-group-onChange',
                });

                onSubnamespaceSelect(validValue);
              }}
            >
              {sortedSubNamespaces.map((subNamespace) => {
                // 边界情况：确保 subNamespace 是有效的字符串
                if (!subNamespace || typeof subNamespace !== 'string') {
                  return null;
                }

                return (
                  <SelectableItem
                    key={subNamespace}
                    selected={selectedSubnamespace === subNamespace}
                    radioValue={subNamespace}
                    onClick={() => handleSubNamespaceSelect(subNamespace)}
                    icon={<IconCloud />}
                    title={subNamespace}
                    description={`产品: ${selectedProduct.description} (${selectedProduct.namespace})`}
                  />
                );
              })}
            </Radio.Group>
          )}
        </div>
      )}

      {/* 边界情况：只有当选中的子命名空间在当前列表中时才显示 */}
      {selectedSubnamespace &&
        Array.isArray(subNamespaces) &&
        subNamespaces.includes(selectedSubnamespace) && (
          <Alert
            className={'mt-2'}
            type="success"
            content={`已选择子命名空间: ${selectedSubnamespace}`}
            showIcon
            closable={false}
          />
        )}
    </div>
  );
};

export default SubnamespaceSelectionStep;
