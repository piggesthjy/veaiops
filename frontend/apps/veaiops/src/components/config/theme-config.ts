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

import type { ThemeConfig } from '@arco-design/web-react/es/ConfigProvider/interface';

// Arco Design暗色主题配置
export const darkThemeConfig: ThemeConfig = {
  token: {
    // 基础颜色
    colorBgBase: '#0f1419',
    colorTextBase: '#ffffff',
    colorBorder: '#374151',
    colorBgContainer: '#1a1f2e',
    colorPrimary: '#1890ff',

    // 表格相关颜色
    colorBgElevated: '#1a1f2e',
    colorBorderSecondary: '#374151',
    colorFillSecondary: '#252b3b',
    colorFillTertiary: '#1a1f2e',
    colorFillQuaternary: '#0f1419',

    // 文本颜色
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#6b7280',
    colorTextQuaternary: '#4b5563',

    // 状态颜色
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#1890ff',

    // 悬停和激活状态
    colorBgTextHover: '#252b3b',
    colorBgTextActive: '#374151',
  },
};

// 默认导出暗色主题
export const themeConfig = darkThemeConfig;
