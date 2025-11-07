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
 * 卡片模版管理页面入口
 * @description 页面入口，实际实现位于 modules/system/features/card-template
 */

// ✅ 修复循环依赖：index.tsx 已重命名为 page.tsx
export { default } from './page';
// 配置导出
export * from './config';
// Hooks导出
export * from './hooks';
// 子组件导出
export * from './components';
