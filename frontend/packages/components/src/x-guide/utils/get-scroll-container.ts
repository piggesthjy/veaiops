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

import {
  getComputedStyle,
  getDocumentElement,
  getNodeName,
  getParentNode,
  isHTMLElement,
} from './utils';

export const getScrollContainer = (
  node: Element | HTMLElement,
  callback?: (node: Element | null) => unknown,
): Element => {
  let currentNode = getParentNode(node);

  while (
    isHTMLElement(currentNode as Element) &&
    ['html', 'body'].indexOf(getNodeName(currentNode as Element)) < 0
  ) {
    const css = getComputedStyle(currentNode as Element);
    const { overflowY } = css;
    const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

    callback?.(currentNode as Element);

    if (
      isScrollable &&
      (currentNode as Element).scrollHeight >
        (currentNode as Element).clientHeight
    ) {
      return currentNode as Element;
    }
    currentNode = (currentNode as Element).parentNode;
  }

  return getDocumentElement(node);
};

// export const getOffsetTopRelativeToScrollContainer = (
//   node: Element | HTMLElement,
// ): Element => {

// };
