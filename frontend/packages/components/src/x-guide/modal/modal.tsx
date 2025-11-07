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
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { OPTIONS } from '../constant/const';
import type { IModal } from '../interface';
import { ScrollEndCb, ScrollStartCb } from '../mask/index';
import {
  getArrowStyle,
  getDocumentElement,
  getHotSpotStyle,
  getModalStyle,
  getNodeName,
  getScrollContainer,
  listScroll,
} from '../utils';
import { Card } from './card';
import { RichCard } from './rich-card';
import { Tip } from './tip';

const Modal: React.FC<IModal> = ({
  anchorEl,
  parentEl,
  realWindow,
  steps,
  stepIndex,
  arrow,
  hotspot,
  closable,
  onClose,
  onChange,
  stepText,
  nextText,
  okText,
  className,
  type,
  TEXT,
  prevText,
  showPreviousBtn,
  closeEle,
  theme,
  showStepInfo,
  showAction,
  onActionChange,
}) => {
  const { MARGIN } = OPTIONS;
  const stepInfo = steps[stepIndex];
  const prefix = 've-o-guide';

  const visible = Object.prototype.hasOwnProperty.call(stepInfo, 'visible')
    ? stepInfo.visible
    : true;

  const modalRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>(0);

  /* The ref to the currently focused element */
  const focusedElRef = useRef<HTMLElement | null>(null);

  /* the index of the focused element in the NodeList `focusableEls` */
  const focusedIdxRef = useRef<number>(0);

  const [modalStyle, setModalStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const [hotspotStyle, setHotspotStyle] = useState({});

  const scrollContainer = useMemo(
    () => getScrollContainer(anchorEl),
    [anchorEl],
  );

  const _okText =
    stepIndex !== steps.length - 1
      ? nextText || TEXT('NEXT_STEP')
      : okText || TEXT('I_KNOW');
  const _prevText = prevText || TEXT('PREV_STEP');
  const _closeText = TEXT('CLOSE');

  const _stepText = stepText || ((idx, len) => `${idx}/${len}`);

  const calculateStyle = (): void => {
    const { placement, offset, marginNumber = 24 } = stepInfo;

    const modalEl = modalRef.current;

    if (!modalEl) {
      return;
    }

    const modalStyle = getModalStyle(
      modalEl,
      anchorEl,
      parentEl,
      scrollContainer,
      placement,
      offset,
    );
    const arrowStyle = getArrowStyle(modalEl, placement, marginNumber);
    const hotspotStyle = getHotSpotStyle(
      arrowStyle as Record<string, number>,
      placement,
    );

    setModalStyle(modalStyle);
    setArrowStyle(arrowStyle);
    setHotspotStyle(hotspotStyle);
  };

  const handleNextChange = (): void => {
    stepInfo.beforeStepChange?.(stepInfo, stepIndex, steps);
    onChange(1);
  };

  const handleActionChange = (action: string): void => {
    stepInfo.beforeStepChange?.(stepInfo, stepIndex, steps);
    onChange(1);
    onActionChange?.(action);
  };

  const handlePreviousChange = (): void => {
    stepInfo.beforeStepChange?.(stepInfo, stepIndex, steps);
    onChange(-1);
  };

  const handleScroll = (): void => {
    if (stepInfo.disableScroll) {
      return;
    }
    const modalEl = modalRef.current;
    const anchorPos = anchorEl.getBoundingClientRect();
    const modalPos = (modalEl as Element).getBoundingClientRect();
    const scrollPos = scrollContainer.getBoundingClientRect();

    const isScrollContainerHtml = getNodeName(scrollContainer) === 'html';

    /* scroll the scroll container to show the modal */
    const visibleHeight = (scrollContainer as HTMLElement).clientHeight;
    const scrollContainerTop = isScrollContainerHtml ? 0 : scrollPos.top;
    const isContainerScroll = // Modal is below the viewport
      anchorPos.top -
        scrollContainerTop +
        anchorPos.height +
        modalPos.height +
        MARGIN >=
        visibleHeight ||
      // Modal is above the viewport
      anchorPos.top <= modalPos.height + MARGIN;
    if (isContainerScroll) {
      const top =
        scrollContainer.scrollTop +
        anchorPos.top -
        scrollContainerTop +
        anchorPos.height / 2 -
        visibleHeight / 2 +
        MARGIN;
      // scrolls to a particular set of coordinates inside a given element.
      setModalStyle({
        ...modalStyle,
        opacity: 0,
      });
      ScrollStartCb();
      listScroll(scrollContainer as any, top, () => {
        calculateStyle();
        ScrollEndCb();
      });
    } else if (isScrollContainerHtml) {
      if (type === 'tip') {
        calculateStyle();
      } else {
        setTimeout(() => {
          calculateStyle();
        }, 0);
      }
    }
    if (getNodeName(scrollContainer) === 'html') {
      return;
    }

    const documentEl = getDocumentElement(anchorEl);
    const top =
      documentEl.scrollTop +
      scrollPos.top +
      scrollPos.height / 2 -
      window.innerHeight / 2 +
      MARGIN;
    /* scroll to show the scroll container */
    if (
      // Modal is below the viewport
      documentEl.scrollHeight > documentEl.clientHeight &&
      document.body.scrollHeight - document.body.clientHeight > top &&
      (scrollPos.top + scrollPos.height >= window.innerHeight ||
        scrollPos.bottom > scrollPos.height)
    ) {
      // scrolls to a particular set of coordinates inside a given element.
      setModalStyle({
        ...modalStyle,
        opacity: 0,
      });
      ScrollStartCb();
      listScroll(documentEl, top, () => {
        calculateStyle();
        ScrollEndCb();
      });
    } else if (!isContainerScroll) {
      if (type === 'tip') {
        calculateStyle();
      } else {
        setTimeout(() => {
          calculateStyle();
        }, 0);
      }
    }
  };

  const handleResize = (): void => {
    if (timerRef.current) {
      realWindow.cancelAnimationFrame(timerRef.current);
    }
    timerRef.current = realWindow.requestAnimationFrame(() => {
      calculateStyle();
    });
  };

  const handleKeydown = (e: KeyboardEvent | { keyCode: number }): void => {
    const focusableEls: NodeListOf<HTMLElement> | null =
      modalRef.current?.querySelectorAll(
        `.${prefix}-title, .${prefix}-content, .${prefix}-footer-text, .${prefix}-footer-btn`,
      ) || null;
    if (!focusableEls?.length) {
      return;
    }
    if (e.keyCode !== 9 || !focusableEls) {
      return;
    }

    (e as KeyboardEvent)?.preventDefault?.();

    const idx = focusedIdxRef.current;
    const len = focusableEls.length;
    const ele = focusableEls[idx];

    focusedElRef.current?.blur();
    ele.focus();
    focusedElRef.current = ele;

    if (idx === len - 1 && !(e as KeyboardEvent).shiftKey) {
      focusedIdxRef.current = 0;
    } else if (idx === 0 && (e as KeyboardEvent).shiftKey) {
      focusedIdxRef.current = len - 1;
    } else if ((e as KeyboardEvent).shiftKey) {
      focusedIdxRef.current--;
    } else {
      focusedIdxRef.current++;
    }
  };

  useEffect(() => {
    if (stepInfo.skip) {
      onChange(1);
      return undefined;
    }
    if (visible) {
      focusedIdxRef.current = 0;

      handleScroll();
      handleKeydown({ keyCode: 9 });

      realWindow.addEventListener('resize', handleResize);
      realWindow.addEventListener('keydown', handleKeydown);

      return () => {
        realWindow.removeEventListener('resize', handleResize);
        realWindow.removeEventListener('keydown', handleKeydown);
      };
    }
    return undefined;
  }, [visible, stepInfo, anchorEl]);

  const Com = { tip: Tip, richCard: RichCard }[type] || Card;

  return visible
    ? createPortal(
        <Com
          className={className}
          type={type}
          modalStyle={modalStyle}
          arrow={arrow}
          arrowStyle={arrowStyle}
          hotspot={hotspot}
          hotspotStyle={hotspotStyle}
          closeEle={closeEle}
          onClose={onClose}
          closable={closable}
          stepInfo={stepInfo}
          _stepText={
            typeof _stepText === 'function' ? _stepText : () => _stepText || ''
          }
          stepIndex={stepIndex}
          steps={steps}
          showPreviousBtn={showPreviousBtn}
          handlePreviousChange={handlePreviousChange}
          _prevText={
            typeof _prevText === 'string' ? _prevText : String(_prevText || '')
          }
          handleNextChange={handleNextChange}
          _okText={
            typeof _okText === 'string' ? _okText : String(_okText || '')
          }
          _closeText={
            typeof _closeText === 'string'
              ? _closeText
              : String(_closeText || '')
          }
          ref={modalRef}
          showStepInfo={showStepInfo}
          theme={theme}
          showAction={showAction}
          handleActionChange={handleActionChange}
        />,
        parentEl,
      )
    : null;
};

export { Modal };
