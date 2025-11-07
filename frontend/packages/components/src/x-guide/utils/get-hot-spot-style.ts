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

import { OPTIONS } from '../constant/const';
import type { Placement, SinglePlacement } from '../interface';
import { getReversePosition } from './get-reverse-position';

export const getHotSpotStyle = (
  arrowStyle: Record<SinglePlacement, number>,
  placement: Placement = 'bottom',
): Record<string, number> => {
  const [firstPlacement, lastPlacement] = placement.split('-');
  const reversePlacement: SinglePlacement = getReversePosition(
    firstPlacement as SinglePlacement,
  );
  const diagonalWidth = OPTIONS.MARGIN + 6;

  if (['top', 'bottom'].includes(firstPlacement)) {
    if (!lastPlacement || lastPlacement === 'right') {
      return {
        [reversePlacement]: arrowStyle[reversePlacement] - diagonalWidth,
        right: arrowStyle.right - 5,
      };
    }
    return {
      [reversePlacement]: arrowStyle[reversePlacement] - diagonalWidth,
      left: arrowStyle.left - 5,
    };
  }

  if (['right', 'left'].includes(firstPlacement)) {
    if (!lastPlacement || lastPlacement === 'top') {
      return {
        top: arrowStyle.top - 5,
        [reversePlacement]: arrowStyle[reversePlacement] - diagonalWidth,
      };
    }
    return {
      bottom: arrowStyle.bottom - 5,
      [reversePlacement]: arrowStyle[reversePlacement] - diagonalWidth,
    };
  }

  return arrowStyle;
};
