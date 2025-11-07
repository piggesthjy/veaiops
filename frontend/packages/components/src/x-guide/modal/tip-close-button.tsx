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

import type React from 'react';
import { CloseSmall } from './Icons';
import type { TipCloseButtonProps } from './types';

export const TipCloseButton: React.FC<TipCloseButtonProps> = ({
  closeEle,
  closable,
  onClose,
  PREFIX,
}) => {
  if (closeEle) {
    return (
      <div className={`${PREFIX}-close-icon`} onClick={onClose}>
        {closeEle}
      </div>
    );
  }

  if (closable) {
    return (
      <div className={`${PREFIX}-close-icon`} onClick={onClose}>
        <CloseSmall />
      </div>
    );
  }

  return null;
};
