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

import { authConfig } from '@/config/auth';
import apiClient from '@/utils/api-client';
import { authErrorHandler } from '@/utils/error-handler';
import { Form, type FormInstance, Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import type { APIResponseLoginToken, LoginRequest } from 'api-generate';
import { useState } from 'react';

type LoginFormData = LoginRequest;

export const useLogin = (): {
  form: FormInstance<LoginFormData>;
  loading: boolean;
  handleSubmit: (
    values: LoginFormData,
  ) => Promise<{ success: boolean; error?: Error }>;
} => {
  const [form] = Form.useForm<LoginFormData>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    values: LoginFormData,
  ): Promise<{ success: boolean; error?: Error }> => {
    setLoading(true);
    try {
      const response: APIResponseLoginToken =
        await apiClient.authentication.postApisV1AuthToken({
          requestBody: values,
        });

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        // 修复：使用 localStorage 替代 sessionStorage，以支持跨标签页共享认证状态
        // 原因：sessionStorage 是基于浏览器会话的，每个标签页都有独立的存储空间
        // 当使用 target="_blank" 打开新标签页时，新标签页无法访问父标签页的 sessionStorage
        const { data } = response;
        if (data.access_token) {
          localStorage.setItem(authConfig.storageKeys.token, data.access_token);
        }

        // 存储用户名
        localStorage.setItem(authConfig.storageKeys.username, values.username);

        Message.success('登录成功');

        // 使用完整的URL路径进行重定向，确保正确跳转
        window.location.href = `${window.location.origin}${authConfig.defaultRedirectPath}`;

        // ✅ 返回成功结果
        return { success: true };
      } else if (response.code === API_RESPONSE_CODE.ERROR) {
        // ✅ 根据错误码显示中文提示，并返回错误结果
        const errorMessage = '用户名或密码错误';
        Message.error(errorMessage);
        return {
          success: false,
          error: new Error(errorMessage),
        };
      }

      // ✅ 未知响应码，返回错误结果
      const errorMessage = response.message || '登录失败，请重试';
      Message.error(errorMessage);
      return {
        success: false,
        error: new Error(errorMessage),
      };
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      authErrorHandler.login(errorObj);

      // ✅ 返回错误结果，符合异步方法错误处理规范
      return { success: false, error: errorObj };
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    handleSubmit,
  };
};
