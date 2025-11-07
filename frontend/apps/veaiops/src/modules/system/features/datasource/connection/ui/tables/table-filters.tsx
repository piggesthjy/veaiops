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
 * 数据源连接表格过滤器配置
 */

// 注意：TableFiltersProps 类型已移除，使用本地定义
interface TableFiltersProps {
  type: string;
  onFilter: (filters: Record<string, unknown>) => void;
}

/**
 * 获取表格过滤器配置
 */
export const getTableFilters = ({
  type: _type,
  onFilter: _onFilter,
}: TableFiltersProps) => {
  // 暂时返回空数组，后续可以根据需要添加过滤器
  // 可以添加状态过滤、时间范围过滤等
  return [];
};

/**
 * 状态过滤器选项
 */
export const STATUS_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '正常', value: 'active' },
  { label: '禁用', value: 'inactive' },
];

/**
 * 时间范围过滤器选项
 */
export const TIME_RANGE_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '今天', value: 'today' },
  { label: '最近7天', value: 'week' },
  { label: '最近30天', value: 'month' },
];
