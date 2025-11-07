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

// 智能阈值模块导出 - 新架构

// 功能模块导出
export * from './features';

// 导出共享资源（包含 PushHistory 组件等）
// 注意：PushHistoryManager 从 shared 导出，features/history 只是重新导出，避免重复导出
export * from './shared';
