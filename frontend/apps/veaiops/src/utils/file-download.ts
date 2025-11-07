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
 * 文件下载工具函数

 */
import { logger } from '@veaiops/utils';

/**
 * 下载文件的通用方法
 * @param url 文件URL
 * @param filename 下载的文件名
 * @returns Promise<boolean> 下载是否成功
 */
export const downloadFile = async (
  url: string,
  filename: string,
): Promise<boolean> => {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error: unknown) {
    // ✅ 正确：记录错误并返回失败结果
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({
      message: `文件下载失败: ${errorObj.message}`,
      data: {
        url,
        filename,
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
      },
      source: 'FileDownload',
      component: 'downloadFile',
    });
    return false;
  }
};

/**
 * 下载卡片模板文件
 * @returns Promise<boolean> 下载是否成功
 */
export const downloadCardTemplate = async (): Promise<boolean> => {
  const filename = 'VeAIOps.card';
  const url =
    process.env.NODE_ENV === 'development' ? '/VeAIOps.card' : './VeAIOps.card';

  return downloadFile(url, filename);
};

/**
 * 下载文件并显示成功/失败提示
 * @param url 文件URL
 * @param filename 下载的文件名
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const downloadFileWithCallback = async (
  url: string,
  filename: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void,
): Promise<boolean> => {
  const success = await downloadFile(url, filename);

  if (success) {
    onSuccess?.();
  } else {
    onError?.(new Error('文件下载失败'));
  }
  return success;
};

/**
 * 下载卡片模板并显示提示
 * @param onSuccess 成功回调
 * @param onError 失败回调
 */
export const downloadCardTemplateWithCallback = async (
  onSuccess?: () => void,
  onError?: (error: Error) => void,
): Promise<boolean> => {
  return downloadFileWithCallback(
    process.env.NODE_ENV === 'development' ? '/VeAIOps.card' : './VeAIOps.card',
    'VeAIOps.card',
    onSuccess,
    onError,
  );
};
