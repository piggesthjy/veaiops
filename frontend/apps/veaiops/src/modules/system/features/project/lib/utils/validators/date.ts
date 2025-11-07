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
 * 验证日期格式
 */
export const validateDate = (dateString: string): boolean => {
  if (!dateString) {
    return true; // 可选字段
  }

  const date = new Date(dateString);
  return !Number.isNaN(date.getTime());
};

/**
 * 验证日期范围
 */
export const validateDateRange = (
  startDate: string,
  endDate: string,
): boolean => {
  if (!startDate || !endDate) {
    return true; // 可选字段
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= end;
};
