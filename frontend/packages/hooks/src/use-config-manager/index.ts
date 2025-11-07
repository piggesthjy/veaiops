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

import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useState } from 'react';

/**
 * 配置管理选项
 */
export interface UseConfigManagerOptions<T> {
  /** 配置类型标识 */
  configType: string;
  /** 加载配置函数 */
  loadConfig: () => Promise<T>;
  /** 保存配置函数 */
  saveConfig: (config: T) => Promise<void>;
  /** 重置配置函数 */
  resetConfig?: () => Promise<T>;
  /** 验证配置函数 */
  validateConfig?: (config: T) => Promise<boolean>;
  /** 导出配置函数 */
  exportConfig?: (config: T) => Promise<void>;
  /** 导入配置函数 */
  importConfig?: (file: File) => Promise<T>;
  /** 是否启用自动保存 */
  autoSave?: boolean;
  /** 自动保存间隔(毫秒) */
  autoSaveInterval?: number;
}

/**
 * 配置管理结果
 */
export interface UseConfigManagerResult<T> {
  /** 当前配置 */
  config: T | null;
  /** 加载状态 */
  loading: boolean;
  /** 保存状态 */
  saving: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 加载配置 */
  loadConfig: () => Promise<void>;
  /** 保存配置 */
  saveConfig: (config: T) => Promise<void>;
  /** 重置配置 */
  resetConfig: () => Promise<T>;
  /** 验证配置 */
  validateConfig: (config: T) => Promise<boolean>;
  /** 导出配置 */
  exportConfig: (config: T) => Promise<void>;
  /** 导入配置 */
  importConfig: (file: File) => Promise<T>;
  /** 刷新配置 */
  refresh: () => Promise<void>;
}

/**
 * 配置变更检测Hook
 */
export const useConfigChanges = <T>(
  originalConfig: T | null,
  currentConfig: T | null,
): boolean => {
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!originalConfig || !currentConfig) {
      setHasChanges(false);
      return;
    }

    // 深度比较配置对象
    const isEqual =
      JSON.stringify(originalConfig) === JSON.stringify(currentConfig);
    setHasChanges(!isEqual);
  }, [originalConfig, currentConfig]);

  return hasChanges;
};

/**
 * 配置管理Hook
 * @description 提供配置的CRUD操作、变更检测、自动保存等功能


 */
export const useConfigManager = <T>(
  options: UseConfigManagerOptions<T>,
): UseConfigManagerResult<T> => {
  const {
    configType,
    loadConfig: loadConfigFn,
    saveConfig: saveConfigFn,
    resetConfig: resetConfigFn,
    validateConfig: validateConfigFn,
    exportConfig: exportConfigFn,
    importConfig: importConfigFn,
    autoSave = false,
    autoSaveInterval = 30000, // 30秒
  } = options;

  const [config, setConfig] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedConfig = await loadConfigFn();
      setConfig(loadedConfig);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      Message.error(`加载${configType}配置失败`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadConfigFn, configType]);

  // 保存配置
  const saveConfig = useCallback(
    async (configToSave: T) => {
      try {
        setSaving(true);
        setError(null);

        // 验证配置
        if (validateConfigFn) {
          const isValid = await validateConfigFn(configToSave);
          if (!isValid) {
            throw new Error('配置验证失败');
          }
        }

        await saveConfigFn(configToSave);
        setConfig(configToSave);

        Message.success(`${configType}配置保存成功`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        Message.error(`保存${configType}配置失败`);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [saveConfigFn, validateConfigFn, configType],
  );

  // 重置配置
  const resetConfig = useCallback(async (): Promise<T> => {
    if (!resetConfigFn) {
      throw new Error('重置配置功能未实现');
    }

    try {
      setLoading(true);
      setError(null);

      const defaultConfig = await resetConfigFn();
      setConfig(defaultConfig);

      Message.success(`${configType}配置已重置为默认值`);

      return defaultConfig;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      Message.error(`重置${configType}配置失败`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [resetConfigFn, configType]);

  // 验证配置
  const validateConfig = useCallback(
    async (configToValidate: T): Promise<boolean> => {
      if (!validateConfigFn) {
        return true;
      }

      try {
        return await validateConfigFn(configToValidate);
      } catch (error) {
        // 配置验证失败，返回 false（静默处理）
        return false;
      }
    },
    [validateConfigFn, configType],
  );

  // 导出配置
  const exportConfig = useCallback(
    async (configToExport: T) => {
      if (!exportConfigFn) {
        throw new Error('导出配置功能未实现');
      }

      try {
        await exportConfigFn(configToExport);

        Message.success(`${configType}配置导出成功`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        Message.error(`导出${configType}配置失败`);
        throw error;
      }
    },
    [exportConfigFn, configType],
  );

  // 导入配置
  const importConfig = useCallback(
    async (file: File): Promise<T> => {
      if (!importConfigFn) {
        throw new Error('导入配置功能未实现');
      }

      try {
        const importedConfig = await importConfigFn(file);
        setConfig(importedConfig);

        Message.success(`${configType}配置导入成功`);

        return importedConfig;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        Message.error(`导入${configType}配置失败`);
        throw error;
      }
    },
    [importConfigFn, configType],
  );

  // 刷新配置
  const refresh = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  // 自动保存
  useEffect(() => {
    if (!autoSave || !config) {
      return undefined;
    }

    const timer = setInterval(() => {
      saveConfig(config);
    }, autoSaveInterval);

    return () => clearInterval(timer);
  }, [autoSave, config, saveConfig, autoSaveInterval]);

  // 初始化加载
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    loading,
    saving,
    error,
    loadConfig,
    saveConfig,
    resetConfig,
    validateConfig,
    exportConfig,
    importConfig,
    refresh,
  };
};

export default useConfigManager;
