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

import React from 'react';
import { PREFIX_CLS } from '../constant/const';

export const HotSpot = (props: any) => {
  const { style } = props;
  const PREFIX = PREFIX_CLS.GUIDE;

  return (
    <div className={`${PREFIX}-hotspot`} style={style}>
      <div className={`${PREFIX}-hotspot-outer`} />
      <div className={`${PREFIX}-hotspot-inner`} />
    </div>
  );
};
