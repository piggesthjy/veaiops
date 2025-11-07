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

export interface WaitForNextElementParams {
  selector: string;
}

/**
 * 等待下一个元素出现的辅助函数
 */
export const waitForNextElement = async ({
  selector,
}: WaitForNextElementParams): Promise<boolean> => {
  // 主动等待下一个元素出现，最多等待5秒
  const nextElementWaitStart = Date.now();

  while (Date.now() - nextElementWaitStart < 5000) {
    const nextElements = document.querySelectorAll(selector);

    if (nextElements.length > 0) {
      return true;
    }

    // 每100ms检查一次
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
};

export interface WaitForPageReadyParams {
  maxWaitTime?: number;
}

/**
 * 智能等待页面加载完成
 */
export const waitForPageReady = ({
  maxWaitTime = 2000,
}: WaitForPageReadyParams = {}): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkReady = () => {
      // 检查页面是否已加载完成
      if (document.readyState === 'complete') {
        resolve(true);
        return;
      }

      // 检查是否超时
      if (Date.now() - startTime >= maxWaitTime) {
        resolve(false); // 超时返回 false
        return;
      }

      // 继续检查
      setTimeout(checkReady, 100);
    };

    checkReady();
  });
};
