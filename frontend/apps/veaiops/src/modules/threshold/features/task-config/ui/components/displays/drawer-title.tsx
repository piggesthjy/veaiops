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

import { Typography } from '@arco-design/web-react';
import {
  IconCodeBlock,
  IconExperiment,
  IconFile,
  IconSettings,
} from '@arco-design/web-react/icon';
import { useSearchParams } from '@modern-js/runtime/router';
import { CellRender } from '@veaiops/components';
import type { IntelligentThresholdTask } from 'api-generate';
import type React from 'react';
import { useMemo } from 'react';

// 解构CellRender组件，避免重复调用
const { CustomOutlineTag } = CellRender;

const { Title, Text } = Typography;

/**
 * 任务抽屉标题组件属性接口
 */
interface TaskDrawerTitleProps {
  /** 标题类型 */
  titleType: 'cleaning-result' | 'task-detail';
  /** 任务记录 */
  taskRecord?: IntelligentThresholdTask | null;
  /** 版本号 */
  version?: string | number;
}

/**
 * 任务抽屉标题组件
 * 根据标题类型展示不同的标题内容，支持从URL获取taskName
 *
 * @param titleType - 标题类型
 * @param taskRecord - 任务记录
 * @param version - 版本号
 */
export const TaskDrawerTitle: React.FC<TaskDrawerTitleProps> = ({
  titleType,
  taskRecord,
  version,
}) => {
  // 获取URL参数
  const [searchParams] = useSearchParams();
  const urlTaskName = searchParams.get('taskName');

  // 生成标题数据
  const titleData = useMemo(() => {
    // 优先使用URL参数中的taskName，其次使用taskRecord中的task_name
    const taskName = urlTaskName || taskRecord?.task_name || '未知任务';
    // 只有当版本存在且不是"未知"时才使用版本信息
    const versionInfo = version && version !== '未知' ? version : null;

    return { taskName, version: versionInfo };
  }, [urlTaskName, taskRecord?.task_name, version]);

  // 根据标题类型渲染不同的内容
  if (titleType === 'cleaning-result') {
    return (
      <div className="py-1 flex items-center justify-center gap-5">
        {/* 主标题区域 */}
        <div className="flex items-center gap-1">
          <IconExperiment style={{ fontSize: 18, color: '#165DFF' }} />
          <Title
            heading={5}
            style={{ margin: 0, color: '#1D2129' }}
            className="ml-2"
          >
            清洗结果
          </Title>
        </div>

        {/* 任务信息区域 - inline 布局 */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <IconFile style={{ fontSize: 14, color: '#86909C' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              任务名称:
            </Text>
            <Text style={{ fontSize: 14, fontWeight: 500, color: '#1D2129' }}>
              {titleData.taskName}
            </Text>
          </div>

          {titleData.version && (
            <div className="flex items-center gap-2">
              <IconCodeBlock style={{ fontSize: 14, color: '#86909C' }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                版本:
              </Text>
              <CustomOutlineTag style={{ fontFamily: 'Monaco, monospace' }}>
                {titleData.version}
              </CustomOutlineTag>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 任务详情标题
  return (
    <div className="py-1 flex items-center justify-center gap-5">
      {/* 主标题区域 */}
      <div className="flex items-center gap-1">
        <IconSettings style={{ fontSize: 18, color: '#165DFF' }} />
        <Title
          heading={5}
          style={{ margin: 0, color: '#1D2129' }}
          className="ml-2"
        >
          任务详情
        </Title>
      </div>

      {/* 任务信息区域 - inline 布局 */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <IconFile style={{ fontSize: 14, color: '#86909C' }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            任务名称:
          </Text>
          <Text style={{ fontSize: 14, fontWeight: 500, color: '#1D2129' }}>
            {titleData.taskName}
          </Text>
        </div>

        {titleData.version && (
          <div className="flex items-center gap-2">
            <IconCodeBlock style={{ fontSize: 14, color: '#86909C' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              版本:
            </Text>
            <CustomOutlineTag style={{ fontFamily: 'Monaco, monospace' }}>
              {titleData.version}
            </CustomOutlineTag>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDrawerTitle;
