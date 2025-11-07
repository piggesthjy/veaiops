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

export const calcArrowClipPath = (style: any) => {
  if (style.borderLeft && style.borderTop) {
    return 'polygon(100% 100%, 0 100%, 100% 0)';
  }

  if (style.borderRight && style.borderBottom) {
    return 'polygon(0 0, 100% 0, 0 100%)';
  }

  if (style.borderRight && style.borderTop) {
    return 'polygon(0 100%, 100% 100%, 0 0)';
  }
  if (style.borderLeft && style.borderBottom) {
    return 'polygon(100% 100%, 100% 0, 0 0)';
  }
  return '';
};

export interface CalcArrowGradientStyleParams {
  style: any;
  width: any;
  height: any;
}

export const calcArrowGradientStyle = ({
  style,
  width,
  height,
}: CalcArrowGradientStyleParams) => {
  /**
   * 箭头的样式通过一个 div 单独画出一个正方形，且不使用 shadow、border ，然后使用 clipPath 来截取箭头
   * 类似 style.bottom - x 的 magic number 是为了对齐外面的边框
   * bits-light 的 background-size 是把箭头一起考虑到了渐变范围里
   * 所以箭头本身的  background-size 也多了 7.07 的 magic number
   */
  // 顶部
  if (style.borderLeft && style.borderTop) {
    const bottom = style.bottom - 1;
    const left = style.left - 2;
    const right = style.right - 2;
    return {
      clipPath: 'polygon(0% 50%, 50% 100%, 100% 50%)',
      bottom,
      ...(style.left ? { left } : { right }),
      backgroundPosition: `${
        style.left ? -(left + 7.07) : -(width - right - 7.07)
      }px ${-(height - bottom - 7.07)}px`,
    };
  }

  // 底部
  if (style.borderRight && style.borderBottom) {
    const top = style.top - 1;
    const left = style.left - 2;
    const right = style.right - 2;

    return {
      clipPath: 'polygon(0% 50%, 50% 0%, 100% 50%)',
      top,
      ...(style.left ? { left } : { right }),
      backgroundPosition: `${
        style.left ? -(left + 7.07) : -(width - right - 7.07)
      }px ${-(top + 7.07)}px`,
    };
  }

  // 右边
  if (style.borderRight && style.borderTop) {
    const left = style.left - 1;
    const top = style.top - 2;
    const bottom = style.bottom - 2;
    return {
      clipPath: 'polygon(50% 0%, 0% 50%, 50% 100%)',
      left,
      ...(style.top ? { top } : { bottom }),
      backgroundPosition: `${-(left + 7.07)}px ${
        style.top ? -(top + 7.07) : -(height - bottom - 7.07)
      }px`,
    };
  }

  // 左边
  if (style.borderLeft && style.borderBottom) {
    const right = style.right - 1;
    const top = style.top - 2;
    const bottom = style.bottom - 2;
    return {
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%)',
      right,
      ...(style.top ? { top } : { bottom }),
      backgroundPosition: `${-(width - right - 7.07)}px ${
        style.top ? -(top + 7.07) : -(height - bottom - 7.07)
      }px`,
    };
  }
  return {};
};
