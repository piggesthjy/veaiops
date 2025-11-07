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

import { startLogCollection } from '@veaiops/utils';
import { useEffect } from 'react';

/**
 * 全局日志收集 Hook
 * 在页面加载时自动开始收集日志
 * 并提供日志导出功能
 */
export const useGlobalLogCollection = () => {
  useEffect(() => {
    // 页面加载时自动开始收集日志
    startLogCollection();

    // 清理函数：如果需要可以在这里添加停止日志收集的逻辑
    return () => {
      // 可选：页面卸载时停止收集
      // stopLogCollection();
    };
  }, []);
};
