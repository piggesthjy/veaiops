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

import type { Placement } from '../interface';
import { getReversePosition } from './get-reverse-position';

type SinglePlacement = 'top' | 'bottom' | 'left' | 'right';

export const getArrowStyle = (
  modalEl: Element,
  placement: Placement = 'bottom',
  margin = 24,
): Record<string, string | number> => {
  const modalPos = modalEl.getBoundingClientRect();
  const diagonalWidth = 10;

  const [firstPlacement, lastPlacement] = placement.split(
    '-',
  ) as SinglePlacement[];

  const borderMap = {
    top: {
      borderTop: 'none',
      borderLeft: 'none',
    },
    right: {
      borderTop: 'none',
      borderRight: 'none',
    },
    bottom: {
      borderBottom: 'none',
      borderRight: 'none',
    },
    left: {
      borderBottom: 'none',
      borderLeft: 'none',
    },
  };

  const extraStyle = {
    ...borderMap[firstPlacement],
    // boxShadow: mask ? 'none' : boxShadowmMap[firstPlacement],
    [getReversePosition(firstPlacement)]: -diagonalWidth / 2,
  };

  if (!lastPlacement) {
    const style: { [key: string]: any } = {};
    if (['bottom', 'top'].includes(firstPlacement)) {
      style.right = (modalPos.width - diagonalWidth) / 2;
    }
    if (['left', 'right'].includes(firstPlacement)) {
      style.top = (modalPos.height - diagonalWidth) / 2;
    }
    return {
      ...style,
      ...extraStyle,
    };
  }
  return {
    [lastPlacement]: margin,
    ...extraStyle,
  };
};
