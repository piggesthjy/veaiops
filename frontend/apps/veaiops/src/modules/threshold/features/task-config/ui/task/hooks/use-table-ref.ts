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

import type { TaskFiltersQuery } from '@task-config/lib/filters';
import type { BaseQuery, CustomTableActionType } from '@veaiops/components';
import type { IntelligentThresholdTask } from 'api-generate';
import { useImperativeHandle } from 'react';
import type { TaskTableRef } from '../types';

interface UseTableRefParams {
  operations: {
    delete: (id: string) => Promise<boolean>;
    update: () => Promise<{ success: boolean; error?: Error }>;
    create?: (data: unknown) => Promise<{ success: boolean; error?: Error }>;
  };
}

/**
 * Hook to expose refresh function and auto-refresh operations to parent component
 */
export const useTableRef = (
  ref: React.ForwardedRef<TaskTableRef>,
  customTableRef: React.RefObject<
    CustomTableActionType<
      IntelligentThresholdTask,
      TaskFiltersQuery & BaseQuery
    >
  >,
  { operations }: UseTableRefParams,
) => {
  useImperativeHandle(
    ref,
    () => ({
      // Use CustomTable's refresh method
      refresh: async () => {
        if (customTableRef.current?.refresh) {
          await customTableRef.current.refresh();
          return { success: true };
        }
        return {
          success: false,
          error: new Error('CustomTable ref is not ready'),
        };
      },
      operations,
    }),
    [operations],
  );
};
