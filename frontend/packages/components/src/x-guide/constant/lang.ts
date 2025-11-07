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

const LANGUAGES = {
  NEXT_STEP: {
    zh: '下一步',
    en: 'Next step',
    ja: '次のステップ',
  },
  I_KNOW: {
    zh: '我知道了',
    en: 'I know',
    ja: '知ってる',
  },
  STEP_NUMBER: {
    zh: (idx: number, length: number) => `第${idx}步， 共${length}步`,
    en: (idx: number, length: number) => `Step ${idx} of ${length}`,
    ja: (idx: number, length: number) => `Step ${idx} of ${length}`,
  },
  PREV_STEP: {
    zh: '上一步',
    en: 'Previous step',
    ja: '前へ',
  },
  CLOSE: {
    zh: '结束引导',
    en: 'finish',
    ja: '終了',
  },
};

type LanguageKeys = typeof LANGUAGES;
export type LanguageType = 'zh' | 'en' | 'ja';
export type StepNumberFunction = (idx: number, length: number) => string;
export type StepNumber = StepNumberFunction;

export function i18n(
  lang: LanguageType = 'zh',
): (key: keyof LanguageKeys) => string | StepNumberFunction {
  return (key: keyof LanguageKeys): string | StepNumberFunction => {
    return LANGUAGES[key]?.[lang];
  };
}
