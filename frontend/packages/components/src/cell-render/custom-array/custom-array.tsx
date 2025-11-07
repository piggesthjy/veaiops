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

// React
import { Button } from '@arco-design/web-react';
import { isEmpty } from 'lodash-es';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';

import { EMPTY_CONTENT } from '@veaiops/constants';

import './index.module.less';
import { IconDoubleDown, IconDoubleUp } from '@arco-design/web-react/icon';

// 定义组件属性类型
interface BatchArrayRenderProps<T> {
  data: T[]; // 数据数组
  renderItem: (item: T, index: number) => ReactNode; // 渲染每个数组元素的函数
  emptyContent?: JSX.Element; // 空内容的占位元素
  direction?: 'vertical' | 'horizontal'; // 排列方向，可选值为 'vertical' 或 'horizontal'
  wrap?: boolean; // 是否换行，仅在 direction 为 'horizontal' 时生效
  maxDisplay?: number; // 最大展示数量
  style?: CSSProperties;
  className?: string;
}

// 批量数组渲染组件
const CustomBatchRender = <T extends ReactNode>({
  data,
  renderItem = (item) => item,
  emptyContent = EMPTY_CONTENT,
  direction = 'horizontal',
  wrap = true,
  maxDisplay = 10,
  style = {},
  className,
}: BatchArrayRenderProps<T>) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayData = useMemo(
    () => (isExpanded ? data : data?.slice(0, maxDisplay)),
    [isExpanded, data, maxDisplay],
  );

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderContent = () => {
    if (isEmpty(displayData)) {
      return emptyContent;
    }

    return (
      <div className={'flex flex-col gap-[5px]'}>
        {displayData.map((item: T, index: number) => (
          <div key={`item-${index}`} className={`item-${index}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  };

  const flexStyle: CSSProperties = {
    display: 'flex',
    width: '100%',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    flexWrap: direction === 'horizontal' && wrap ? 'wrap' : 'nowrap',
    gap: '5px',
    ...style,
  };

  return (
    <div className={className} style={flexStyle}>
      {renderContent()}
      {data?.length > maxDisplay && (
        <span>
          <Button
            type={'text'}
            style={{ height: 15 }}
            onClick={handleToggleExpand}
          >
            {isExpanded ? <IconDoubleUp /> : <IconDoubleDown />}
          </Button>
        </span>
      )}
    </div>
  );
};

export { CustomBatchRender };
