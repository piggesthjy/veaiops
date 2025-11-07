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
 * 命名空间选择步骤组件
 * @description 用于选择阿里云命名空间
 * @author AI Assistant
 * @date 2025-01-16
 */

import { Alert, Empty, Input, Radio, Typography } from '@arco-design/web-react';
import { IconCloud, IconSearch } from '@arco-design/web-react/icon';
import { logger } from '@veaiops/utils';
import type { Connect } from 'api-generate';
import React, { useEffect, useMemo } from 'react';
import { SelectableItem } from '../../../components/selectable-item';
import styles from '../../../datasource-wizard.module.less';
import type { AliyunProject, WizardActions } from '../../../types';

const { Text } = Typography;

export interface NamespaceSelectionStepProps {
  connect: Connect;
  projects: AliyunProject[];
  selectNamespace: AliyunProject | null; // 重命名：selectedProject -> selectNamespace
  loading: boolean;
  hasAttemptedFetch: boolean;
  actions: WizardActions;
}

export const NamespaceSelectionStep: React.FC<NamespaceSelectionStepProps> = ({
  connect,
  projects,
  selectNamespace,
  loading,
  hasAttemptedFetch,
  actions,
}) => {
  const [searchText, setSearchText] = React.useState('');

  // 组件挂载时获取命名空间列表
  useEffect(() => {
    if (
      (connect?.id || connect?._id) &&
      projects.length === 0 &&
      !loading &&
      !hasAttemptedFetch
    ) {
      actions.fetchAliyunProjects((connect.id || connect._id)!);
    }
  }, [
    connect?.name,
    projects.length,
    loading,
    hasAttemptedFetch,
    actions.fetchAliyunProjects,
  ]);

  // 首次加载时，如果没有选中项且有可用命名空间，自动选中第一个
  // 注意：只有在没有搜索文本时才自动选中，避免搜索时触发自动选中导致循环
  useEffect(() => {
    const hasNoSearch = !searchText.trim();
    if (!selectNamespace && projects.length > 0 && !loading && hasNoSearch) {
      logger.info({
        message: '首次加载，自动选中第一个命名空间',
        data: {
          project: projects[0],
          totalCount: projects.length,
          searchText: searchText || undefined,
        },
        source: 'NamespaceSelectionStep',
        component: 'useEffect-auto-select-first',
      });
      actions.setSelectNamespace(projects[0]);
    }
  }, [
    projects.length,
    loading,
    selectNamespace,
    searchText,
    actions.setSelectNamespace,
  ]);

  // 过滤命名空间（前端过滤）
  const filteredProjects = useMemo(() => {
    const trimmedSearch = (searchText || '').trim();
    if (!trimmedSearch) {
      return projects;
    }

    const searchLower = trimmedSearch.toLowerCase();
    return projects.filter(
      (project) =>
        project.project?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.region?.toLowerCase().includes(searchLower),
    );
  }, [projects, searchText]);

  // 验证选中项的有效性：如果有搜索输入，且选中的项不在搜索结果中，清空选中状态
  useEffect(() => {
    if (!selectNamespace || loading) {
      return;
    }

    const trimmedSearch = (searchText || '').trim();
    // 只有在有搜索文本时才验证，避免无搜索时误清空
    if (!trimmedSearch) {
      return;
    }

    const searchLower = trimmedSearch.toLowerCase();
    const isSelectedInFiltered =
      filteredProjects.some((p) => p.project === selectNamespace.project) &&
      (selectNamespace.project?.toLowerCase().includes(searchLower) ||
        selectNamespace.description?.toLowerCase().includes(searchLower) ||
        selectNamespace.region?.toLowerCase().includes(searchLower));

    if (!isSelectedInFiltered) {
      logger.info({
        message: '搜索时选中项不匹配搜索条件，清空选中状态',
        data: {
          searchText: trimmedSearch,
          selectedProject: selectNamespace.project,
          selectedDescription: selectNamespace.description,
          filteredCount: filteredProjects.length,
        },
        source: 'NamespaceSelectionStep',
        component: 'useEffect-validate-selection',
      });

      // setSelectNamespace 支持 null，可以直接清空
      actions.setSelectNamespace(null);
    }
  }, [
    selectNamespace,
    filteredProjects,
    searchText,
    loading,
    actions.setSelectNamespace,
  ]);

  // 将已选中的项放到第一位，方便编辑时快速查看
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aSelected = selectNamespace?.project === a.project;
    const bSelected = selectNamespace?.project === b.project;
    if (aSelected && !bSelected) {
      return -1;
    }
    if (!aSelected && bSelected) {
      return 1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>选择命名空间</div>
        <div className={styles.stepDescription}>
          正在从连接 {connect.name} 获取阿里云命名空间...
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>选择命名空间</div>
        <div className={styles.stepDescription}>
          从连接 {connect.name} 中选择一个阿里云命名空间
        </div>

        <Empty icon={<IconCloud />} description="暂无可用的命名空间" />
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>命名空间</div>
      <div className={styles.stepDescription}>
        从连接 {connect.name}{' '}
        中选择一个阿里云命名空间，命名空间定义了监控数据的范围
      </div>

      {/* 搜索框 */}
      <div className={styles.searchContainer}>
        <Input
          prefix={<IconSearch />}
          placeholder="搜索命名空间名称或描述..."
          value={searchText}
          onChange={setSearchText}
          allowClear
        />
      </div>

      <div className={styles.selectionList}>
        <Radio.Group
          className="w-full"
          value={selectNamespace?.project}
          onChange={(value) => {
            const project = projects.find((p) => p.project === value);
            if (project) {
              actions.setSelectNamespace(project);
            }
          }}
        >
          {sortedProjects.map((project) => (
            <SelectableItem
              key={project.project}
              selected={selectNamespace?.project === project.project}
              radioValue={project.project}
              onClick={() => actions.setSelectNamespace(project)}
              icon={<IconCloud />}
              title={project.project}
              description={project.description}
              extra={
                project.region && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    区域: {project.region}
                  </Text>
                )
              }
            />
          ))}
        </Radio.Group>
      </div>

      {sortedProjects.length === 0 && searchText && (
        <Empty
          icon={<IconSearch />}
          description={`未找到包含 "${searchText}" 的命名空间`}
        />
      )}

      {selectNamespace && (
        <Alert
          className={'mt-2'}
          type="success"
          content={`已选择命名空间: ${selectNamespace.project}`}
          showIcon
          closable={false}
        />
      )}
    </div>
  );
};

export default NamespaceSelectionStep;
