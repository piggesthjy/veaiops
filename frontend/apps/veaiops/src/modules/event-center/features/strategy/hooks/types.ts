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

import type { InformStrategy } from 'api-generate';

// ✅ 根据 .cursorrules 规范：优先使用 api-generate 中的类型（单一数据源原则）
// 直接使用 InformStrategy，无需类型别名
// 从 Python 源码分析：API 返回 InformStrategyVO，对应 TypeScript 的 InformStrategy
