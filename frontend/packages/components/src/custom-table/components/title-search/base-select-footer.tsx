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

import type { SelectCustomWithFooterProps } from '@/custom-table/types';
import { Button, Select } from '@arco-design/web-react';
import { IconSearch } from '@arco-design/web-react/icon';
import { type FC, type ReactNode, useEffect, useMemo, useState } from 'react';
import styles from './base-select-footer.module.less';
import { getFinallyOptions } from './utils';

const BaseSelectFooter: FC<SelectCustomWithFooterProps> = (props) => {
  const { value, options, onChange, onVisibleChange, ...otherProps } = props;
  /** 内部的值 */
  const [stateValue, setStateValue] = useState(value);
  /** 是否显示下拉框 */
  const [visible, setVisible] = useState(false);

  const handleVisibleChange = (_visible: boolean) => {
    if (!_visible) {
      // 如果窗口关闭，则外部值
      setStateValue(value);
    }
    setVisible(_visible);
    onVisibleChange?.(_visible);
  };

  useEffect(() => {
    // 内布置和外部值不一样的情况下只会有清空的操作
    if (value !== stateValue && value === undefined) {
      setStateValue(value);
    }
  }, [value, stateValue]);

  const finallyOptions = useMemo(() => {
    // 确保 value 和 stateValue 是单个值或数组，适配 getFinallyOptions 的参数类型
    const normalizedValue = Array.isArray(value)
      ? value.length > 0
        ? value[0]
        : undefined
      : value
        ? value
        : undefined;
    const normalizedStateValue = Array.isArray(stateValue)
      ? stateValue.length > 0
        ? stateValue[0]
        : undefined
      : stateValue
        ? stateValue
        : undefined;
    // options 是 SimpleOptions (string[] | number[])，getFinallyOptions 期望 SimpleOptions[]
    // 所以需要将单个 options 转换为数组
    const normalizedOptions = options ? [options] : undefined;

    return getFinallyOptions({
      value: normalizedValue,
      stateValue: normalizedStateValue,
      options: normalizedOptions,
    });
  }, [value, stateValue, options]);

  const dropdownRender = (menu: ReactNode) => {
    if (
      !finallyOptions ||
      !Array.isArray(finallyOptions) ||
      finallyOptions.length === 0
    ) {
      return menu;
    }

    const sure = () => {
      setStateValue(stateValue);
      // stateValue 可能是数组（多选模式），需要转换为单个值
      const normalizedValue = Array.isArray(stateValue)
        ? stateValue.length > 0
          ? stateValue[0]
          : undefined
        : stateValue;
      onChange?.(normalizedValue);
      setVisible(!visible);
    };

    const resetAll = () => {
      setStateValue(undefined);
      setVisible(false);
    };
    return (
      <div className={styles.popup}>
        {menu}
        <div className={styles.footer}>
          <Button size="mini" className={styles.selectAll} onClick={resetAll}>
            重置
          </Button>
          <Button size="mini" type="primary" onClick={sure}>
            确认
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Select
      className={styles.select}
      size="small"
      mode="multiple"
      placeholder="搜索"
      filterOption={false}
      removeIcon={null}
      allowClear={false}
      value={stateValue}
      onChange={setStateValue}
      dropdownRender={dropdownRender}
      dropdownMenuClassName={styles.dropdown}
      popupVisible={visible}
      onVisibleChange={handleVisibleChange}
      options={finallyOptions}
      arrowIcon={<IconSearch />}
      style={{ width: 240 }}
      showSearch={{ retainInputValueWhileSelect: true }}
      triggerProps={{
        style: {
          maxWidth: 320,
        },
        className: styles.popupWrap,
        autoAlignPopupWidth: false,
        autoAlignPopupMinWidth: true,
        position: 'br',
      }}
      {...otherProps}
    />
  );
};

export { BaseSelectFooter };
