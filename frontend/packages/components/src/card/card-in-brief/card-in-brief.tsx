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

import type { CSSProperties, FC, ReactNode } from 'react';
import styles from './index.module.less';

const CardInBrief: FC<{
  title: string | ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  show: boolean;
}> = ({ title, children, style, className, show }) => {
  const cardClassName = className ? `${styles.card} ${className}` : styles.card;

  if (show !== true) {
    return null;
  }

  return (
    <div className={cardClassName} style={style}>
      <h4 className={styles.header}>{title}</h4>
      <div className="mt-4">{children}</div>
    </div>
  );
};

export { CardInBrief };
