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

import { classNamePrefixFactory, getChildrenString } from '@/_utils';
import { useCConfigContext } from '@/config-provider';
import { Popover } from '@arco-design/web-react';
import { IconCopy } from '@arco-design/web-react/icon';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useCCopy } from './hooks';
import type { CCopyProps } from './interface';

const cssPrefix = classNamePrefixFactory('copy');
export const testId = {
  container: cssPrefix`container`,
  popover: cssPrefix`popover`,
  icon: cssPrefix`icon`,
};

const CCopy: React.FC<CCopyProps> = (props) => {
  const {
    style,
    className,
    children,
    disabled,
    triggerIcon,
    triggerEle,
    showCopy,
  } = props;
  const text: string = useMemo(
    () => props.text || getChildrenString(children),
    [props.text, children],
  );

  const [{ arcoPopoverProps }, controls] = useCCopy({ ...props, text });

  const { getCPrefixCls } = useCConfigContext();
  const cssRoot = getCPrefixCls('copy');
  const iconCls = getCPrefixCls('icon');

  return (
    <div
      style={style}
      className={classNames(cssRoot, className)}
      data-cy={testId.container}
    >
      {children}
      <Popover {...arcoPopoverProps} data-cy={testId.popover}>
        <span
          className={classNames(`${cssRoot}-icon`, {
            [`${cssRoot}-icon-hover`]: showCopy === 'hover',
          })}
          onClick={controls.handleCopy}
          data-cy={testId.icon}
          data-testid={testId.icon}
        >
          {triggerEle ||
            React.cloneElement(triggerIcon || <IconCopy />, {
              className: classNames(iconCls, disabled && 'disabled'),
            })}
        </span>
      </Popover>
    </div>
  );
};

CCopy.displayName = 'CCopy';

export { CCopy };
