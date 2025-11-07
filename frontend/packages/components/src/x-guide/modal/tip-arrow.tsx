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
import type { TipArrowProps } from './types';

export const TipArrow: React.FC<TipArrowProps> = ({
  arrow,
  arrowStyle,
  arrowStyleWrap,
  arrowGradientStyleWrap,
  theme,
  PREFIX,
}) => {
  const isBitsTheme = theme === 'bits-light';

  if (!arrow) {
    return null;
  }

  return (
    <>
      {isBitsTheme && (
        <div
          className={`${PREFIX}-arrow-gradient`}
          style={{
            ...arrowGradientStyleWrap,
            width: '14.14px',
            height: '14.14px',
            position: 'absolute',
            background:
              'linear-gradient(219deg, #6332ff 0%, #00e5e5 45.87%, #1664ff 100%)',
            zIndex: 9,
          }}
        />
      )}
      <span
        className={`${PREFIX}-arrow`}
        style={{
          ...arrowStyleWrap,
          ...(isBitsTheme
            ? {
                background: 'white',
                border: '1px solid #dde2e9',
                borderRadius: '1px',
                boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.05)',
              }
            : {}),
        }}
      />
    </>
  );
};
