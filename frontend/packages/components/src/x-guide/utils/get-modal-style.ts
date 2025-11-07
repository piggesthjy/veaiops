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
import { getOffsetTop } from './get-offset-parent';
import { getComputedStyle, getNodeName } from './utils';

interface IModalStyle {
  position: 'absolute' | 'fixed';
  top: number;
  left: number;
}

/**
 * 根据选择器所选元素、modal 的长宽、用户定义的 placement 和 offset，获取 modal 的位置
 * Calculate the modal's position based on its anchor element, user-defined placement and offset
 * @param {HTMLElement} modalEl
 * @param {Element} anchorEl
 * @param {Element} parentEl
 * @param {string} placement
 * @param {object} customOffset
 */
export const getModalStyle = (
  modalEl: Element,
  anchorEl: Element,
  parentEl: Element,
  scrollContainer: Element,
  placement = 'bottom',
  customOffset = { x: 0, y: 0 },
): IModalStyle => {
  const { PADDING } = OPTIONS;
  const { MARGIN } = OPTIONS;
  const modalPos = modalEl.getBoundingClientRect();
  const anchorPosBf = anchorEl.getBoundingClientRect();
  const parentPos = parentEl.getBoundingClientRect();

  const anchorPos = {
    top: Number(anchorPosBf.top) - PADDING,
    left: Number(anchorPosBf.left) - PADDING,
    width: Number(anchorPosBf.width) + PADDING * 2,
    height: Number(anchorPosBf.height) + PADDING * 2,
  };

  const { scrollTop } = scrollContainer;

  const isParentBody = getNodeName(parentEl) === 'body';
  const isAnchorFixed =
    getNodeName(parentEl) === 'body' ||
    getComputedStyle(anchorEl).position === 'fixed';
  const anchorOffsetTop = getOffsetTop(anchorEl);

  let scrollY;
  if (isAnchorFixed) {
    scrollY = anchorPos.top;
  } else if (isParentBody) {
    scrollY = anchorPos.top + scrollTop;
  } else {
    scrollY = anchorOffsetTop;
  }

  /* The distance between the top of the offsetParent and the top of the anchor.
   *
   * We don't simply use anchorEl.offsetTop but the below code instead due to the following reason:
   * for the cases with no mask, the anchorEl's should be positioned relative to the body rather than
   * its real offsetParent.
   */
  const top = scrollY;
  const bottom = anchorPos.height + scrollY;
  const left = anchorPos.left - parentPos.left;

  const { width, height } = anchorPos;

  const transform: Record<string, Record<string, number>> = {
    top: {
      // modal放到内容的上面
      top: top - modalPos.height - MARGIN,
      left: left + width / 2 - modalPos.width / 2,
    },
    bottom: {
      // modal放到内容的下面
      top: bottom + MARGIN,
      left: left + width / 2 - modalPos.width / 2,
    },
    left: {
      // modal放到内容的左边
      top: top + height / 2 - modalPos.height / 2,
      left: left - modalPos.width - MARGIN,
    },
    right: {
      // modal放到内容的右边
      top: top + height / 2 - modalPos.height / 2,
      left: left + width + MARGIN,
    },
    'top-right': {
      // modal的bottom-border紧贴内容的top-border，right-borders水平对齐
      top: top - modalPos.height - MARGIN,
      left: left + width - modalPos.width,
    },
    'top-left': {
      // modal的bottom-border紧贴内容的top-border，left-borders水平对齐
      top: top - modalPos.height - MARGIN,
      left,
    },
    'bottom-right': {
      // modal的top-border紧贴内容的bottom-border，right-borders水平对齐
      top: bottom + MARGIN,
      left: left + width - modalPos.width,
    },
    'bottom-left': {
      // modal的top-border紧贴内容的bottom-border，left-borders水平对齐
      top: bottom + MARGIN,
      left,
    },
    'right-top': {
      // modal的left-border紧贴内容的right-border，top-borders水平对齐
      top,
      left: left + width + MARGIN,
    },
    'left-top': {
      // modal的right-border紧贴内容的left-border，top-borders水平对齐
      top,
      left: left - modalPos.width - MARGIN,
    },
    'right-bottom': {
      // modal的left-border紧贴内容的right-border，bottom-borders水平对齐
      top: bottom - modalPos.height,
      left: left + width + MARGIN,
    },
    'left-bottom': {
      // modal的right-border紧贴内容的left-border，bottom-borders水平对齐
      top: bottom - modalPos.height,
      left: left - modalPos.width - MARGIN,
    },
  };

  const offset = {
    x: customOffset.x || 0,
    y: customOffset.y || 0,
  };

  const position = transform[placement];

  return {
    position: isAnchorFixed ? 'fixed' : 'absolute',
    top: position.top + offset.y,
    left: position.left + offset.x,
  };
};
