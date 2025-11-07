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

import { useCConfigContext } from '@/config-provider';
import {
  IconCheckCircleFill,
  IconCloseCircleFill,
} from '@arco-design/web-react/icon';
import copy from 'copy-to-clipboard';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { CCopyHooksProps } from './interface';

export const useCCopy = (props: CCopyHooksProps) => {
  const [result, setResult] = useState<boolean>();
  const [visible, setVisible] = useState(false);
  const { locale } = useCConfigContext();
  const {
    text,
    options,
    onCopy,
    successMessage = locale.CCopy.successMessage,
    failMessage = locale.CCopy.failMessage,
    tooltip,
    disabled,
    arcoPopoverProps = {},
  } = props;

  const clearResult = useCallback(() => setResult(undefined), []);

  const handleCopy = (e: React.MouseEvent) => {
    if (disabled) {
      return;
    }
    e.stopPropagation();
    const result = copy(text, options as any);
    onCopy?.(text, result);
    setResult(result);
  };

  const getResultContent = useCallback(
    (result: boolean) => {
      const Icon = result ? IconCheckCircleFill : IconCloseCircleFill;
      const message = result ? successMessage : failMessage;

      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Icon style={{ marginRight: '4px', fontSize: 14 }} />
          <span>{message}</span>
        </div>
      );
    },
    [successMessage, failMessage],
  );

  const copyProps = useMemo(() => {
    const { onVisibleChange, content: _content, ...others } = arcoPopoverProps;
    const isCopied = typeof result === 'boolean';

    if (isCopied) {
      return {
        message: result ? successMessage : failMessage,
        success: result,
        fail: !result,
        arcoPopoverProps: {
          content: getResultContent(result),
          popupVisible: true,
          onVisibleChange: (visible: boolean) => {
            if (!visible) {
              clearResult();
            }
            onVisibleChange?.(visible);
            setVisible(visible);
          },
          ...others,
        },
      };
    }

    return {
      arcoPopoverProps: {
        content: tooltip,
        popupVisible: visible && Boolean(tooltip || arcoPopoverProps.content),
        onVisibleChange: (visible: boolean) => {
          onVisibleChange?.(visible);
          setVisible(visible);
        },
        ...others,
      },
    };
  }, [
    result,
    visible,
    arcoPopoverProps,
    failMessage,
    getResultContent,
    successMessage,
    tooltip,
    clearResult,
    setVisible,
  ]);

  const controls = { handleCopy, clearResult };

  return [copyProps, controls] as const;
};
