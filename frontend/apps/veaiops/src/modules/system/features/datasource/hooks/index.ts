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

// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export { useMonitorAccessLogic } from './use-monitor-access-logic';
export { useMonitorActionConfig } from './use-monitor-action-config';

// 导出新的 useMonitorTableConfig（使用 ModernTableColumnProps 和 HandleFilterProps）
export {
  useMonitorTableConfig,
  type UseMonitorTableConfigOptions,
  type UseMonitorTableConfigReturn,
} from './use-monitor-table-config';

// 数据源处理器 Hook
export { useDataSourceHandlers } from './use-data-source-handlers';

// 从迁移的 hooks 文件导出
export {
  useDataSourceManagement,
  useZabbixDataSource,
  useAliyunDataSource,
  useVolcengineDataSource,
  useDetailView,
} from './hooks';
