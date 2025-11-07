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

import { Popover } from '@arco-design/web-react';
import { IconQuestionCircle } from '@arco-design/web-react/icon';
import type { ReactNode } from 'react';

import styles from './index.module.less';

export type TipProps = {
  /** tip提示的内容 */
  content?: ReactNode;
  /** 组件的尺寸 */
  size?: string;
  /** 组件的样式名文件 */
  className?: string;
};

export const Tip = (props: TipProps) => {
  const { content, size, className = '' } = props;
  return (
    <Popover content={content} style={{ maxWidth: 420 }}>
      <IconQuestionCircle
        className={`${className} ${styles.tip} ${size || ''}`}
      />
    </Popover>
  );
};
