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

import { Drawer } from '@arco-design/web-react';
import { CustomTable } from '@veaiops/components';
import type {
  IntelligentThresholdTask,
  IntelligentThresholdTaskVersion,
  MetricThresholdResult,
} from 'api-generate';
import type React from 'react';
import { useMemo } from 'react';
import { TaskDrawerTitle } from '../components/displays';
import { useCleaningResultColumns } from '../hooks';

/**
 * 清洗结果抽屉属性接口
 */
export interface CleaningResultDrawerProps {
  /** 是否可见 */
  visible: boolean;
  /** 任务记录 */
  taskRecord?: IntelligentThresholdTask | null;
  /** 版本记录 */
  versionRecord?: IntelligentThresholdTaskVersion | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 查看时序图回调 */
  onViewTimeSeries?: (
    record: MetricThresholdResult,
    task?: IntelligentThresholdTask,
  ) => void;
}

/**
 * 清洗结果抽屉组件
 * 使用 CustomTable 展示清洗结果数据
 */
const CleaningResultDrawer: React.FC<CleaningResultDrawerProps> = ({
  visible,
  taskRecord,
  versionRecord,
  onClose,
  onViewTimeSeries,
}) => {
  // 处理列配置，包装 onViewTimeSeries 以传递 task 信息
  const wrappedOnViewTimeSeries = onViewTimeSeries
    ? (record: MetricThresholdResult) =>
        onViewTimeSeries(record, taskRecord || undefined)
    : undefined;

  const handleColumns = useCleaningResultColumns({
    onViewTimeSeries: wrappedOnViewTimeSeries,
  });

  // 处理过滤器配置（暂时为空，可以后续扩展）
  const handleFilters = useMemo(() => {
    return () => [];
  }, []);

  // 数据源配置
  const dataSource = useMemo(() => {
    const results = versionRecord?.result || [];

    return {
      // 使用静态数据源
      dataList: results,
      ready: false,
    };
  }, [versionRecord?.result]);

  // 生成行键
  // const getRowKey = useMemo(() => {
  //   return (record: MetricThresholdResult) =>
  //     record.unique_key || record.name || 'unknown';
  // }, []); // Removed unused variable

  return (
    <Drawer
      title={
        <TaskDrawerTitle
          titleType="cleaning-result"
          taskRecord={taskRecord}
          version={versionRecord?.version}
        />
      }
      visible={visible}
      onCancel={onClose}
      width="80%"
      footer={null}
      maskClosable={false}
      focusLock={false}
    >
      <div className="mb-5">
        <CustomTable<MetricThresholdResult>
          rowKey={'unique_key'}
          handleColumns={handleColumns}
          handleFilters={handleFilters}
          dataSource={dataSource}
          tableProps={{
            scroll: { x: 1000 },
            border: { headerCell: true, bodyCell: true },
            size: 'small',
          }}
          pagination={{
            defaultPageSize: 20,
            sizeOptions: [20, 50, 100],
          }}
          showReset={false}
          syncQueryOnSearchParams={false}
        />
      </div>
    </Drawer>
  );
};

export default CleaningResultDrawer;
