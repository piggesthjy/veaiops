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
 * 通用实例选择组件
 * @description 通过配置参数支持不同数据源的实例选择
 * @author AI Assistant
 * @date 2025-01-18
 */

import { IconSearch } from '@arco-design/web-react/icon';
import styles from '@wizard/datasource-wizard.module.less';
import type { ZabbixHost } from 'api-generate/index';
import type React from 'react';
import { useMemo } from 'react';
import {
  EmptyState,
  InstanceList,
  LoadingState,
  SearchBox,
  SelectionAlert,
  ZabbixHostList,
} from './index';
import {
  type InstanceData,
  areInstancesEqual,
  getInstanceUniqueId,
} from './instance-list-item';
import type {
  DataTransformer,
  InstanceSelectionConfig,
  SelectionAction,
} from './instance-selection-config';

export interface GenericInstanceSelectionProps<T> {
  /** 原始数据列表 */
  items: T[];
  /** 已选择的原始数据列表 */
  selectedItems: T[];
  /** 加载状态 */
  loading: boolean;
  /** 搜索文本 */
  searchText: string;
  /** 搜索文本变化回调 */
  onSearchChange: (value: string) => void;
  /** 配置 */
  config: InstanceSelectionConfig<T>;
}

export function GenericInstanceSelection<T>({
  items,
  selectedItems,
  loading,
  searchText,
  onSearchChange,
  config,
}: GenericInstanceSelectionProps<T>) {
  // 使用 useMemo 优化排序性能，只在 items 或 selectedItems 变化时重新计算
  const sortedItems = useMemo(() => {
    // 边界情况：如果 items 为空或 selectedItems 为空，直接返回原数组
    if (!items || items.length === 0) {
      return items || [];
    }

    // ✅ 修复：添加去重逻辑，避免重复实例导致勾选错误
    // 使用 Map 来去重，key 为实例的唯一标识（通过转换后的实例数据生成）
    const uniqueItemsMap = new Map<string, T>();
    let duplicateCount = 0;

    for (const item of items) {
      const transformedItem = config.dataTransformer(item);
      const uniqueKey = getInstanceUniqueId(transformedItem);

      // 如果 Map 中已存在相同 key，保留第一个出现的实例
      if (!uniqueItemsMap.has(uniqueKey)) {
        uniqueItemsMap.set(uniqueKey, item);
      } else {
        duplicateCount++;
        // 在开发环境输出警告，便于调试
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[GenericInstanceSelection] 发现重复实例，已去重:`, {
            uniqueKey,
            transformedItem,
            duplicateCount,
          });
        }
      }
    }

    // 在开发环境输出去重统计
    if (process.env.NODE_ENV === 'development' && duplicateCount > 0) {
      console.info(
        `[GenericInstanceSelection] 去重完成: 原始数量=${items.length}, 去重后数量=${uniqueItemsMap.size}, 去除重复=${duplicateCount}`,
      );
    }

    // 转换 Map 为数组
    const uniqueItems = Array.from(uniqueItemsMap.values());

    if (!selectedItems || selectedItems.length === 0) {
      return uniqueItems;
    }

    // 创建已选 ID 的 Set，提高查找性能（O(1) vs O(n)）
    const selectedIdSet = new Set(
      selectedItems.map((item) => config.getId(item)),
    );

    // 对原始 items 进行排序：将已选项排在最前面
    return uniqueItems.sort((a, b) => {
      const aIsSelected = selectedIdSet.has(config.getId(a));
      const bIsSelected = selectedIdSet.has(config.getId(b));

      if (aIsSelected && !bIsSelected) {
        return -1;
      }
      if (!aIsSelected && bIsSelected) {
        return 1;
      }
      return 0;
    });
  }, [items, selectedItems, config]);

  // 转换数据格式以适配通用组件
  const transformedItems: InstanceData[] = useMemo(() => {
    return sortedItems
      .map((item) => {
        try {
          // 边界情况：数据转换函数可能抛出异常，需要捕获
          return config.dataTransformer(item);
        } catch (error) {
          // 数据转换出错时，记录错误并跳过该项
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '[GenericInstanceSelection] 数据转换函数出错，跳过该项:',
              {
                item,
                error,
              },
            );
          }
          return null;
        }
      })
      .filter((item): item is InstanceData => item !== null); // 过滤掉转换失败的项目
  }, [sortedItems, config.dataTransformer]);

  const transformedSelectedItems: InstanceData[] = useMemo(() => {
    return (selectedItems || [])
      .map((item) => {
        try {
          // 边界情况：数据转换函数可能抛出异常，需要捕获
          return config.dataTransformer(item);
        } catch (error) {
          // 数据转换出错时，记录错误并跳过该项
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              '[GenericInstanceSelection] 已选项数据转换函数出错，跳过该项:',
              {
                item,
                error,
              },
            );
          }
          return null;
        }
      })
      .filter((item): item is InstanceData => item !== null); // 过滤掉转换失败的项目
  }, [selectedItems, config.dataTransformer]);

  // 过滤实例
  const filteredItems = useMemo(() => {
    const searchValue = (searchText || '').toLowerCase().trim();

    // 边界情况：如果没有搜索文本，返回所有转换后的项
    if (!searchValue) {
      return transformedItems;
    }

    return transformedItems.filter((instance) => {
      try {
        const originalItem = sortedItems.find(
          (item) => config.getId(item) === instance.id,
        );
        // 边界情况：如果找不到原始项，跳过该项
        if (!originalItem) {
          return false;
        }
        // 边界情况：搜索过滤函数可能抛出异常，需要捕获
        return config.searchFilter(originalItem, searchValue);
      } catch (error) {
        // 搜索过滤出错时，跳过该项（保守策略：不显示错误的项）
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[GenericInstanceSelection] 搜索过滤函数出错，跳过该项:',
            {
              instance,
              error,
            },
          );
        }
        return false;
      }
    });
  }, [transformedItems, sortedItems, searchText, config]);

  // 过滤 Zabbix 主机（用于 useHostList 情况）
  const filteredHosts = useMemo(() => {
    const searchValue = (searchText || '').toLowerCase().trim();

    // 边界情况：如果没有搜索文本，返回所有主机
    if (!searchValue) {
      return sortedItems;
    }

    return sortedItems.filter((item) => {
      try {
        // 边界情况：搜索过滤函数可能抛出异常，需要捕获
        return config.searchFilter(item, searchValue);
      } catch (error) {
        // 搜索过滤出错时，跳过该项（保守策略：不显示错误的项）
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[GenericInstanceSelection] 搜索过滤函数出错，跳过该项:',
            {
              item,
              error,
            },
          );
        }
        return false;
      }
    });
  }, [sortedItems, searchText, config]);

  // 处理实例选择
  const handleInstanceToggle = (instance: InstanceData, checked: boolean) => {
    try {
      // 通过比较转换后的实例来找到匹配的原始项
      // 因为同一 ResourceID 可能对应多个 DiskName，需要精确匹配
      const originalItem = sortedItems.find((item) => {
        try {
          const transformedItem = config.dataTransformer(item);
          return areInstancesEqual(transformedItem, instance);
        } catch (error) {
          // 边界情况：数据转换出错时，跳过该项
          if (process.env.NODE_ENV === 'development') {
            console.warn('[GenericInstanceSelection] 实例选择时数据转换出错:', {
              item,
              error,
            });
          }
          return false;
        }
      });

      // 边界情况：如果找不到原始项，不执行任何操作
      if (!originalItem) {
        return;
      }

      if (checked) {
        // 边界情况：检查是否已经选中，避免重复添加
        // 使用转换后的实例进行比较，确保精确匹配（包括 DiskName）
        const isAlreadySelected = selectedItems.some((item) => {
          try {
            const transformedSelectedItem = config.dataTransformer(item);
            return areInstancesEqual(transformedSelectedItem, instance);
          } catch (error) {
            // 边界情况：数据转换出错时，跳过该项
            return false;
          }
        });
        if (isAlreadySelected) {
          return;
        }
        config.selectionAction([...selectedItems, originalItem]);
      } else {
        // 取消选中：使用转换后的实例进行比较，确保只取消匹配的项
        config.selectionAction(
          selectedItems.filter((item) => {
            try {
              const transformedSelectedItem = config.dataTransformer(item);
              return !areInstancesEqual(transformedSelectedItem, instance);
            } catch (error) {
              // 边界情况：数据转换出错时，保留该项（保守策略）
              return true;
            }
          }),
        );
      }
    } catch (error) {
      // 边界情况：整个选择操作出错时，记录错误但不影响其他功能
      if (process.env.NODE_ENV === 'development') {
        console.error('[GenericInstanceSelection] 实例选择操作出错:', {
          instance,
          checked,
          error,
        });
      }
    }
  };

  // 处理 Zabbix 主机选择（直接使用原始类型）
  const handleHostToggle = (host: T, checked: boolean) => {
    if (checked) {
      // 边界情况：检查是否已经选中，避免重复添加
      const isAlreadySelected = selectedItems.some(
        (item) => config.getId(item) === config.getId(host),
      );
      if (isAlreadySelected) {
        return;
      }
      config.selectionAction([...selectedItems, host]);
    } else {
      config.selectionAction(
        selectedItems.filter(
          (item) => config.getId(item) !== config.getId(host),
        ),
      );
    }
  };

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    try {
      if (checked) {
        // 根据是否使用主机列表，选择不同的过滤列表
        const itemsToSelect = config.useHostList
          ? filteredHosts
          : filteredItems
              .map((instance) => {
                try {
                  return sortedItems.find(
                    (item) => config.getId(item) === instance.id,
                  );
                } catch (error) {
                  // 边界情况：获取 ID 出错时，跳过该项
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(
                      '[GenericInstanceSelection] 全选时获取 ID 出错:',
                      {
                        instance,
                        error,
                      },
                    );
                  }
                  return undefined;
                }
              })
              .filter((item): item is T => item !== undefined); // 类型守卫，过滤掉 undefined

        // 边界情况：如果没有可选择的项，不执行操作
        if (itemsToSelect.length === 0) {
          return;
        }

        config.selectionAction(itemsToSelect);
      } else {
        config.selectionAction([]);
      }
    } catch (error) {
      // 边界情况：全选操作出错时，记录错误但不影响其他功能
      if (process.env.NODE_ENV === 'development') {
        console.error('[GenericInstanceSelection] 全选操作出错:', {
          checked,
          error,
        });
      }
    }
  };

  if (loading) {
    return <LoadingState title={config.title} />;
  }

  // 边界情况：items 为空或未定义
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title={config.title}
        stepDescription={`选择要监控的${config.itemType}`}
        icon={config.icon as React.ReactElement}
        description={config.emptyDescription}
      />
    );
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>{config.title}</div>
      <div className={styles.stepDescription}>{config.description}</div>

      {/* 搜索框 */}
      <SearchBox
        placeholder={config.searchPlaceholder}
        value={searchText}
        onChange={onSearchChange}
      />

      {/* 搜索后无数据提示 */}
      {(() => {
        const hasSearchText = Boolean(searchText.trim());
        const hasNoFilteredData = config.useHostList
          ? filteredHosts.length === 0
          : filteredItems.length === 0;

        // 边界情况 1：有搜索文本但无匹配结果 -> 显示搜索无结果提示
        if (hasSearchText && hasNoFilteredData) {
          return (
            <EmptyState
              icon={<IconSearch />}
              description={`未找到包含 "${searchText.trim()}" 的${config.itemType}`}
            />
          );
        }

        // 边界情况 2：无搜索文本但过滤后无数据 -> 可能是数据转换失败，显示初始空状态
        if (!hasSearchText && hasNoFilteredData) {
          return (
            <EmptyState
              icon={config.icon as React.ReactElement}
              description={config.emptyDescription}
            />
          );
        }

        // 正常情况：有数据，显示列表
        return (
          <>
            {config.useHostList ? (
              <ZabbixHostList
                hosts={filteredHosts as ZabbixHost[]}
                selectedHosts={selectedItems as ZabbixHost[]}
                onHostToggle={
                  handleHostToggle as (
                    host: ZabbixHost,
                    checked: boolean,
                  ) => void
                }
                onSelectAll={handleSelectAll}
              />
            ) : (
              <InstanceList
                instances={filteredItems}
                selectedInstances={transformedSelectedItems}
                iconType={config.itemType === '主机' ? 'desktop' : 'cloud'}
                onInstanceToggle={handleInstanceToggle}
                onSelectAll={handleSelectAll}
              />
            )}
          </>
        );
      })()}

      {/* 选择提示 - 只在有数据且没有显示空提示时显示 */}
      {((config.useHostList && filteredHosts.length > 0) ||
        (!config.useHostList && filteredItems.length > 0)) && (
        <SelectionAlert
          selectedCount={selectedItems.length}
          totalCount={items.length}
          itemType={config.itemType}
        />
      )}
    </div>
  );
}

export default GenericInstanceSelection;
