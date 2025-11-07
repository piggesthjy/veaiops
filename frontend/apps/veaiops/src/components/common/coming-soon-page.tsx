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
import type React from 'react';

interface ComingSoonPageProps {
  /** 页面标题 */
  title: string;
  /** 自定义描述文本，默认为"功能正在开发中，敬请期待" */
  description?: string;
  /** 自定义图片地址，默认为统一的待开发图片 */
  imgSrc?: string;
  /** 自定义容器样式类名 */
  className?: string;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description = '功能正在开发中，敬请期待',
  imgSrc = '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a0082b7754fbdb2d98a5c18d0b0edd25.png~tplv-uwbnlip3yd-webp.webp',
  className = 'pr-6 pb-6 pl-6',
}) => {
  return (
    <div className={className}>
      <h1 className="text-2xl font-bold text-text mb-4">{title}</h1>
      <Empty description={description} imgSrc={imgSrc} />
    </div>
  );
};

export default ComingSoonPage;
export { ComingSoonPage };
