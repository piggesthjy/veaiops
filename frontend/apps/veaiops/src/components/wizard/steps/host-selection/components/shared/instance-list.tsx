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

import { Checkbox, Space } from '@arco-design/web-react';
import type React from 'react';
import styles from '../../../../datasource-wizard.module.less';
import type { InstanceData } from './instance-list-item';
import {
  InstanceListItem,
  areInstancesEqual,
  getInstanceUniqueId,
} from './instance-list-item';

export interface InstanceListProps {
  instances: InstanceData[];
  selectedInstances: InstanceData[];
  iconType?: 'cloud' | 'desktop';
  onInstanceToggle: (instance: InstanceData, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const InstanceList: React.FC<InstanceListProps> = ({
  instances,
  selectedInstances,
  iconType = 'cloud',
  onInstanceToggle,
  onSelectAll,
}) => {
  const isAllSelected =
    instances.length > 0 &&
    instances.every((instance) =>
      selectedInstances.some((selected) =>
        areInstancesEqual(selected, instance),
      ),
    );

  const isIndeterminate = selectedInstances.length > 0 && !isAllSelected;

  return (
    <>
      {/* 全选控制 */}
      <div className={styles.selectAllContainer}>
        <Checkbox
          checked={isAllSelected}
          indeterminate={isIndeterminate}
          onChange={onSelectAll}
        >
          全选 ({instances.length} 个实例)
        </Checkbox>
      </div>

      <div className={styles.selectionList}>
        <Space direction="vertical" size="medium" style={{ width: '100%' }}>
          {instances.map((instance, index) => {
            // 使用 areInstancesEqual 来比较实例，考虑 DiskName 等所有字段
            const isSelected = selectedInstances.some((selected) =>
              areInstancesEqual(selected, instance),
            );
            // 使用统一的唯一标识生成函数，确保 key 和选中逻辑一致
            const uniqueKey = getInstanceUniqueId(instance, index);

            return (
              <InstanceListItem
                key={uniqueKey}
                instance={instance}
                isSelected={isSelected}
                iconType={iconType}
                onToggle={onInstanceToggle}
              />
            );
          })}
        </Space>
      </div>
    </>
  );
};
