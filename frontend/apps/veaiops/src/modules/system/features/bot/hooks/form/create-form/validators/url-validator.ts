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

/**
 * URL 验证器
 */
export const urlValidator = (
  value: string,
  callback: (error?: string) => void,
): void => {
  if (!value) {
    callback();
    return;
  }
  try {
    /**
     * 为什么使用 new URL()：
     * - URL 构造函数是验证 URL 格式的标准方法，没有其他替代方案
     * - 使用 try-catch 包装以确保类型安全
     * - 虽然使用 new 操作符，但仅用于验证，没有实际副作用
     */
    const _url = new URL(value);
    // 验证通过后调用成功回调
    callback();
  } catch {
    callback('请输入有效的URL');
  }
};
