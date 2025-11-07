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

import { CUSTOM_ELEMENT_CLASS } from '../constant/class-name';
import type { ITargetPos } from '../interface';

/**
 * Get the anchor element where the modal should be attached to.
 * @param selector - The CSS selector of the anchor element, or the anchor element itself.
 */
export const getCusAnchorEl = (targetPos: ITargetPos): Element => {
  const preCusAnchor = document.querySelector(CUSTOM_ELEMENT_CLASS);
  preCusAnchor && document.body.removeChild(preCusAnchor);

  const cusAnchor: HTMLDivElement = document.createElement('div');

  cusAnchor.className = CUSTOM_ELEMENT_CLASS;
  Object.entries(targetPos).forEach(([key, value]: [any, number]) => {
    cusAnchor.style[key] = `${value}px`;
  });

  document.body.appendChild(cusAnchor);
  return cusAnchor;
};
