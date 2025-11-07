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

import { IconSearch } from '@arco-design/web-react/icon';
import type React from 'react';
import '../../styles/components/default-footer.less';

import type { DefaultStreamFooterProps } from '@/custom-table/types';

/**
 * 默认表格底部加载更多/继续搜索按钮
 */
const DefaultStreamFooter: React.FC<DefaultStreamFooterProps> = ({
  hasMoreData = false,
  needContinue = false,
  onLoadMore,
}) => {
  if (!hasMoreData) {
    return null;
  }

  return (
    <div
      className="w-full text-center custom-table-footer"
      onClick={onLoadMore}
    >
      <IconSearch />
      {needContinue ? '继续搜索更多数据' : '加载更多'}
    </div>
  );
};

export { DefaultStreamFooter };
