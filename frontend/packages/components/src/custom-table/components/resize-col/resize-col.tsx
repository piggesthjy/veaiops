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

import { type FC, forwardRef } from 'react';
import { Resizable, type ResizeCallbackData } from 'react-resizable';

const CustomResizeHandle = forwardRef<HTMLSpanElement, { handleAxis?: string }>(
  (props, ref) => {
    const { handleAxis, ...restProps } = props;
    return (
      <span
        ref={ref}
        className={`react-resizable-handle react-resizable-handle-${handleAxis}`}
        {...restProps}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
    );
  },
);

const ResizableTableTitle: FC<{
  onResize?: (event: React.SyntheticEvent, data: ResizeCallbackData) => void;
  width: number;
  handleAxis?: string;
  [key: string]: unknown;
}> = (props) => {
  const { onResize, width, handleAxis = 'se', ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      handle={<CustomResizeHandle handleAxis={handleAxis} />}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

export { ResizableTableTitle };
