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
 * CustomTable 枚举类型定义
 * 从 constants/enum.ts 迁移而来
 */

/**
 * 插件名称枚举
 */
export enum PluginNames {
  DATA_SOURCE = 'data-source',
  TABLE_FILTER = 'table-filter',
  TABLE_COLUMNS = 'table-columns',
  TABLE_PAGINATION = 'table-pagination',
  TABLE_SORTING = 'table-sorting',
  TABLE_ALERT = 'table-alert',
  CUSTOM_LOADING = 'custom-loading',
  TABLE_SEARCH = 'table-search',
  COLUMN_WIDTH_PERSISTENCE = 'column-width-persistence',
  CUSTOM_FIELDS = 'custom-fields',
  CUSTOM_FILTER_SETTING = 'custom-filter-setting',
  ROW_SELECTION = 'row-selection',
  DRAG_SORT = 'drag-sort',
  COLUMN_FREEZE = 'column-freeze',
  TABLE_EXPAND = 'table-expand',
  VIRTUAL_SCROLL = 'virtual-scroll',
  TABLE_TOOLBAR = 'table-toolbar',
  INLINE_EDIT = 'inline-edit',
  SMART_CELL = 'smart-cell',
}

// PluginPriority 已在 core/enums.ts 中通过 export type 导出，此处移除避免重复
// 如需使用，请从 '@/custom-table/types/core' 或 '@/custom-table/types' 导入

/**
 * 插件方法名称枚举
 */
export enum PluginMethods {
  // data-source 插件方法
  LOAD_DATA = 'loadData',
  RESET_DATA = 'resetData',
  LOAD_MORE = 'loadMore',

  // table-filter 插件方法
  RESET_FILTERS = 'resetFilters',

  // table-columns 插件方法
  GET_COLUMNS = 'getColumns',
  RESET_COLUMNS = 'resetColumns',
  FILTER_COLUMNS = 'filterColumns',

  // table-pagination 插件方法
  GET_PAGINATION_INFO = 'getPaginationInfo',
  GET_PAGINATION_CONFIG = 'getPaginationConfig',
  RESET_PAGINATION = 'resetPagination',

  // table-sorting 插件方法
  GET_SORTER_INFO = 'getSorterInfo',
  GET_SORTER_PARAM = 'getSorterParam',
  RESET_SORTER = 'resetSorter',
  ON_SORTER_CHANGE = 'onSorterChange',

  // table-alert 插件方法
  SHOW_ALERT = 'showAlert',
  HIDE_ALERT = 'hideAlert',

  // custom-loading 插件方法
  SHOW_LOADING = 'showLoading',
  HIDE_LOADING = 'hideLoading',
  SET_LOADING_TIP = 'setLoadingTip',

  // table-toolbar 插件方法
  GET_TOOLBAR_CONFIG = 'getToolbarConfig',
  RENDER_TOOLBAR = 'renderToolbar',

  // table-search 插件方法
  SET_SEARCH_VALUE = 'setSearchValue',
  CLEAR_SEARCH = 'clearSearch',
  HANDLE_SEARCH = 'handleSearch',

  // row-selection 插件方法
  SELECT_ROW = 'selectRow',
  SELECT_ALL = 'selectAll',
  CLEAR_SELECTION = 'clearSelection',
  GET_SELECTED_ROWS = 'getSelectedRows',

  // column-width-persistence 插件方法
  GET_PERSISTENT_WIDTHS = 'getPersistentWidths',
  SET_PERSISTENT_WIDTH = 'setPersistentWidth',
  SET_BATCH_PERSISTENT_WIDTHS = 'setBatchPersistentWidths',
  CLEAR_PERSISTENT_WIDTHS = 'clearPersistentWidths',
  DETECT_COLUMN_WIDTHS = 'detectColumnWidths',
  APPLY_PERSISTENT_WIDTHS = 'applyPersistentWidths',
}

/**
 * 渲染器名称枚举
 */
export enum RendererNames {
  // data-source 渲染器
  EMPTY_STATE = 'emptyState',
  ERROR_STATE = 'errorState',
  LOAD_MORE_BUTTON = 'loadMoreButton',

  // table-filter 渲染器
  FILTER = 'filter',

  // table-pagination 渲染器
  PAGINATION = 'pagination',

  // table-alert 渲染器
  ALERT = 'alert',

  // custom-loading 渲染器
  LOADING = 'loading',
  LOADING_OVERLAY = 'loadingOverlay',

  // table-toolbar 渲染器
  TOOLBAR = 'toolbar',
  TOOLBAR_LEFT = 'toolbarLeft',
  TOOLBAR_RIGHT = 'toolbarRight',

  // table-search 渲染器
  SEARCH = 'search',
  SEARCH_INPUT = 'searchInput',
  SEARCH_BUTTON = 'searchButton',

  // row-selection 渲染器
  SELECTION_CHECKBOX = 'selectionCheckbox',
  SELECTION_COLUMN = 'selectionColumn',
  BATCH_ACTIONS = 'batchActions',
}
