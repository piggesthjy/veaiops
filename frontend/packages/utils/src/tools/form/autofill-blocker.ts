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
 * 防浏览器自动填充工具函数
 *
 * @description
 * 现代浏览器（Chrome/Edge/Firefox/Safari）会积极地尝试自动填充表单，
 * 即使设置了 autocomplete="off" 也会被忽略。
 * 此工具函数提供了多层防护策略来真正禁用自动填充。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Security/Securing_your_site/Turning_off_form_autocompletion
 * @see https://bugs.chromium.org/p/chromium/issues/detail?id=468153
 *
 * @author VeAIOps Team
 */

/**
 * 防自动填充属性集合
 * 只包含安全的、不会与组件库冲突的属性
 *
 * 注意：这里不使用 InputHTMLAttributes，因为：
 * 1. Arco Design 的 InputProps 重新定义了某些属性（如 defaultValue）
 * 2. 我们只需要特定的几个属性来阻止自动填充
 * 3. 使用精确的类型定义可以避免类型冲突
 */
export interface AutofillBlockerAttributes {
  /** HTML autocomplete 属性 */
  autoComplete: string;
  /** HTML name 属性 */
  name: string;
  /** 表单类型标记 */
  'data-form-type'?: string;
  /** 自动填充禁用标记 */
  'data-autofill'?: string;
  /** LastPass 忽略标记 */
  'data-lpignore'?: string;
  /** 1Password 忽略标记 */
  'data-1p-ignore'?: string;
  /** Bitwarden 忽略标记 */
  'data-bwignore'?: string;
  /** Dashlane 忽略标记 */
  'data-dashlane-ignore'?: string;
}

/**
 * 字段类型枚举
 */
export type SecureFieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'api-key'
  | 'custom';

/**
 * 防自动填充配置选项
 */
export interface AutofillBlockerOptions {
  /**
   * 字段类型，影响 autocomplete 和 name 属性的生成策略
   * @default 'text'
   */
  fieldType?: SecureFieldType;

  /**
   * 自定义字段名称（可选）
   * 如果不提供，将自动生成一个随机名称以避免被浏览器识别
   */
  customName?: string;

  /**
   * 是否添加随机后缀到 name 属性
   * 启用后可以进一步混淆浏览器的字段识别
   * @default true
   */
  useRandomSuffix?: boolean;

  /**
   * 是否包含第三方密码管理器的忽略标记
   * 包括 LastPass, 1Password, Dashlane 等
   * @default true
   */
  blockPasswordManagers?: boolean;
}

/**
 * 生成随机字符串（用于 name 属性后缀）
 */
function generateRandomSuffix(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * 根据字段类型获取 autocomplete 属性值
 */
function getAutocompleteValue(fieldType: SecureFieldType): string {
  switch (fieldType) {
    case 'password':
    case 'api-key':
      // 对于密码类型，使用 "new-password" 是最有效的
      // 浏览器会认为这是设置新密码的场景，不会自动填充
      return 'new-password';
    case 'email':
      // 邮箱字段也使用 off，避免自动填充历史邮箱
      return 'off';
    default:
      return 'off';
  }
}

/**
 * 生成字段名称
 */
function generateFieldName(
  fieldType: SecureFieldType,
  customName?: string,
  useRandomSuffix = true,
): string {
  if (customName) {
    return useRandomSuffix
      ? `${customName}-${generateRandomSuffix()}`
      : customName;
  }

  // 使用不常见的前缀，避免被识别为标准字段
  const prefix = 'secure-field';
  const typeSegment = fieldType === 'custom' ? 'input' : fieldType;
  const suffix = useRandomSuffix ? `-${generateRandomSuffix()}` : '';

  return `${prefix}-${typeSegment}${suffix}`;
}

/**
 * 生成防自动填充的 HTML 属性
 *
 * @description
 * 返回一个包含多种防护策略的属性对象，可以直接展开到 Input 组件上
 *
 * @example
 * ```tsx
 * // 基础使用
 * const props = getAutofillBlockerProps({ fieldType: 'text' });
 * <Input {...props} placeholder="App ID" />
 *
 * // 密码字段
 * const secretProps = getAutofillBlockerProps({ fieldType: 'password' });
 * <Input {...secretProps} placeholder="密钥" />
 *
 * // 自定义名称
 * const customProps = getAutofillBlockerProps({
 *   fieldType: 'text',
 *   customName: 'bot-app-id',
 * });
 * <Input {...customProps} />
 * ```
 *
 * @param options 配置选项
 * @returns 防自动填充属性对象
 */
export function getAutofillBlockerProps(
  options: AutofillBlockerOptions = {},
): AutofillBlockerAttributes {
  const {
    fieldType = 'text',
    customName,
    useRandomSuffix = true,
    blockPasswordManagers = true,
  } = options;

  const props: AutofillBlockerAttributes = {
    // 1. 核心属性：autocomplete
    // 根据字段类型选择最合适的值
    autoComplete: getAutocompleteValue(fieldType),

    // 2. name 属性：使用不标准的名称
    // 浏览器会根据 name 属性识别字段（如 "username", "password", "email"）
    // 使用自定义名称可以避免被识别
    name: generateFieldName(fieldType, customName, useRandomSuffix),

    // 3. 表单类型标记
    // 告诉浏览器这不是标准的登录/注册表单
    'data-form-type': 'other',

    // 4. 自动填充禁用标记
    'data-autofill': 'false',
  };

  // 5. 第三方密码管理器的忽略标记
  if (blockPasswordManagers) {
    Object.assign(props, {
      'data-lpignore': 'true', // LastPass
      'data-1p-ignore': 'true', // 1Password
      'data-bwignore': 'true', // Bitwarden
      'data-dashlane-ignore': 'true', // Dashlane
    });
  }

  return props;
}

/**
 * 表单级别防自动填充属性集合
 */
export interface FormAutofillBlockerAttributes {
  /** HTML autocomplete 属性 */
  autoComplete: 'off';
  /** 自动填充禁用标记 */
  'data-no-autofill'?: string;
}

/**
 * 表单级别的防自动填充属性
 *
 * @description
 * 在 Form 组件上设置这些属性，可以从表单层面禁用自动填充
 *
 * @example
 * ```tsx
 * const formProps = getFormAutofillBlockerProps();
 * <Form {...formProps}>
 *   <Form.Item>
 *     <Input {...getAutofillBlockerProps({ fieldType: 'text' })} />
 *   </Form.Item>
 * </Form>
 * ```
 *
 * @returns 表单防自动填充属性对象
 */
export function getFormAutofillBlockerProps(): FormAutofillBlockerAttributes {
  return {
    // 表单级别的 autocomplete
    autoComplete: 'off',

    // 额外的标记属性
    'data-no-autofill': 'true',

    // 注意：某些浏览器要求表单中至少有一个带 name 属性的输入框
    // 否则会忽略 autocomplete="off"
    // 使用本工具函数生成的 input 属性已经包含了 name 属性
  };
}

/**
 * 预设配置：常用场景的快捷方式
 */
export const AutofillBlockerPresets = {
  /** App ID / 应用ID */
  appId: (): AutofillBlockerAttributes =>
    getAutofillBlockerProps({ fieldType: 'text', customName: 'app-id' }),

  /** App Secret / 应用密钥 */
  appSecret: (): AutofillBlockerAttributes =>
    getAutofillBlockerProps({
      fieldType: 'password',
      customName: 'app-secret',
    }),

  /** API Key / API密钥 */
  apiKey: (): AutofillBlockerAttributes =>
    getAutofillBlockerProps({ fieldType: 'api-key', customName: 'api-key' }),

  /** Access Key / 访问密钥 */
  accessKey: (): AutofillBlockerAttributes =>
    getAutofillBlockerProps({
      fieldType: 'password',
      customName: 'access-key',
    }),

  /** Secret Key / 私密密钥 */
  secretKey: (): AutofillBlockerAttributes =>
    getAutofillBlockerProps({
      fieldType: 'password',
      customName: 'secret-key',
    }),

  /** Token / 令牌 */
  token: (): AutofillBlockerAttributes =>
    getAutofillBlockerProps({ fieldType: 'password', customName: 'token' }),

  /** 邮箱（不希望自动填充时） */
  secureEmail: (): AutofillBlockerAttributes =>
    getAutofillBlockerProps({ fieldType: 'email', customName: 'secure-email' }),
} as const;

/**
 * 工具函数：合并 autofill blocker 属性和其他属性
 *
 * @example
 * ```tsx
 * const inputProps = mergeAutofillBlockerProps(
 *   { fieldType: 'password' },
 *   { placeholder: '请输入密码', maxLength: 100 }
 * );
 * <Input {...inputProps} />
 * ```
 */
export function mergeAutofillBlockerProps<T extends Record<string, unknown>>(
  blockerOptions: AutofillBlockerOptions,
  otherProps: T,
): T & AutofillBlockerAttributes {
  const blockerProps = getAutofillBlockerProps(blockerOptions);
  return {
    ...otherProps,
    ...blockerProps,
  };
}
