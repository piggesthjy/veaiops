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

import type { FormInstance } from '@arco-design/web-react';
import { Form } from '@arco-design/web-react';
import { useFormHandlers } from './handlers';
import { useBotCreateFormCallbacks } from './main-logic/callbacks';
import { useBotCreateFormEffects } from './main-logic/effects';
import { useBotCreateFormState } from './main-logic/state';
import { urlValidator } from './validators';

/**
 * 使用表单创建逻辑的 Hook
 *
 * 拆分说明：
 * - use-bot-create-form/state.ts: 状态管理（form、kbCollections、showSecrets等）
 * - use-bot-create-form/effects.ts: 副作用管理（useEffect逻辑）
 * - use-bot-create-form/callbacks.ts: 回调函数（addKbCollection、removeKbCollection等）
 * - handlers/form-handlers.ts: 表单提交处理器
 * - utils/: 工具函数（kb-collections.ts、validations.ts）
 * - validators/: 验证器（url-validator.ts）
 * - use-bot-create-form.ts: 主入口，负责逻辑组装
 */
export const useBotCreateForm = () => {
  // 状态管理
  const state = useBotCreateFormState();

  // 副作用管理
  useBotCreateFormEffects({
    form: state.form,
    showAdvancedConfig: state.showAdvancedConfig,
  });

  // 获取当前表单的bot_id值
  // 注意：Form.useWatch 需要使用泛型 FormInstance，但这里使用类型断言确保兼容性
  const currentBotId =
    (Form.useWatch('bot_id', state.form as FormInstance) as
      | string
      | undefined) || '';

  // 回调函数
  const callbacks = useBotCreateFormCallbacks({
    form: state.form,
    kbCollections: state.kbCollections,
    setKbCollections: state.setKbCollections,
    setShowSecrets: state.setShowSecrets,
  });

  // 表单提交处理器
  const { createSubmitHandler } = useFormHandlers({
    form: state.form,
    showAdvancedConfig: state.showAdvancedConfig,
    kbCollections: state.kbCollections,
  });

  return {
    form: state.form,
    kbCollections: state.kbCollections,
    showSecrets: state.showSecrets,
    showAdvancedConfig: state.showAdvancedConfig,
    selectedChannel: state.selectedChannel,
    currentBotId,
    setSelectedChannel: state.setSelectedChannel,
    setShowAdvancedConfig: state.setShowAdvancedConfig,
    addKbCollection: callbacks.addKbCollection,
    removeKbCollection: callbacks.removeKbCollection,
    updateKbCollection: callbacks.updateKbCollection,
    toggleSecretVisibility: callbacks.toggleSecretVisibility,
    createSubmitHandler,
    urlValidator,
    checkAppIdDuplicate: callbacks.checkAppIdDuplicate,
  };
};
