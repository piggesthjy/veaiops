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

import { Button, Typography } from '@arco-design/web-react';
import { IconClose } from '@arco-design/web-react/icon';
import type React from 'react';

import style from './styles';

const { Title } = Typography;

interface PanelHeaderProps {
  onClose: () => void;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({ onClose }) => {
  return (
    <div className={style.panelHeader}>
      <Title heading={6} className={style.panelTitle}>
        全局配置向导
      </Title>
      <Button
        type="text"
        size="small"
        icon={<IconClose />}
        onClick={onClose}
        className={style.closeBtn}
      />
    </div>
  );
};
