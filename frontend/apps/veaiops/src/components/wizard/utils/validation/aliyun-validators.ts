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
 * 阿里云数据验证工具
 * @description 提供阿里云相关的数据验证功能
 * @author AI Assistant
 * @date 2025-01-16
 */

/**
 * 验证连接ID格式
 * @param connectId 连接ID
 * @returns 是否为有效的MongoDB ObjectId格式
 */
export const validateConnectId = (connectId: string): boolean => {
  if (!connectId) {
    return false;
  }

  // 必须是24位十六进制字符串（MongoDB ObjectId格式）
  if (connectId.length !== 24) {
    return false;
  }

  // 检查是否为有效的十六进制字符串
  if (!/^[0-9a-fA-F]{24}$/.test(connectId)) {
    return false;
  }

  return true;
};

/**
 * 验证连接ID并返回错误信息
 * @param connectId 连接ID
 * @returns 验证结果和错误信息
 */
export const validateConnectIdWithMessage = (
  connectId: string,
): {
  isValid: boolean;
  errorMessage?: string;
} => {
  if (!connectId) {
    return {
      isValid: false,
      errorMessage: '连接ID不能为空',
    };
  }

  if (connectId.length !== 24) {
    return {
      isValid: false,
      errorMessage: '连接ID长度必须为24位',
    };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(connectId)) {
    return {
      isValid: false,
      errorMessage: '连接ID必须为有效的十六进制字符串',
    };
  }

  return {
    isValid: true,
  };
};
