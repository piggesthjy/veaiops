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

import type { PerformNativeUrlUpdateParams } from './types';

/**
 * URL 操作辅助函数
 */

/**
 * 执行原生URL更新
 */
export function performNativeUrlUpdate({
  newUrl,
  expectedSearch,
  _beforeUpdate,
}: PerformNativeUrlUpdateParams): void {
  try {
    window.history.pushState(window.history.state, '', newUrl);
    window.history.replaceState(window.history.state, '', newUrl);

    // 使用setTimeout确保URL更新完成
    setTimeout(() => {
      const { search: afterUpdateSearch } = window.location;
      const updateSuccess = afterUpdateSearch === expectedSearch;

      if (!updateSuccess) {
        performLocationSearchUpdate(expectedSearch);
      }
    }, 50);
  } catch (_historyError) {
    // 静默处理错误
  }
}

/**
 * 直接修改location.search
 */
export function performLocationSearchUpdate(expectedSearch: string): void {
  try {
    // 尝试多种方法强制更新URL
    const { href: currentUrl } = window.location;
    const baseUrl = currentUrl.split('?')[0].split('#')[0];
    const { hash } = window.location;
    const newFullUrl = `${baseUrl}${expectedSearch}${hash}`;

    // 方法1: 直接修改location.search
    window.location.search = expectedSearch.replace('?', '');

    // 方法2: 使用location.href
    setTimeout(() => {
      const { search } = window.location;
      if (search !== expectedSearch) {
        window.location.href = newFullUrl;
      }
    }, 10);

    // 方法3: 使用location.replace (不会在历史记录中留下记录)
    setTimeout(() => {
      const { search } = window.location;
      if (search !== expectedSearch) {
        window.location.replace(newFullUrl);
      }
    }, 20);
  } catch (_locationError) {
    // 静默处理错误
  }
}
