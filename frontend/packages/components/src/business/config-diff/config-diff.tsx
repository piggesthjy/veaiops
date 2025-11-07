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

import { CellRender } from '@/cell-render';
import { Card, Descriptions, Typography } from '@arco-design/web-react';
import type React from 'react';

// 解构CellRender组件，避免重复调用
const { CustomOutlineTag } = CellRender;

const { Title, Text } = Typography;

/**
 * 配置变更项
 */
export interface ConfigChange {
  /** 字段路径 */
  path: string;
  /** 字段名称 */
  label: string;
  /** 原始值 */
  oldValue: any;
  /** 新值 */
  newValue: any;
  /** 变更类型 */
  type: 'added' | 'modified' | 'deleted';
}

/**
 * 配置对比属性
 */
export interface ConfigDiffProps {
  /** 原始配置 */
  originalConfig: Record<string, any>;
  /** 新配置 */
  newConfig: Record<string, any>;
  /** 字段标签映射 */
  fieldLabels?: Record<string, string>;
  /** 忽略的字段 */
  ignoreFields?: string[];
  /** 自定义渲染函数 */
  renderValue?: (value: any, field: string) => React.ReactNode;
}

/**
 * 深度比较两个对象，返回变更列表
 */
const getConfigChanges = (
  original: Record<string, any>,
  current: Record<string, any>,
  fieldLabels: Record<string, string> = {},
  ignoreFields: string[] = [],
  prefix = '',
): ConfigChange[] => {
  const changes: ConfigChange[] = [];
  const allKeys = new Set([...Object.keys(original), ...Object.keys(current)]);

  for (const key of allKeys) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    // 跳过忽略的字段
    if (ignoreFields.includes(fullPath)) {
      continue;
    }

    const oldValue = original[key];
    const newValue = current[key];
    const label = fieldLabels[fullPath] || key;

    if (!(key in original)) {
      // 新增字段
      changes.push({
        path: fullPath,
        label,
        oldValue: undefined,
        newValue,
        type: 'added',
      });
    } else if (!(key in current)) {
      // 删除字段
      changes.push({
        path: fullPath,
        label,
        oldValue,
        newValue: undefined,
        type: 'deleted',
      });
    } else if (
      typeof oldValue === 'object' &&
      typeof newValue === 'object' &&
      oldValue !== null &&
      newValue !== null &&
      !Array.isArray(oldValue) &&
      !Array.isArray(newValue)
    ) {
      // 递归比较对象
      changes.push(
        ...getConfigChanges(
          oldValue,
          newValue,
          fieldLabels,
          ignoreFields,
          fullPath,
        ),
      );
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      // 修改字段
      changes.push({
        path: fullPath,
        label,
        oldValue,
        newValue,
        type: 'modified',
      });
    }
  }

  return changes;
};

/**
 * 格式化值显示
 */
const formatValue = (value: any): React.ReactNode => {
  if (value === undefined) {
    return <Text type="secondary">未设置</Text>;
  }

  if (value === null) {
    return <Text type="secondary">null</Text>;
  }

  if (typeof value === 'boolean') {
    return <CustomOutlineTag>{value ? '是' : '否'}</CustomOutlineTag>;
  }

  if (typeof value === 'object') {
    return <Text code>{JSON.stringify(value, null, 2)}</Text>;
  }

  return <Text>{String(value)}</Text>;
};

/**
 * 配置变更摘要组件
 * @description 显示配置变更的详细对比信息


 */
export const ConfigChangeSummary: React.FC<ConfigDiffProps> = ({
  originalConfig,
  newConfig,
  fieldLabels = {},
  ignoreFields = [],
  renderValue = formatValue,
}) => {
  const changes = getConfigChanges(
    originalConfig,
    newConfig,
    fieldLabels,
    ignoreFields,
  );

  if (changes.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">没有配置变更</Text>
        </div>
      </Card>
    );
  }

  const addedChanges = changes.filter((c) => c.type === 'added');
  const modifiedChanges = changes.filter((c) => c.type === 'modified');
  const deletedChanges = changes.filter((c) => c.type === 'deleted');

  return (
    <div>
      {/* 变更统计 */}
      <Card style={{ marginBottom: 16 }}>
        <Title heading={6}>变更统计</Title>
        <div style={{ display: 'flex', gap: 16 }}>
          {addedChanges.length > 0 && (
            <CustomOutlineTag>新增 {addedChanges.length} 项</CustomOutlineTag>
          )}
          {modifiedChanges.length > 0 && (
            <CustomOutlineTag>
              修改 {modifiedChanges.length} 项
            </CustomOutlineTag>
          )}
          {deletedChanges.length > 0 && (
            <CustomOutlineTag>删除 {deletedChanges.length} 项</CustomOutlineTag>
          )}
        </div>
      </Card>

      {/* 新增项 */}
      {addedChanges.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Title heading={6} style={{ color: '#00b42a' }}>
            新增配置项
          </Title>
          <Descriptions
            column={1}
            data={addedChanges.map((change) => ({
              label: change.label,
              value: renderValue(change.newValue, change.path),
            }))}
          />
        </Card>
      )}

      {/* 修改项 */}
      {modifiedChanges.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Title heading={6} style={{ color: '#ff7d00' }}>
            修改配置项
          </Title>
          {modifiedChanges.map((change, index) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <Text bold>{change.label}</Text>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary">原值：</Text>
                  {renderValue(change.oldValue, change.path)}
                </div>
                <div>
                  <Text type="secondary">新值：</Text>
                  {renderValue(change.newValue, change.path)}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* 删除项 */}
      {deletedChanges.length > 0 && (
        <Card>
          <Title heading={6} style={{ color: '#f53f3f' }}>
            删除配置项
          </Title>
          <Descriptions
            column={1}
            data={deletedChanges.map((change) => ({
              label: change.label,
              value: renderValue(change.oldValue, change.path),
            }))}
          />
        </Card>
      )}
    </div>
  );
};

/**
 * 简单配置对比组件
 */
export const ConfigDiff: React.FC<{
  title?: string;
  changes: ConfigChange[];
}> = ({ title = '配置变更', changes }) => {
  if (changes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Text type="secondary">没有配置变更</Text>
      </div>
    );
  }

  // 获取变更类型的显示信息
  const getChangeTypeInfo = (type: ConfigChange['type']) => {
    switch (type) {
      case 'added':
        return { color: 'green', text: '新增' };
      case 'modified':
        return { color: 'orange', text: '修改' };
      case 'deleted':
        return { color: 'red', text: '删除' };
      default:
        return { color: 'gray', text: '未知' };
    }
  };

  return (
    <Card title={title}>
      {changes.map((change, index) => {
        const typeInfo = getChangeTypeInfo(change.type);

        return (
          <div key={index} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CustomOutlineTag>{typeInfo.text}</CustomOutlineTag>
              <Text bold>{change.label}</Text>
            </div>

            {change.type === 'modified' && (
              <div style={{ marginTop: 4, marginLeft: 16 }}>
                <div>
                  <Text type="secondary">原值：</Text>
                  {formatValue(change.oldValue)}
                </div>
                <div>
                  <Text type="secondary">新值：</Text>
                  {formatValue(change.newValue)}
                </div>
              </div>
            )}

            {change.type === 'added' && (
              <div style={{ marginTop: 4, marginLeft: 16 }}>
                <Text type="secondary">值：</Text>
                {formatValue(change.newValue)}
              </div>
            )}

            {change.type === 'deleted' && (
              <div style={{ marginTop: 4, marginLeft: 16 }}>
                <Text type="secondary">原值：</Text>
                {formatValue(change.oldValue)}
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
};

export { getConfigChanges, formatValue };
