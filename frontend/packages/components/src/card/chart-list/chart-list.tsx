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

import { useMemo, useState } from 'react';
import { type Layout, Responsive, WidthProvider } from 'react-grid-layout';

import { layout } from './layout-config';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface ChartListProps {
  hrefList: { src: string }[];
}
const ChartList = ({ hrefList }: ChartListProps): JSX.Element => {
  const [layouts, setLayout] = useState<Layout[]>(layout);

  const onLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    // todo：reload iframe
  };
  const formattedLayouts = useMemo(
    () => ({
      lg: layouts,
    }),
    [layouts],
  );
  return (
    <ResponsiveGridLayout
      autoSizereact-grid-layout
      className="layout relative"
      layouts={formattedLayouts}
      rowHeight={30}
      onLayoutChange={onLayoutChange}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 24, md: 18, sm: 12, xs: 6, xxs: 2 }}
    >
      {hrefList.map((item) => {
        const { src } = item;
        return (
          <div className="bg-white" key={src}>
            <iframe width="100%" height="100%" src={src} />
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
};

export { ChartList };
