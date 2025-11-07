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
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

// 主题类型定义
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  themeConfig: ThemeConfig;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

// VE-O Design 暗色主题配置
const darkThemeConfig: ThemeConfig = {
  token: {
    // VE-O Design 基础颜色 - 暗色主题
    colorBgBase: '#1a1a1a',
    colorTextBase: '#ffffff',
    colorBorder: '#3a3a3a',
    colorBgContainer: '#262626',
    colorPrimary: '#3370ff', // VE-O Design 主色

    // 表格相关颜色
    colorBgElevated: '#262626',
    colorBorderSecondary: '#3a3a3a',
    colorFillSecondary: '#333333',
    colorFillTertiary: '#262626',
    colorFillQuaternary: '#1a1a1a',

    // 文本颜色
    colorTextSecondary: '#bfbfbf',
    colorTextTertiary: '#8c8c8c',
    colorTextQuaternary: '#595959',

    // VE-O Design 状态颜色
    colorSuccess: '#00b42a',
    colorWarning: '#ff7d00',
    colorError: '#f53f3f',
    colorInfo: '#3370ff',

    // 悬停和激活状态
    colorBgTextHover: '#333333',
    colorBgTextActive: '#3a3a3a',

    // VE-O Design 特有颜色
    colorLink: '#3370ff',
    colorLinkHover: '#4080ff',
    colorLinkActive: '#2c5aa0',
  },
};

// VE-O Design 亮色主题配置
const lightThemeConfig: ThemeConfig = {
  token: {
    // VE-O Design 基础颜色 - 亮色主题
    colorBgBase: '#ffffff',
    colorTextBase: '#1d2129',
    colorBorder: '#e5e6eb',
    colorBgContainer: '#ffffff',
    colorPrimary: '#3370ff', // VE-O Design 主色

    // 表格相关颜色
    colorBgElevated: '#ffffff',
    colorBorderSecondary: '#e5e6eb',
    colorFillSecondary: '#f7f8fa',
    colorFillTertiary: '#ffffff',
    colorFillQuaternary: '#f2f3f5',

    // 文本颜色
    colorTextSecondary: '#4e5969',
    colorTextTertiary: '#86909c',
    colorTextQuaternary: '#c9cdd4',

    // VE-O Design 状态颜色
    colorSuccess: '#00b42a',
    colorWarning: '#ff7d00',
    colorError: '#f53f3f',
    colorInfo: '#3370ff',

    // 悬停和激活状态
    colorBgTextHover: '#f7f8fa',
    colorBgTextActive: '#f2f3f5',

    // VE-O Design 特有颜色
    colorLink: '#3370ff',
    colorLinkHover: '#4080ff',
    colorLinkActive: '#2c5aa0',
  },
};

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // 从sessionStorage读取保存的主题，默认为亮色主题
    const savedTheme = sessionStorage.getItem('theme') as ThemeMode;
    return savedTheme || 'light';
  });

  // 获取当前主题配置
  const themeConfig = theme === 'dark' ? darkThemeConfig : lightThemeConfig;

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // 设置主题
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    sessionStorage.setItem('theme', newTheme);

    // 更新HTML根元素的data-theme属性，用于CSS变量切换
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // 初始化时设置主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    themeConfig,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// 使用主题的hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
