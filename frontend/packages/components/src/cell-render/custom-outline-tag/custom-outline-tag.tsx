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

import type { TagProps } from '@arco-design/web-react/es/Tag/interface';
import { EMPTY_CONTENT, EMPTY_CONTENT_TEXT } from '@veaiops/constants';
import type React from 'react';
import {
  TagEllipsis,
  type TagEllipsisData,
} from '../tag-ellipsis/tag-ellipsis';
import styles from './index.module.less';

/**
 * 自定义Outline Tag组件属性接口
 */
export interface CustomOutlineTagProps extends Omit<TagProps, 'color'> {
  /**
   * 标签文本内容
   */
  children: React.ReactNode;
  /**
   * 颜色主题，支持预定义的数据颜色
   */
  colorTheme?:
    | 'data-1'
    | 'data-2'
    | 'data-3'
    | 'data-4'
    | 'data-5'
    | 'data-6'
    | 'data-7'
    | 'data-8'
    | 'data-9'
    | 'data-10'
    | 'data-11'
    | 'data-12'
    | 'data-13'
    | 'data-14'
    | 'data-15'
    | 'data-16'
    | 'data-17'
    | 'data-18'
    | 'data-19'
    | 'data-20';
  /**
   * 是否启用椭圆省略
   */
  ellipsis?: boolean;
  /**
   * 最大宽度
   */
  maxWidth?: string | number;
}

/**
 * 自定义Outline Tag组件
 * 支持outline样式和椭圆省略功能
 */
export const CustomOutlineTag: React.FC<CustomOutlineTagProps> = ({
  children,
  colorTheme,
  ellipsis = false, // 默认不启用省略号，避免重要信息被截断
  maxWidth = 'auto', // 默认自动宽度，让内容完整显示
  className = '',
  style = {},
  ...restProps
}) => {
  if (!children) {
    return EMPTY_CONTENT;
  }
  const tagClassName = [
    'arco-tag',
    'arco-tag-checked',
    'arco-tag-size-default',
    'rd-tag',
    'rd-tag-outline',
    styles.customOutlineTag,
    colorTheme ? styles[`theme-${colorTheme}`] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tagStyle = {
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
    ...style,
  };

  return (
    <div className={tagClassName} style={tagStyle} {...restProps}>
      <span className="arco-tag-content">
        <div className={styles.tagContent}>
          {ellipsis ? (
            <div className={styles.ellipsisWrapper}>
              <div className={styles.ellipsisContentMirror}>
                <span className="arco-ellipsis-text">{children}</span>
              </div>
              <div className={styles.ellipsisContent}>
                <span className="arco-ellipsis-text">{children}</span>
              </div>
            </div>
          ) : (
            <span>{children}</span>
          )}
        </div>
      </span>
    </div>
  );
};

/**
 * 多标签渲染组件属性接口
 */
export interface CustomOutlineTagListProps {
  /**
   * 标签数据列表
   */
  dataList: Array<{
    name: string;
    key?: string;
    colorTheme?: CustomOutlineTagProps['colorTheme'];
  }>;
  /**
   * 最大显示数量
   */
  maxCount?: number;
  /**
   * 标签属性
   */
  tagProps?: Partial<CustomOutlineTagProps>;
  /**
   * 是否使用省略模式
   */
  useEllipsis?: boolean;
  /**
   * ellipsis 模式下的额外配置
   */
  ellipsisConfig?: {
    ellipsisOption?: any;
    ellipsisTextStyle?: React.CSSProperties;
    ellipsisListStyle?: React.CSSProperties;
  };
}

/**
 * 多标签渲染组件
 * 支持最大数量限制和省略显示
 */
// 为了向后兼容，创建别名
export const CustomOutlineTagRender = CustomOutlineTag;

export const CustomOutlineTagList: React.FC<CustomOutlineTagListProps> = ({
  dataList = [],
  maxCount = 2,
  tagProps = {},
  useEllipsis = false,
  ellipsisConfig = {},
}) => {
  if (!dataList.length) {
    return (
      <span style={{ color: 'var(--color-text-4)' }}>{EMPTY_CONTENT_TEXT}</span>
    );
  }

  // 如果使用省略模式，则调用 TagEllipsis 组件
  if (useEllipsis) {
    // 转换数据格式为 TagEllipsis 期望的格式
    const tagEllipsisData: TagEllipsisData[] = dataList.map((item) => ({
      name: item.name,
      // 可以根据需要添加其他字段
    }));

    return (
      <TagEllipsis
        dataList={tagEllipsisData}
        maxCount={maxCount}
        tagProps={tagProps}
        {...ellipsisConfig}
      />
    );
  }

  // 原有的简单实现
  const displayList = dataList.slice(0, maxCount);
  const remainingCount = dataList.length - maxCount;

  return (
    <div className={styles.tagList}>
      {displayList.map((item, index) => (
        <CustomOutlineTag
          key={item.key || item.name || `tag-${index}`}
          colorTheme={item.colorTheme}
          {...tagProps}
        >
          {item.name}
        </CustomOutlineTag>
      ))}
      {remainingCount > 0 && (
        <CustomOutlineTag {...tagProps}>+{remainingCount}</CustomOutlineTag>
      )}
    </div>
  );
};
