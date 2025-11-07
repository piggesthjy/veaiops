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

/* generated using openapi-typescript-codegen -- do not edit */
export type BaseTimeseriesRequestPayload = {
  /**
   * Datasource ID
   */
  datasource_id: string;
  /**
   * Start time in seconds since epoch
   */
  start_time?: number | null;
  /**
   * End time in seconds since epoch
   */
  end_time?: number | null;
  /**
   * Time series data aggregation period
   */
  period?: string;
  /**
   * List of instance filters
   */
  instances?: Array<Record<string, string>> | null;
};
