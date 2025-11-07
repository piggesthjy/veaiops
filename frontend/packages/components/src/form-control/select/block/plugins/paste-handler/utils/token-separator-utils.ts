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
 * 分隔符工具类 - 提供常用的分隔符预设
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TokenSeparatorUtils {
  /**
   * 常用分隔符预设
   */
  static presets: Record<string, string[]> = {
    // 基础分隔符
    basic: [',', '\n', ';', '\t'],
    // 扩展分隔符（包含中文）
    extended: [',', '\n', ';', '\t', ' ', '|', '，', '；'],
    // 仅逗号和换行
    simple: [',', '\n'],
    // Excel风格（制表符和换行）
    excel: ['\t', '\n'],
    // 中文友好
    chinese: [',', '\n', ';', '，', '；'],
    // 空格分隔
    space: [' ', '\n', '\t'],
  };

  /**
   * 自定义分隔符构建器
   */
  static custom(...separators: string[]): string[] {
    return separators;
  }

  /**
   * 合并多个分隔符预设
   */
  static merge(
    ...presetNames: (keyof typeof TokenSeparatorUtils.presets)[]
  ): string[] {
    const allSeparators = presetNames.flatMap(
      (name) => TokenSeparatorUtils.presets[name],
    );
    return Array.from(new Set(allSeparators)); // 去重
  }

  /**
   * 验证分隔符是否有效
   */
  static validate(separators: string[]): boolean {
    return (
      Array.isArray(separators) &&
      separators.every((sep) => typeof sep === 'string' && sep.length > 0)
    );
  }

  /**
   * 增强的文本切分方法，支持多种分隔符
   */
  static splitTextByMultipleSeparators(
    text: string,
    separators: string[],
  ): string[] {
    if (!text || !separators || separators.length === 0) {
      return [text].filter(Boolean);
    }

    // 创建正则表达式，支持多个分隔符
    const escapedSeparators = separators.map((sep) =>
      sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );
    const regex = new RegExp(`[${escapedSeparators.join('')}]+`, 'g');

    // 分割文本并过滤空字符串
    const result = text
      .split(regex)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return result;
  }

  /**
   * 获取默认分隔符
   */
  static getDefaultSeparators(): string[] {
    return ['\n', ',', ';', '\t', ' ', '|', '，', '；'];
  }
}
