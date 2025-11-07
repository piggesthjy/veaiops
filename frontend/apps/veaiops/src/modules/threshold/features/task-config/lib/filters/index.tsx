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

import type { BaseQuery, FieldItem, HandleFilterProps } from "@veaiops/components";
import { createAutoUpdateFilter } from "./auto-update";
import { createCreateTimeRangeFilter } from "./create-time-range";
import { createDatasourceTypeFilter } from "./datasource-type";
import { createProjectsFilter } from "./projects";
import { createTaskNameFilter } from "./task-name";
import type { TaskFiltersQuery } from "./types";
import { createUpdateTimeRangeFilter } from "./update-time-range";

/**
 * Intelligent threshold task table filter configuration
 * Implemented following CustomTable's handleFilters pattern
 *
 * Note: This function should be a pure function without side effects (such as store updates)
 * Store synchronization logic should be handled in the caller using useEffect
 */
export const getTaskFilters = (
  props: HandleFilterProps<TaskFiltersQuery & BaseQuery>,
): FieldItem[] => {
  return [
    createTaskNameFilter(props),
    createDatasourceTypeFilter(props),
    createProjectsFilter(props),
    createAutoUpdateFilter(props),
    createCreateTimeRangeFilter(props),
    createUpdateTimeRangeFilter(props),
  ];
};

// Export types
export type { TaskFiltersQuery } from "./types";
