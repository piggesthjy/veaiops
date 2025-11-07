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

/**
 * VE-O Design Theme Type Definitions
 * Type definitions based on @arco-design/theme-ve-o-design
 */

export interface ColorPalette {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
}

export interface ThemeColors {
  /** Gray palette */
  gray: ColorPalette & {
    8: string;
    9: string;
    10: string;
  };
  /** Blue palette */
  blue: ColorPalette;
  /** Gold palette */
  gold: ColorPalette;
  /** Yellow palette */
  yellow: ColorPalette;
  /** Lime palette */
  lime: ColorPalette;
  /** Cyan palette */
  cyan: ColorPalette;
  /** Purple palette */
  purple: ColorPalette;
  /** Pink-purple palette */
  pinkpurple: ColorPalette;
  /** Magenta palette */
  magenta: ColorPalette;
}

export interface ThemeTokens {
  /** Color system */
  colors: ThemeColors;
  /** Typography system */
  typography: {
    fontFamily: string;
    fontSize: {
      display3: string;
      display2: string;
      display1: string;
      title3: string;
      title2: string;
      title1: string;
      body3: string;
      body2: string;
      body1: string;
      caption: string;
    };
    fontWeight: {
      100: number;
      200: number;
      300: number;
      400: number;
      500: number;
      600: number;
      700: number;
      800: number;
      900: number;
    };
  };
  /** Spacing system */
  spacing: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    13: string;
    14: string;
    15: string;
    16: string;
    17: string;
    18: string;
    19: string;
    20: string;
  };
  /** Border system */
  border: {
    radius: {
      none: string;
      small: string;
      medium: string;
      large: string;
      circle: string;
    };
    width: {
      none: string;
      1: string;
      2: string;
      3: string;
    };
  };
  /** Shadow system */
  shadow: {
    none: string;
    special: string;
    1: {
      center: string;
      up: string;
      down: string;
      left: string;
      right: string;
      leftUp: string;
      leftDown: string;
      rightUp: string;
      rightDown: string;
    };
    2: {
      center: string;
      up: string;
      down: string;
      left: string;
      right: string;
      leftUp: string;
      leftDown: string;
      rightUp: string;
      rightDown: string;
    };
    3: {
      center: string;
      up: string;
      down: string;
      left: string;
      right: string;
      leftUp: string;
      leftDown: string;
      rightUp: string;
      rightDown: string;
    };
  };
}

export interface ComponentTheme {
  /** Component name */
  name: string;
  /** Component styles */
  styles: Record<string, any>;
}

export interface ThemeDefinition {
  /** Theme name */
  name: string;
  /** Theme version */
  version: string;
  /** Design tokens */
  tokens: ThemeTokens;
  /** Component themes */
  components: ComponentTheme[];
}
