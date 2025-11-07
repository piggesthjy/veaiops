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

import { AGENT_TYPE_MAP } from '@/pages/event-center/card-template/types';
import { EVENT_LEVEL_MAP } from '@ec/subscription';
import { CellRender } from '@veaiops/components';
import { EMPTY_CONTENT_TEXT } from '@veaiops/constants';

// 解构CellRender组件，避免重复调用
const { CustomOutlineTag } = CellRender;

/**
 * 渲染事件ID - 使用CopyableText组件显示，方便复制
 * 当没有事件ID时，直接显示"-"，不显示复制按钮
 */
export const renderEventId = (value: string) => {
  if (!value) {
    return EMPTY_CONTENT_TEXT;
  }
  return <CellRender.CopyableText text={value} />;
};

/**
 * 渲染事件级别 - 使用颜色标签显示
 */
export const renderEventLevel = (value: string) => {
  return (
    <CustomOutlineTag>
      {EVENT_LEVEL_MAP[value]?.label || value || '-'}
    </CustomOutlineTag>
  );
};

/**
 * 渲染功能模块 - 使用标签显示
 */
export const renderAgentType = (value: string) => {
  return value ? (
    <CustomOutlineTag>{AGENT_TYPE_MAP[value]?.label || value}</CustomOutlineTag>
  ) : (
    EMPTY_CONTENT_TEXT
  );
};

/**
 * 项目数据类型定义
 * 支持字符串或包含项目信息的对象
 */
interface ProjectItem {
  name?: string;
  project_name?: string;
}

/**
 * 渲染项目列表 - 使用TagEllipsis组件
 */
export const renderProjectList = (projects: unknown) => {
  if (!Array.isArray(projects) || !projects.length) {
    return <CellRender.Ellipsis text="-" />;
  }

  const dataList = projects.map((item: unknown, index: number) => {
    let projectName = `项目${index + 1}`;

    if (typeof item === 'string') {
      projectName = item;
    } else if (item && typeof item === 'object') {
      const projectItem = item as ProjectItem;
      projectName = projectItem.name || projectItem.project_name || projectName;
    }

    return {
      name: projectName,
      key: `project-${index}`,
    };
  });

  return (
    <CellRender.TagEllipsis
      dataList={dataList}
      maxCount={2}
      tagProps={{ size: 'small' }}
    />
  );
};

/**
 * 渲染区域列表 - 使用TagEllipsis组件
 */
export const renderRegionList = (value: string[]) => (
  <CellRender.TagEllipsis
    dataList={(value || []).map((item, index) => ({
      name: item,
      key: `region-${index}`,
    }))}
    maxCount={1}
    tagProps={{ size: 'small' }}
  />
);

/**
 * 渲染时间戳 - 使用StampTime组件
 */
export const renderTimestamp = (value: string) => (
  <CellRender.StampTime time={value} template="YYYY-MM-DD HH:mm:ss" />
);
