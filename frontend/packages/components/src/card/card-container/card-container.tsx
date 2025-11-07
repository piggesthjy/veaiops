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

import { Empty } from '@arco-design/web-react';
import type { FC, PropsWithChildren } from 'react';

const CardContainer: FC<
  PropsWithChildren<{
    height?: number;
    className?: string;
    dataTestid?: string;
    isEmpty?: boolean;
    emptyDescription?: string;
  }>
> = ({
  children,
  className = '',
  height = 434,
  dataTestid,
  isEmpty = false,
  emptyDescription = '暂无数据',
}) => (
  <div
    className={`p-5 bg-white box-border flex flex-col border border-gray-200 overflow-hidden ${className}`}
    style={{ height, borderRadius: 10 }}
    data-testid={dataTestid}
  >
    {isEmpty ? (
      <div className="flex-1 flex items-center justify-center">
        <Empty description={emptyDescription} />
      </div>
    ) : (
      children
    )}
  </div>
);

export { CardContainer };
