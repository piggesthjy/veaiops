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

import { useCallback } from 'react';

/**
 * 管理刷新 Hook
 * 提供统一的刷新管理功能
 */
export interface UseManagementRefreshReturn {
  refresh: () => void;
  afterCreate: () => void;
  afterUpdate: () => void;
  afterDelete: () => void;
}

export const useManagementRefresh = (
  refreshTable?: () => void,
): UseManagementRefreshReturn => {
  const refresh = useCallback(() => {
    if (refreshTable) {
      refreshTable();
    }
  }, [refreshTable]);

  const afterCreate = useCallback(() => {
    refresh();
  }, [refresh]);

  const afterUpdate = useCallback(() => {
    refresh();
  }, [refresh]);

  const afterDelete = useCallback(() => {
    refresh();
  }, [refresh]);

  return {
    refresh,
    afterCreate,
    afterUpdate,
    afterDelete,
  };
};
