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

// import type { UserRole } from '@veaiops/types'; // UserRole 类型暂时未定义
/**
 * 智能空值单元格组件
 * 基于 EPS 平台的 SmartEmptyCell 实现
 */
import { CellRender } from '@/cell-render';
import type {
  BaseRecord,
  CellRenderParams,
  EmptyValueConfig,
  EmptyValueContext,
  UserRole,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils';
import { Button, Tooltip } from '@arco-design/web-react';
import { IconEdit, IconLock, IconPlus } from '@arco-design/web-react/icon';
import type React from 'react';
import { type ReactNode, useMemo, useState } from 'react';
import styles from './smart-empty-cell.module.less';

// 解构CellRender组件，避免重复调用
const { CustomOutlineTag } = CellRender;

export interface SmartEmptyCellProps<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 单元格值 */
  value: unknown;
  /** 行数据 */
  record: RecordType;
  /** 字段名 */
  field: string;
  /** 空值配置 */
  emptyConfig: EmptyValueConfig;
  /** 用户角色 */
  userRole: UserRole;
  /** 上下文信息 */
  context: EmptyValueContext;
  /** 显示权限提示 */
  showPermissionHints: boolean;
  /** 启用上下文显示 */
  enableContextualDisplay: boolean;
  /** 点击空值回调 */
  onEmptyValueClick?: (params: CellRenderParams<RecordType>) => void;
  /** 样式类名 */
  className?: string;
  /** 子元素 */
  children?: ReactNode;
}

export const SmartEmptyCell = <RecordType extends BaseRecord = BaseRecord>({
  value,
  record,
  field,
  emptyConfig,
  userRole,
  context,
  showPermissionHints,
  enableContextualDisplay,
  onEmptyValueClick,
  className,
  children,
}: SmartEmptyCellProps<RecordType>): React.ReactElement => {
  const [hover, setHover] = useState(false);

  // 判断是否为空值
  const isEmpty = useMemo(() => {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return true;
    }
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true;
    }
    return false;
  }, [value]);

  // 检查权限
  const hasPermission = useMemo(() => {
    const roles = emptyConfig.permission?.allowedRoles;
    if (!roles) {
      return true;
    }
    return roles.includes(userRole);
  }, [emptyConfig.permission?.allowedRoles, userRole]);

  // 处理点击事件
  const handleClick = () => {
    if (!hasPermission || !emptyConfig.allowEdit) {
      return;
    }

    const params: CellRenderParams<RecordType> = {
      value,
      record,
      field,
      isEmpty,
      context,
      userRole,
    };

    if (onEmptyValueClick) {
      onEmptyValueClick(params);
    } else if (emptyConfig.onClick) {
      emptyConfig.onClick(params as unknown as Record<string, unknown>);
    }

    devLog.log({
      component: 'SmartEmptyCell',
      message: 'Empty cell clicked',
      data: { field, userRole },
    });
  };

  // 渲染空值内容
  const renderEmptyContent = () => {
    const { strategy, text, icon, component: CustomComponent } = emptyConfig;

    // 自定义组件
    if (CustomComponent) {
      return (
        <CustomComponent
          value={value}
          record={record}
          field={field}
          context={context}
          userRole={userRole}
        />
      );
    }

    // 根据策略渲染
    switch (strategy) {
      case 'text':
        return <span className={styles.emptyText}>{text || '--'}</span>;

      case 'placeholder':
        return (
          <span className={styles.placeholder}>
            {hasPermission && emptyConfig.allowEdit ? '点击添加' : text || '--'}
          </span>
        );

      case 'button':
        if (!hasPermission || !emptyConfig.allowEdit) {
          return <span className={styles.emptyText}>{text || '--'}</span>;
        }
        return (
          <Button
            type="text"
            size="small"
            icon={icon || <IconPlus />}
            onClick={handleClick}
            className={styles.addButton}
          >
            {text || '添加'}
          </Button>
        );

      case 'icon':
        return (
          <div className={styles.iconContainer}>
            {icon || <IconPlus />}
            {text && <span className={styles.iconText}>{text}</span>}
          </div>
        );

      case 'contextual':
        if (!enableContextualDisplay) {
          return <span className={styles.emptyText}>{text || '--'}</span>;
        }
        return renderContextualContent();

      case 'hide':
        return null;

      default:
        return <span className={styles.emptyText}>{text || '--'}</span>;
    }
  };

  // 渲染上下文相关内容
  const renderContextualContent = () => {
    const { dataSize, hasRelatedData, isRequired } = context;

    if (isRequired) {
      return <CustomOutlineTag>必填</CustomOutlineTag>;
    }

    if (hasRelatedData) {
      return <span className={styles.contextualHint}>数据关联中...</span>;
    }

    if (dataSize === 'large') {
      return <span className={styles.placeholder}>加载中...</span>;
    }

    return <span className={styles.emptyText}>--</span>;
  };

  // 渲染权限提示
  const renderPermissionHint = () => {
    if (!showPermissionHints || hasPermission || !isEmpty) {
      return null;
    }

    const permissionText = emptyConfig.permission?.hint || '无权限操作';

    return (
      <Tooltip content={permissionText}>
        <div className={styles.permissionHint}>
          <IconLock />
        </div>
      </Tooltip>
    );
  };

  // 渲染编辑提示
  const renderEditHint = () => {
    if (!hasPermission || !emptyConfig.allowEdit || !hover || !isEmpty) {
      return null;
    }

    return (
      <div className={styles.editHint}>
        <IconEdit />
      </div>
    );
  };

  // 如果有值，直接渲染原内容
  if (!isEmpty) {
    return <div className={className}>{children || String(value)}</div>;
  }

  // 渲染空值单元格
  const canClick = hasPermission && emptyConfig.allowEdit;

  return (
    <div
      className={`${styles.smartEmptyCell} ${
        canClick ? styles.clickable : ''
      } ${className || ''}`}
      onClick={canClick ? handleClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={styles.content}>
        {renderEmptyContent()}
        {renderPermissionHint()}
        {renderEditHint()}
      </div>

      {emptyConfig.showTooltip && emptyConfig.tooltip && (
        <Tooltip content={emptyConfig.tooltip}>
          <div className={styles.tooltipTrigger} />
        </Tooltip>
      )}
    </div>
  );
};
