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
 * 实例选择步骤组件使用示例
 * 展示如何在新增监控数据源向导的第5步"选择实例"中使用空数据提示
 */

import { Checkbox, Input, Space, Typography } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
import type React from 'react';
import { useMemo, useState } from 'react';
import { EmptyInstanceList } from '../components/empty-instance-list';

const { Text } = Typography;
const { Search } = Input;

interface Instance {
  id: string;
  name: string;
  [key: string]: any;
}

interface InstanceSelectionStepProps {
  /** 所有实例列表 */
  allInstances: Instance[];
  /** 已选择的实例ID列表 */
  selectedInstanceIds: string[];
  /** 选择变更回调 */
  onSelectionChange: (selectedIds: string[]) => void;
}

/**
 * 实例选择步骤组件
 * 用于新增监控数据源向导的第5步
 */
export const InstanceSelectionStep: React.FC<InstanceSelectionStepProps> = ({
  allInstances = [],
  selectedInstanceIds = [],
  onSelectionChange,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  // 根据搜索关键词过滤实例
  const filteredInstances = useMemo(() => {
    if (!searchKeyword.trim()) {
      return allInstances;
    }

    const keyword = searchKeyword.toLowerCase();
    return allInstances.filter((instance) =>
      Object.values(instance).some((value) =>
        String(value).toLowerCase().includes(keyword),
      ),
    );
  }, [allInstances, searchKeyword]);

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredInstances.map((inst) => inst.id));
    } else {
      // 只取消当前筛选结果的选中状态
      const filteredIds = filteredInstances.map((inst) => inst.id);
      onSelectionChange(
        selectedInstanceIds.filter((id) => !filteredIds.includes(id)),
      );
    }
  };

  // 单个实例选择
  const handleInstanceToggle = (instanceId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedInstanceIds, instanceId]);
    } else {
      onSelectionChange(selectedInstanceIds.filter((id) => id !== instanceId));
    }
  };

  // 判断当前筛选结果是否全部选中
  const isAllSelected =
    filteredInstances.length > 0 &&
    filteredInstances.every((inst) => selectedInstanceIds.includes(inst.id));

  // 判断是否有部分选中
  const isIndeterminate =
    filteredInstances.some((inst) => selectedInstanceIds.includes(inst.id)) &&
    !isAllSelected;

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Text
          type="secondary"
          style={{ fontSize: '14px', display: 'block', marginBottom: '12px' }}
        >
          选择要监控的火山引擎实例, 可以选择多个实例
        </Text>

        {/* 搜索框 */}
        <Search
          placeholder="搜索实例"
          value={searchKeyword}
          onChange={setSearchKeyword}
          style={{ width: '100%' }}
          allowClear
        />
      </div>

      {/* 选择摘要 */}
      <div style={{ marginBottom: '16px' }}>
        <Space direction="vertical" size={4}>
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={handleSelectAll}
          >
            <Text>全选 ({filteredInstances.length}个实例)</Text>
          </Checkbox>
          <Text
            type="secondary"
            style={{ fontSize: '12px', marginLeft: '24px' }}
          >
            已选择{selectedInstanceIds.length}个实例, 总共{allInstances.length}
            个实例
          </Text>
        </Space>
      </div>

      {/* 实例列表或空数据提示 */}
      {filteredInstances.length === 0 ? (
        <EmptyInstanceList
          searchKeyword={searchKeyword}
          totalCount={allInstances.length}
        />
      ) : (
        <div
          style={{
            border: '1px solid #e5e6eb',
            borderRadius: '4px',
            padding: '16px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {filteredInstances.map((instance) => (
              <Checkbox
                key={instance.id}
                checked={selectedInstanceIds.includes(instance.id)}
                onChange={(checked) =>
                  handleInstanceToggle(instance.id, checked)
                }
              >
                <div>
                  <Text>{instance.name || instance.id}</Text>
                  {instance.description && (
                    <Text
                      type="secondary"
                      style={{
                        fontSize: '12px',
                        display: 'block',
                        marginTop: '4px',
                      }}
                    >
                      {instance.description}
                    </Text>
                  )}
                </div>
              </Checkbox>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};

export default InstanceSelectionStep;
