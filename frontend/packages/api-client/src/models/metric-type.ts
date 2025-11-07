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
/**
 * Metric type enumeration
 */
export enum MetricType {
  SELF_DEFINED = 'SelfDefined',
  SUCCESS_RATE = 'SuccessRate',
  SUCCESS_RATE100 = 'SuccessRate100',
  ERROR_RATE = 'ErrorRate',
  ERROR_RATE100 = 'ErrorRate100',
  COUNTER_RATE = 'CounterRate',
  COUNT = 'Count',
  ERROR_COUNT = 'ErrorCount',
  FATAL_ERROR_COUNT = 'FatalErrorCount',
  LATENCY = 'Latency',
  LATENCY_SECOND = 'LatencySecond',
  LATENCY_MICROSECOND = 'LatencyMicrosecond',
  RESOURCE_UTILIZATION_RATE = 'ResourceUtilizationRate',
  RESOURCE_UTILIZATION_RATE100 = 'ResourceUtilizationRate100',
  CPUUSED_CORE = 'CPUUsedCore',
  MEMORY_USED_BYTES = 'MemoryUsedBytes',
  THROUGHPUT = 'Throughput',
}
