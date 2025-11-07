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
 * 路由配置统一导出文件（已废弃）
 *
 * ⚠️ 警告：此文件已废弃，不再使用
 *
 * 原因：此文件是多余的中间层，会导致循环引用：
 * 1. config/index.ts 导出 export * from './routes' → routes.tsx
 * 2. routes.tsx 导出 routesConfig from './routes' → routes/index.ts
 * 3. routes/index.ts 导入模块路由 → 可能通过 config/index.ts 造成循环
 *
 * 解决方案：
 * - config/index.ts 现在直接从 './routes/index' 导出 routesConfig
 * - 所有使用方应该从 '@/config/routes' 或 '@/config/routes/index' 导入
 * - 此文件保留仅用于向后兼容，但实际应该删除
 *
 * @deprecated 请使用 routes/index.ts 或通过 config/index.ts 导入
 */

// 重新导出 routes/index.ts，保持向后兼容
// 但建议使用方直接导入 routes/index.ts
export type { RouteConfig, RouteUtils } from '../types/route';
export { routesConfig } from './routes/index';
