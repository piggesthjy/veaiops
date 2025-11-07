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

import { Tooltip } from '@arco-design/web-react';
import type React from 'react';

interface UpdateTooltipProps {
  show: boolean;
  message: string;
  onHide: () => void;
  children: React.ReactNode;
}

export const UpdateTooltip: React.FC<UpdateTooltipProps> = ({
  show,
  message,
  onHide,
  children,
}) => {
  return (
    <Tooltip
      content={message}
      popupVisible={show}
      onVisibleChange={(visible) => {
        if (!visible) {
          onHide();
        }
      }}
      trigger="click"
    >
      {children}
    </Tooltip>
  );
};
