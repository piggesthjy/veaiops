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

import { Descriptions, Drawer } from '@arco-design/web-react';
import { CellRender } from '@veaiops/components';
import type { MetricTemplate } from 'api-generate';
import type React from 'react';
import { getMetricTypeTranslation } from '../../lib/metric-type-translations';

const { StampTime, CustomOutlineTag } = CellRender;

/**
 * 指标模板详情抽屉组件属性接口
 */
export interface MetricTemplateDetailDrawerProps {
  /** 是否显示抽屉 */
  visible: boolean;
  /** 选中的模板 */
  selectedTemplate: MetricTemplate | null;
  /** 关闭抽屉的回调 */
  onClose: () => void;
}

/**
 * 格式化数字显示
 * 对于极大/极小值使用科学计数法，否则使用固定小数位数
 */
const formatNumberValue = (
  value: number | null | undefined,
  precision = 6,
): string => {
  if (value === null || value === undefined) {
    return '-';
  }

  const absValue = Math.abs(value);
  const threshold = 1e6; // 阈值：超过100万或小于0.000001使用科学计数法

  if (absValue >= threshold || (absValue > 0 && absValue < 1 / threshold)) {
    // 使用科学计数法显示，保留 precision 位小数
    return value.toExponential(precision);
  } else {
    // 正常范围内使用 toFixed
    return value.toFixed(precision);
  }
};

/**
 * 指标模板详情抽屉组件
 * 提供指标模板详细信息的查看功能
 */
export const MetricTemplateDetailDrawer: React.FC<
  MetricTemplateDetailDrawerProps
> = ({ visible, selectedTemplate, onClose }) => {
  if (!selectedTemplate) {
    return null;
  }

  return (
    <Drawer
      title="指标模板详情"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Descriptions
        column={1}
        labelStyle={{ width: '120px', fontWeight: 500 }}
        data={[
          {
            label: '模板名称',
            value: selectedTemplate.name || '-',
          },
          {
            label: '模板ID',
            value: selectedTemplate._id || '-',
          },
          {
            label: '指标类型',
            value: getMetricTypeTranslation(selectedTemplate.metric_type),
          },
          {
            label: '指标最小值',
            value: formatNumberValue(selectedTemplate.min_value),
          },
          {
            label: '指标最大值',
            value: formatNumberValue(selectedTemplate.max_value),
          },
          {
            label: '默认阈值下界',
            value: formatNumberValue(selectedTemplate.normal_range_start),
          },
          {
            label: '默认阈值上界',
            value: formatNumberValue(selectedTemplate.normal_range_end),
          },
          {
            label: '最小步长',
            value: selectedTemplate.min_step ?? '-',
          },
          {
            label: '最小违规值',
            value: selectedTemplate.min_violation ?? '-',
          },
          {
            label: '最小违规比例',
            value: selectedTemplate.min_violation_ratio ?? '-',
          },
          {
            label: '缺失值',
            value: selectedTemplate.missing_value ?? '-',
          },
          {
            label: '异常消除期望',
            value: selectedTemplate.failure_interval_expectation ?? '-',
          },
          {
            label: '显示单位',
            value: selectedTemplate.display_unit || '-',
          },
          {
            label: '线性缩放',
            value: selectedTemplate.linear_scale ?? '-',
          },
          {
            label: '最大时间间隔',
            value: selectedTemplate.max_time_gap ?? '-',
          },
          {
            label: '最小时间序列长度',
            value: selectedTemplate.min_ts_length ?? '-',
          },
          {
            label: '状态',
            value: (
              <CustomOutlineTag>
                {selectedTemplate.is_active ? '启用' : '禁用'}
              </CustomOutlineTag>
            ),
          },
          {
            label: '创建时间',
            value: selectedTemplate.created_at ? (
              <StampTime
                time={selectedTemplate.created_at}
                template="YYYY-MM-DD HH:mm:ss"
              />
            ) : (
              '-'
            ),
          },
          {
            label: '更新时间',
            value: selectedTemplate.updated_at ? (
              <StampTime
                time={selectedTemplate.updated_at}
                template="YYYY-MM-DD HH:mm:ss"
              />
            ) : (
              '-'
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default MetricTemplateDetailDrawer;
