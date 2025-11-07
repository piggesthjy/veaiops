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

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { CUSTOM_ELEMENT_CLASS } from '../constant/class-name';
import { setConfig } from '../constant/const';
import { i18n } from '../constant/lang';
import type { IGuide } from '../interface';
import { Mask } from '../mask';
import { Modal } from '../modal';
import {
  getAnchorEl,
  getCusAnchorEl,
  getDocument,
  getDocumentElement,
  getOffsetParent,
  getWindow,
} from '../utils';

const XGuide: React.FC<IGuide> = (props) => {
  const {
    steps,
    localKey,
    mask = true,
    arrow = true,
    hotspot = false,
    closable = true,
    modalClassName = '',
    maskClassName = '',
    expireDate = '',
    step = 0,
    type = 'card',
    beforeStepChange,
    afterStepChange,
    onClose,
    onActionChange,
    stepText,
    getMaskContainer,
    prevText,
    nextText,
    okText,
    lang = 'zh',
    showPreviousBtn = true,
    closeEle,
    theme,
    showStepInfo = false,
    showAction = false,
    hotspotDistance,
    maskClosable = false,
  } = props;

  const [stepIndex, setStepIndex] = useState<number>(-1);

  /* store the initial overflow value of the document */
  const [initOverflowVal, setInitOverflowVal] = useState<string>('');

  /* used to trigger a calculation of anchorEl */
  const [ticker, setTicker] = useState<number>(0);

  const i18nTEXT = useMemo(() => i18n(lang), [lang]);

  const visible = Object.prototype.hasOwnProperty.call(props, 'visible')
    ? props.visible
    : true;

  setConfig(
    type === 'tip' || !mask || mask === 'transparent'
      ? { margin: hotspotDistance || 29, padding: 0 }
      : { margin: hotspotDistance || 23, padding: 8 },
  );

  const anchorEl = useMemo(() => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      const { targetPos, selector } = steps[stepIndex];

      if (selector) {
        return getAnchorEl(selector);
      }

      if (targetPos) {
        return getCusAnchorEl(targetPos);
      }
    }
    return null;
  }, [stepIndex, steps[stepIndex], ticker]);

  const parentEl = useMemo(() => {
    if (!anchorEl) {
      return null;
    }

    const currentStep = steps[stepIndex];
    const shouldUseBody = currentStep?.parent === 'body' || mask;

    if (shouldUseBody) {
      return getDocument(anchorEl as HTMLElement).body;
    }

    return getOffsetParent(anchorEl as HTMLElement);
  }, [anchorEl, steps, stepIndex, mask]);

  /* To cater the cases of using iframe where the anchorEl
   * is not in the same window scope as the code running
   */
  const realWindow = useMemo(
    () => (anchorEl ? getWindow(anchorEl as any) : null),
    [anchorEl],
  );

  const realDocument = useMemo(
    () => (anchorEl ? getDocumentElement(anchorEl as Element) : null),
    [anchorEl],
  );

  const handleClose = (): void => {
    /* If the mask is displayed, the document's overflow value would have been set to `hidden`.
     * It should be recovered to its initial value as saved by initOverflowVal
     */
    // if (mask) {
    (realDocument as HTMLElement).style.overflow = initOverflowVal;
    // }

    const cusAnchor = document.querySelector(CUSTOM_ELEMENT_CLASS);
    if (cusAnchor) {
      document.body.removeChild(cusAnchor);
    }

    setStepIndex(-1);

    onClose?.();
    if (localKey) {
      localStorage.setItem(localKey, 'true');
    }
  };

  const handleChange = (direction: number): void => {
    const nextStepIndex = Math.min(
      Math.max(stepIndex + direction, 0),
      steps.length,
    );
    if (nextStepIndex === stepIndex) {
      return;
    }
    if (nextStepIndex === steps.length) {
      handleClose();
    } else if (stepIndex >= 0) {
      beforeStepChange?.(stepIndex, steps[stepIndex]);
    }
    setStepIndex(nextStepIndex);
  };

  const handleMaskClick = () => {
    if (!maskClosable) {
      return;
    }
    const stepInfo = steps[stepIndex];
    stepInfo?.beforeStepChange?.(stepInfo, stepIndex, steps);
    handleChange(1);
  };

  // skip the guide when click the escape key;
  const handleKeydown = (e: Event): void => {
    const keyboardEvent = e as KeyboardEvent;
    if (
      keyboardEvent.key === 'Escape' &&
      (closable || stepIndex === steps.length - 1)
    ) {
      handleClose();
    }
  };

  useEffect(() => {
    if (visible) {
      const haveShownGuide = localKey ? localStorage.getItem(localKey) : false;
      const expireDateParse = new Date(
        Date.parse(expireDate.replace(/-/g, '/')),
      );
      if (!haveShownGuide && (!expireDate || new Date() <= expireDateParse)) {
        setStepIndex(step);
      }
    } else {
      setStepIndex(-1);
    }
  }, [visible, step]);

  useEffect(() => {
    if (realWindow && realDocument) {
      realWindow.addEventListener('keydown', handleKeydown);

      return () => {
        realWindow.removeEventListener('keydown', handleKeydown);
      };
    }
    return undefined;
  }, [realWindow, realDocument]);

  useEffect(() => {
    if (stepIndex >= 0) {
      afterStepChange?.(stepIndex, steps[stepIndex]);
    }
  }, [stepIndex]);

  useEffect(() => {
    if (mask && realDocument) {
      const curOverflow = realDocument.style.overflow;
      setInitOverflowVal(curOverflow || 'auto');
    }
  }, [mask, realDocument]);

  useEffect(() => {
    if (stepIndex >= 0) {
      const config = {
        childList: true,
        subtree: true,
      };
      const observer = new MutationObserver(() => {
        setTicker(ticker + 1);
      });

      observer.observe(document, config);

      return () => {
        observer.disconnect();
      };
    }
    return undefined;
  }, [stepIndex, ticker]);

  return (!mask || initOverflowVal) && parentEl ? (
    <>
      {mask && (
        <Mask
          mask={mask}
          className={maskClassName}
          anchorEl={anchorEl as Element}
          realWindow={realWindow as Window}
          handleClick={handleMaskClick}
          getMaskContainer={getMaskContainer}
        />
      )}
      <Modal
        type={type}
        anchorEl={anchorEl as HTMLElement}
        parentEl={parentEl as HTMLElement}
        realWindow={realWindow as Window}
        steps={steps}
        stepIndex={stepIndex}
        mask={mask}
        arrow={arrow}
        hotspot={hotspot}
        closable={closable}
        closeEle={closeEle}
        onClose={handleClose}
        onActionChange={
          onActionChange ||
          (() => {
            /* no-op */
          })
        }
        onChange={handleChange}
        stepText={stepText}
        prevText={prevText}
        nextText={nextText}
        okText={okText}
        className={modalClassName}
        TEXT={i18nTEXT}
        theme={theme}
        showPreviousBtn={showPreviousBtn}
        showStepInfo={showStepInfo}
        showAction={showAction}
      />
    </>
  ) : null;
};

export { XGuide };
