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

// 页面组件
export { DetailModal } from './components/modals/detail-modal';
export { default as MonitorTable } from './components/tables/monitor-table';
export * from './pages/management';

// 图标组件
export {
  AliyunIcon,
  getDataSourceIcon,
  MonitorIcon,
  VolcengineIcon,
  ZabbixIcon,
} from './components/icons';

// 表格列配置
export {
  getAliyunColumns,
  getCommonColumns,
  getVolcengineColumns,
  getZabbixColumns,
} from './components/tables/columns';

// 渲染器
export * from './components/renderers';
