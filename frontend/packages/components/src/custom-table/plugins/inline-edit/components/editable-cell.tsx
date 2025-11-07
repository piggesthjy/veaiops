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

import type {
  BaseRecord,
  CustomEditorProps,
  EditMode,
  EditTrigger,
  FieldEditConfig,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils';
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Message,
  Select,
  Switch,
} from '@arco-design/web-react';
import { IconCheck, IconClose, IconEdit } from '@arco-design/web-react/icon';
/**
 * 可编辑单元格组件
 * 基于 EPS 平台的 EditableCell 实现
 */
import type React from 'react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styles from './editable-cell.module.less';

export interface EditableCellProps<RecordType extends BaseRecord = BaseRecord> {
  /** 单元格值 */
  value: unknown;
  /** 行数据 */
  record: RecordType;
  /** 字段配置 */
  fieldConfig: FieldEditConfig<RecordType>;
  /** 编辑模式 */
  mode: EditMode;
  /** 触发方式 */
  trigger: EditTrigger;
  /** 是否正在编辑 */
  editing: boolean;
  /** 开始编辑 */
  onStartEdit: () => void;
  /** 结束编辑 */
  onFinishEdit: (value: unknown) => Promise<void>;
  /** 取消编辑 */
  onCancelEdit: () => void;
  /** 验证函数 */
  onValidate?: (value: unknown) => Promise<string | null>;
  /** 样式类名 */
  className?: string;
  /** 子元素 */
  children?: ReactNode;
}

export const EditableCell = <RecordType extends BaseRecord = BaseRecord>({
  value,
  record,
  fieldConfig,
  mode,
  trigger,
  editing,
  onStartEdit,
  onFinishEdit,
  onCancelEdit,
  onValidate,
  className,
  children,
}: EditableCellProps<RecordType>): React.ReactElement => {
  const [editValue, setEditValue] = useState<unknown>(value);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<{
    dom: HTMLInputElement;
    focus: () => void;
    blur: () => void;
  }>(null);

  // 开始编辑时初始化值
  useEffect(() => {
    if (editing) {
      setEditValue(value);
      setValidationError(null);
      // 聚焦到输入框
      setTimeout(() => {
        inputRef.current?.dom?.focus();
      }, 0);
    }
  }, [editing, value]);

  // 处理键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editing) {
        return;
      }

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          handleSave();
          break;
        case 'Escape':
          e.preventDefault();
          handleCancel();
          break;
        case 'Tab':
          if (fieldConfig.confirmOnTab) {
            e.preventDefault();
            handleSave();
          }
          break;
        default:
          break;
      }
    },
    [editing, editValue, fieldConfig.confirmOnTab],
  );

  // 处理保存
  const handleSave = useCallback(async () => {
    if (saving || !editing) {
      return;
    }

    try {
      setSaving(true);
      setValidationError(null);

      // 验证
      if (onValidate) {
        setValidating(true);
        const error = await onValidate(editValue);
        if (error) {
          setValidationError(error);
          setValidating(false);
          setSaving(false);
          return;
        }
        setValidating(false);
      }

      // 保存
      await onFinishEdit(editValue);
      devLog.log({
        component: 'EditableCell',
        message: 'Cell edit saved',
        data: {
          field: fieldConfig.dataIndex,
          value: editValue,
        },
      });
    } catch (error) {
      // ✅ 正确：透出实际错误信息
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.error({
        component: 'EditableCell',
        message: 'Failed to save cell edit',
        data: {
          field: fieldConfig.dataIndex,
          error: errorObj,
          errorMessage,
        },
      });
      Message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [
    editValue,
    editing,
    saving,
    onValidate,
    onFinishEdit,
    fieldConfig.dataIndex,
  ]);

  // 处理取消
  const handleCancel = useCallback(() => {
    setEditValue(value);
    setValidationError(null);
    onCancelEdit();
  }, [value, onCancelEdit]);

  // 处理失焦
  const handleBlur = useCallback(() => {
    if (fieldConfig.exitOnBlur && editing && !saving) {
      handleSave();
    }
  }, [editing, saving, fieldConfig.exitOnBlur, handleSave]);

  // 渲染编辑器
  const renderEditor = () => {
    const editorProps: CustomEditorProps<RecordType> = {
      value: editValue,
      record,
      onChange: setEditValue,
      onFinish: handleSave,
      onCancel: handleCancel,
      fieldName: fieldConfig.fieldName,
      rowIndex: 0, // TODO: 从外部传入
      columnIndex: 0, // TODO: 从外部传入
      editorProps: fieldConfig.editor?.props,
    };

    // 自定义编辑器
    if (fieldConfig.editor?.component) {
      const CustomEditor = fieldConfig.editor.component;
      return <CustomEditor {...editorProps} />;
    }

    // 内置编辑器渲染

    switch (fieldConfig.editor?.type || 'input') {
      case 'input':
        return (
          <Input
            ref={inputRef}
            value={
              typeof editValue === 'string' || typeof editValue === 'number'
                ? String(editValue)
                : ''
            }
            onChange={(value: string) => setEditValue(value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            size="small"
            status={validationError ? 'error' : undefined}
            {...fieldConfig.editor?.props}
          />
        );

      case 'number':
        return (
          <InputNumber
            value={typeof editValue === 'number' ? editValue : undefined}
            onChange={(value: number | undefined) => setEditValue(value)}
            onBlur={handleBlur}
            size="small"
            error={Boolean(validationError)}
            {...fieldConfig.editor?.props}
          />
        );

      case 'select':
        return (
          <Select
            value={editValue as string | number | string[] | number[]}
            onChange={(value: unknown) => setEditValue(value)}
            size="small"
            status={validationError ? 'error' : undefined}
            options={
              (fieldConfig.editor?.options as Array<
                | string
                | number
                | {
                    label: React.ReactNode;
                    value: string | number;
                    disabled?: boolean;
                    extra?: unknown;
                  }
              >) || []
            }
            {...fieldConfig.editor?.props}
          />
        );

      case 'date':
        return (
          <DatePicker
            value={editValue as string | number | Date | undefined}
            onChange={(value: unknown) => setEditValue(value)}
            size="small"
            status={validationError ? 'error' : undefined}
            style={{ width: '100%' }}
            {...fieldConfig.editor?.props}
          />
        );

      case 'switch':
        return (
          <Switch
            checked={Boolean(editValue)}
            onChange={setEditValue}
            size="small"
            {...fieldConfig.editor?.props}
          />
        );

      default:
        return (
          <Input
            ref={inputRef}
            value={
              typeof editValue === 'string' || typeof editValue === 'number'
                ? String(editValue)
                : ''
            }
            onChange={(value: string) => setEditValue(value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            size="small"
            status={validationError ? 'error' : undefined}
            {...fieldConfig.editor?.props}
          />
        );
    }
  };

  // 渲染操作按钮
  const renderActions = () => {
    if (mode === 'cell' && editing) {
      return (
        <div className={styles.cellActions}>
          <Button
            type="text"
            size="mini"
            icon={<IconCheck />}
            loading={saving || validating}
            onClick={handleSave}
            className={styles.saveBtn}
          />
          <Button
            type="text"
            size="mini"
            icon={<IconClose />}
            onClick={handleCancel}
            className={styles.cancelBtn}
          />
        </div>
      );
    }
    return null;
  };

  // 渲染编辑触发器
  const renderTrigger = () => {
    if (editing || !fieldConfig.showEditIcon) {
      return null;
    }

    return <IconEdit className={styles.editIcon} onClick={onStartEdit} />;
  };

  // 编辑状态
  if (editing) {
    return (
      <div
        className={`${styles.editableCell} ${styles.editing} ${
          className || ''
        }`}
      >
        <div className={styles.editorWrapper}>
          {renderEditor()}
          {renderActions()}
        </div>
        {validationError && (
          <div className={styles.validationError}>{validationError}</div>
        )}
      </div>
    );
  }

  // 状态
  const handleTriggerEdit = () => {
    if (fieldConfig.disabled || fieldConfig.readOnly) {
      return;
    }

    if (trigger === 'doubleClick') {
      // 双击触发在父组件处理
      return;
    }

    onStartEdit();
  };

  return (
    <div
      className={`${styles.editableCell} ${className || ''}`}
      onClick={trigger === 'click' ? handleTriggerEdit : undefined}
      onDoubleClick={trigger === 'doubleClick' ? handleTriggerEdit : undefined}
    >
      <div className={styles.displayValue}>
        {children ||
          (typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : '')}
      </div>
      {renderTrigger()}
    </div>
  );
};
