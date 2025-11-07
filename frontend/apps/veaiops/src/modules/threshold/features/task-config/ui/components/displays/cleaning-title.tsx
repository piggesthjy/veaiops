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
  IconBrush,
  IconCodeBlock,
  IconFile,
} from '@arco-design/web-react/icon';
import { CellRender } from '@veaiops/components';
import type React from 'react';

// 解构CellRender组件，避免重复调用
const { CustomOutlineTag } = CellRender;

const { Title, Text } = Typography;

/**
 * 清洗结果抽屉标题组件属性接口
 */
interface CleaningResultDrawerTitleProps {
  /** 任务名称 */
  taskName: string;
  /** 版本号 */
  version: string | number;
}

/**
 * 清洗结果抽屉标题组件
 * 展示清洗结果的任务名称和版本信息，采用美观的图标和布局设计
 *
 * @param taskName - 任务名称
 * @param version - 版本号
 */
export const CleaningResultDrawerTitle: React.FC<
  CleaningResultDrawerTitleProps
> = ({ taskName, version }) => {
  return (
    <div className="py-1 flex items-center justify-center gap-5">
      {/* 主标题区域 */}
      <div className="flex items-center gap-1">
        <IconBrush style={{ fontSize: 18, color: '#165DFF' }} />
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
            {taskName}
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <IconCodeBlock style={{ fontSize: 14, color: '#86909C' }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            版本:
          </Text>
          <CustomOutlineTag style={{ fontFamily: 'Monaco, monospace' }}>
            {version}
          </CustomOutlineTag>
        </div>
      </div>
    </div>
  );
};

export default CleaningResultDrawerTitle;
