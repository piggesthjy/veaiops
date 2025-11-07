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

import { IconDesktop } from '@arco-design/web-react/icon';
import type { ZabbixHost } from 'api-generate';
import type React from 'react';
import { SelectableItem } from '../../../../components/selectable-item';

export interface ZabbixHostListItemProps {
  host: ZabbixHost;
  isSelected: boolean;
  onToggle: (host: ZabbixHost, checked: boolean) => void;
}

export const ZabbixHostListItem: React.FC<ZabbixHostListItemProps> = ({
  host,
  isSelected,
  onToggle,
}) => {
  const handleClick = () => {
    onToggle(host, !isSelected);
  };

  const handleCheckboxChange = (checked: boolean) => {
    onToggle(host, checked);
  };

  return (
    <SelectableItem
      selected={isSelected}
      onClick={handleClick}
      onCheckboxChange={handleCheckboxChange}
      selectorType="checkbox"
      icon={<IconDesktop />}
      title={host.name}
      description={`主机名: ${host.host}`}
    />
  );
};
