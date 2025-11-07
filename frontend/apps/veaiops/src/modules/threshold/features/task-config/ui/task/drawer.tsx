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

import { Form } from '@arco-design/web-react';
import type { FormInstance } from '@arco-design/web-react/es/Form';
import type { TaskOperateType } from '@task-config/lib';
import type {
  IntelligentThresholdTask,
  IntelligentThresholdTaskVersion,
  MetricThresholdResult,
} from 'api-generate';
import type React from 'react';
import { useEffect, useState } from 'react';
import { CleaningResultDrawer } from '../cleaning';
import { MainTaskDrawer, MetricConfigDrawer } from '../components/drawers';
import { MetricDetailConfig, RerunFormConfig } from '../components/forms';
import { useVersionHistory } from '../hooks';

/**
 * 任务抽屉组件属性接口
 */
interface TaskDrawerProps {
  visible: boolean;
  operationType: TaskOperateType;
  editingTask: IntelligentThresholdTask | null;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<boolean>;
  form: FormInstance;
  loading: boolean;
  onViewTimeSeries?: (
    record: MetricThresholdResult,
    task?: IntelligentThresholdTask,
  ) => void;
}

// 导出渲染详情配置函数，供其他组件使用
export const renderDetailConfig = ({
  form,
  readOnly = false,
}: {
  form: FormInstance;
  readOnly?: boolean;
}) => <MetricDetailConfig form={form} readOnly={readOnly} />;

// 导出重新执行表单渲染函数，供其他组件使用
export const renderRerunForm = ({ form }: { form: FormInstance }) => (
  <RerunFormConfig form={form} />
);

/**
 * 任务操作抽屉组件
 */
export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  visible,
  operationType,
  editingTask,
  onCancel,
  onSubmit,
  form,
  loading,
  onViewTimeSeries,
}) => {
  // 状态管理
  const [detailConfigVisible, setDetailConfigVisible] = useState(false);
  const [detailConfigData, setDetailConfigData] = useState({});
  const [detailConfigForm] = Form.useForm();
  const [cleaningResultVisible, setCleaningResultVisible] = useState(false);
  const [selectedVersion, setSelectedVersion] =
    useState<IntelligentThresholdTaskVersion | null>(null);

  // 版本历史管理
  const { versions, loading: versionsLoading } = useVersionHistory(
    editingTask?._id,
    operationType === 'versions' && visible,
  );

  // 同步详情配置数据
  useEffect(() => {
    detailConfigForm.setFieldsValue(detailConfigData);
  }, [detailConfigData, detailConfigForm]);

  // 处理清洗结果查看
  const handleViewCleaningResult = (
    version: IntelligentThresholdTaskVersion,
  ) => {
    setSelectedVersion(version);
    setCleaningResultVisible(true);
  };

  // 处理清洗结果抽屉关闭
  const handleCleaningResultClose = () => {
    setCleaningResultVisible(false);
    setSelectedVersion(null);
  };

  return (
    <>
      {/* 主任务抽屉 */}
      <MainTaskDrawer
        visible={visible}
        operationType={operationType}
        editingTask={editingTask}
        onCancel={onCancel}
        onSubmit={onSubmit}
        form={form}
        loading={loading}
        versions={versions}
        versionsLoading={versionsLoading}
        setDetailConfigData={setDetailConfigData}
        setDetailConfigVisible={setDetailConfigVisible}
        onViewCleaningResult={handleViewCleaningResult}
      />

      {/* 指标模版配置抽屉 */}
      <MetricConfigDrawer
        visible={detailConfigVisible}
        form={detailConfigForm}
        onCancel={() => setDetailConfigVisible(false)}
      />

      {/* 清洗结果抽屉 */}
      <CleaningResultDrawer
        visible={cleaningResultVisible}
        taskRecord={editingTask}
        versionRecord={selectedVersion}
        onClose={handleCleaningResultClose}
        onViewTimeSeries={onViewTimeSeries}
      />
    </>
  );
};

export default TaskDrawer;
