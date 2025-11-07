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

import { Button } from '@arco-design/web-react';
import type React from 'react';
import type { TipFooterProps } from './types';

export const TipFooter: React.FC<TipFooterProps> = ({
  showAction,
  showStepInfo,
  showPreviousBtn,
  stepIndex,
  steps,
  _stepText,
  handlePreviousChange,
  _prevText,
  handleNextChange,
  _okText,
  handleActionChange,
  todPrefixCls,
  PREFIX,
}) => {
  if (showAction) {
    return (
      <div
        className={`${PREFIX}-footer`}
        style={{ justifyContent: 'flex-end' }}
      >
        <div className={`${PREFIX}-footer-btn-group`}>
          {showPreviousBtn && (
            <Button
              size="small"
              type="outline"
              className={`${PREFIX}-footer-prev-btn ${todPrefixCls}-guide-footer-btn`}
              onClick={() => handleActionChange?.('cancel')}
            >
              {_prevText}
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            className={` ${PREFIX}-footer-next-btn ${todPrefixCls}-guide-footer-btn`}
            onClick={() => handleActionChange?.('confirm')}
          >
            {_okText}
          </Button>
        </div>
      </div>
    );
  }

  if (showStepInfo) {
    return (
      <div className={`${PREFIX}-footer flex justify-end items-center gap-2`}>
        <span
          className={`${PREFIX}-footer-text ${todPrefixCls}-guide-footer-text`}
        >
          {_stepText?.(stepIndex! + 1, steps?.length || 0)}
        </span>
        <div className={`${PREFIX}-footer-btn-group flex gap-2`}>
          {showPreviousBtn && stepIndex !== 0 && (
            <Button
              size="small"
              type="outline"
              className={`${PREFIX}-footer-prev-btn ${todPrefixCls}-guide-footer-btn`}
              onClick={handlePreviousChange}
            >
              {_prevText}
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            className={` ${PREFIX}-footer-next-btn ${todPrefixCls}-guide-footer-btn`}
            onClick={handleNextChange}
          >
            {_okText}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
