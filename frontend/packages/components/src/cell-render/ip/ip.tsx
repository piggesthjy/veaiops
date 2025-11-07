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

// React 相关
import type { FC } from 'react'; // 导入React的函数组件类型

// 单元格渲染函数
import {} from '@arco-design/web-react';
import { CustomOutlineTagRender } from '../custom-outline-tag/custom-outline-tag'; // 直接导入组件，避免循环依赖
import { EllipsisRender } from '../ellipsis/ellipsis';

// 样式相关
import styles from './index.module.less'; // 导入省略号渲染函数

// 使用直接导入的组件，避免循环依赖
const CustomOutlineTag = CustomOutlineTagRender; // 导入样式

const commonProps = {
  style: { display: 'flex', maxWidth: 250, alignItems: 'center' },
};

const IpsCellInfo: FC<{
  Ip: string;
  IpV6: string;
}> = ({ Ip, IpV6 }) => (
  <div className={`flex flex-col gap-1 ${styles.ipComposition}`}>
    <div className={'flex gap-1 items-start'}>
      <CustomOutlineTag>V4</CustomOutlineTag>
      <EllipsisRender text={Ip} {...commonProps} options={{ rows: 2 }} />
    </div>
    <div className={'flex gap-1 items-start'}>
      <CustomOutlineTag>V6</CustomOutlineTag>
      <EllipsisRender text={IpV6} {...commonProps} />
    </div>
  </div>
);

export { IpsCellInfo };
