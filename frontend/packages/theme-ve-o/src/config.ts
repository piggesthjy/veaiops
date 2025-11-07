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
 * VE-O Design Theme Configuration
 * Theme configuration based on @arco-design/theme-ve-o-design
 */

export interface ThemeConfig {
  /** Theme name */
  name: string;
  /** Theme version */
  version: string;
  /** Theme description */
  description: string;
  /** Whether it's a dark theme */
  dark?: boolean;
  /** Primary color */
  primaryColor?: string;
  /** Success color */
  successColor?: string;
  /** Warning color */
  warningColor?: string;
  /** Error color */
  errorColor?: string;
}

/**
 * Default theme configuration
 */
export const defaultThemeConfig: ThemeConfig = {
  name: 'VE-O Design',
  version: '1.0.0',
  description:
    'VE-O Design Theme for VolcAIOps - 基于 @arco-design/theme-ve-o-design 的开源主题包',
  dark: false,
  primaryColor: '#3491fa',
  successColor: '#9fdb1d',
  warningColor: '#f7ba1e',
  errorColor: '#f53f3f',
};

/**
 * Get theme configuration
 */
export function getThemeConfig(): ThemeConfig {
  return defaultThemeConfig;
}

/**
 * Set theme configuration
 */
export function setThemeConfig(config: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...defaultThemeConfig,
    ...config,
  };
}
