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
import { IconIdcard, IconRobot, IconTag } from '@arco-design/web-react/icon';
import { CellRender } from '@veaiops/components';
import type { Bot } from 'api-generate';
import type React from 'react';

// 解构CellRender组件，避免重复调用
const { CustomOutlineTag } = CellRender;

const { Title, Text } = Typography;

/**
 * Bot抽屉标题组件属性接口
 */
interface BotDrawerTitleProps {
  bot: Bot;
  title: string;
}

/**
 * Bot抽屉标题组件
 * 展示Bot的基本信息，包括App ID和名称
 *
 * 对应 origin/feat/web-v2 分支的实现，确保功能一致性
 *
 * @param bot - Bot对象，包含bot_id和name信息
 * @param title - 抽屉标题文本
 */
export const BotDrawerTitle: React.FC<BotDrawerTitleProps> = ({
  bot,
  title,
}) => {
  return (
    <div className="py-1 flex items-center justify-center gap-5">
      {/* 主标题区域 */}
      <div className="flex items-center gap-1">
        <IconRobot className="text-lg text-[#165DFF]" />
        <Title heading={5} className="text-[#1D2129]" style={{ margin: 0 }}>
          {title}
        </Title>
      </div>

      {/* Bot信息区域 - inline 布局 */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <IconIdcard className="text-sm text-[#86909C]" />
          <Text type="secondary" className="text-sm">
            App ID:
          </Text>
          <CustomOutlineTag className="font-mono">
            {bot.bot_id || 'N/A'}
          </CustomOutlineTag>
        </div>

        <div className="flex items-center gap-2">
          <IconTag className="text-sm text-[#86909C]" />
          <Text type="secondary" className="text-sm">
            名称:
          </Text>
          <Text className="text-sm font-medium text-[#1D2129]">{bot.name}</Text>
        </div>
      </div>
    </div>
  );
};

export default BotDrawerTitle;
