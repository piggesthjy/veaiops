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
 * 类名前缀工厂函数
 * @param componentName 组件名称
 * @returns 返回一个模板字符串函数，用于生成带前缀的类名
 */
const classNamePrefixFactory = (componentName: string) => {
  const prefix = `c-m-${componentName}`;

  return (strings: TemplateStringsArray, ...values: any[]) => {
    let result = strings[0];

    for (let i = 0; i < values.length; i++) {
      result += values[i] + strings[i + 1];
    }

    return result ? `${prefix}-${result}` : prefix;
  };
};

export { classNamePrefixFactory };
