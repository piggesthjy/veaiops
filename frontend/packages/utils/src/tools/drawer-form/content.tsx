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

import { Spin } from '@arco-design/web-react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useMemo } from 'react';

/**
 * 抽屉表单内容包装组件属性
 */
export interface DrawerFormContentProps {
  /**
   * 加载状态
   */
  loading?: boolean;

  /**
   * Loading 提示文本
   * @default '提交中...'
   */
  loadingTip?: string;

  /**
   * 子元素
   */
  children: ReactNode;

  /**
   * 自定义样式
   */
  style?: React.CSSProperties;

  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 抽屉表单内容包装组件
 *
 * 使用 Arco Design 的 Spin 组件（block 形态）包裹抽屉表单内容，
 * 在表单提交时显示 loading 状态，阻止用户操作。
 *
 * @example
 * ```tsx
 * const { submitting, handleSubmit } = useDrawerFormSubmit({
 *   form,
 *   onSubmit: async (values) => {
 *     return await api.createProject(values);
 *   },
 * });
 *
 * <Drawer>
 *   <DrawerFormContent loading={submitting}>
 *     <Form form={form}>
 *       <Form.Item field="name">...</Form.Item>
 *     </Form>
 *   </DrawerFormContent>
 * </Drawer>
 * ```
 */
export const DrawerFormContent: React.FC<
  PropsWithChildren<DrawerFormContentProps>
> = ({
  loading = false,
  loadingTip = '提交中...',
  children,
  style,
  className,
}) => {
  // 使用 useMemo 稳定化 Spin 组件的 style，避免不必要的重新渲染
  const spinStyle = useMemo<React.CSSProperties>(
    () => ({
      width: '100%',
      minHeight: '200px',
      ...style,
    }),
    [style],
  );

  return (
    <Spin
      block
      loading={loading}
      tip={loadingTip}
      style={spinStyle}
      className={className}
    >
      {children}
    </Spin>
  );
};
