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

import { Button } from '@arco-design/web-react';
import React from 'react';
import { PREFIX_CLS } from '../constant/const';
import { HotSpot } from './hot-spot';

export const RichCard = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  const {
    className,
    modalStyle,
    arrow,
    arrowStyle,
    hotspot,
    hotspotStyle,
    stepInfo,
    stepIndex,
    showPreviousBtn,
    handlePreviousChange,
    _prevText,
    handleNextChange,
    _okText,
  } = props as any;
  const PREFIX = PREFIX_CLS.GUIDE_RICHCARD;

  return (
    <div ref={ref} className={`${PREFIX} ${className}`} style={modalStyle}>
      {/* ARROW */}
      {arrow && <span className={`${PREFIX}-arrow`} style={arrowStyle} />}
      {/* HOT SPOT */}
      {hotspot && <HotSpot style={hotspotStyle} />}
      {/* CLOSE BUTTON */}

      {stepInfo.imageTitle && (
        <div className={`${PREFIX}-image-title`}>{stepInfo.imageTitle}</div>
      )}

      {/* MODAL TITLE */}
      <div className={`${PREFIX}-title ${PREFIX}-title`}>{stepInfo.title}</div>
      {/* MODAL CONTENT */}
      <div className={`${PREFIX}-content ${PREFIX}-content`}>
        {typeof stepInfo.content === 'function'
          ? stepInfo.content()
          : stepInfo.content}
      </div>
      {/* MODAL FOOTER */}
      <div
        className={`${PREFIX}-footer`}
        style={{ justifyContent: 'flex-end' }}
      >
        {/* <span className={`${PREFIX}-footer-text ${PREFIX}-footer-text`}>
          {_stepText(stepIndex + 1, steps.length)}
        </span> */}
        <div className={`${PREFIX}-footer-btn-group`}>
          {showPreviousBtn && stepIndex !== 0 && (
            <Button
              size="small"
              className={`${PREFIX}-footer-prev-btn ${PREFIX}-footer-btn`}
              onClick={handlePreviousChange}
            >
              {_prevText}
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            className={` ${PREFIX}-footer-next-btn ${PREFIX}-footer-btn`}
            onClick={handleNextChange}
          >
            {_okText}
          </Button>
        </div>
      </div>
    </div>
  );
});
