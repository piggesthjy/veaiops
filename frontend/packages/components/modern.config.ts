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

import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es6',
      outDir: 'dist/esm',
      dts: {
        tsconfigPath: './tsconfig.json',
      },
      style: {
        less: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
      alias: {
        '@/*': './src/*',
        '@/custom-table/*': './src/custom-table/*',
      },
      externals: [
        'react',
        'react-dom',
        '@arco-design/web-react',
        'lodash-es',
        'react-resizable',
      ],
    },
    {
      buildType: 'bundle',
      format: 'cjs',
      target: 'es6',
      outDir: 'dist/cjs',
      dts: {
        tsconfigPath: './tsconfig.json',
      },
      style: {
        less: {
          lessOptions: {
            javascriptEnabled: true,
          },
        },
      },
      alias: {
        // Use wildcard to match all paths (Modern.js will auto-resolve entry files like index.ts)
        // The @/* wildcard matches all @/xxx paths, including the directory itself (will auto-find index.ts)
        '@/*': './src/*',
        // Explicitly map the types directory to ensure the bundler resolves correctly (bundle mode requires explicit file paths)
        '@/custom-table/types': './src/custom-table/types/index.ts',
        '@/custom-table/types/*': './src/custom-table/types/*',
      },
      externals: [
        'react',
        'react-dom',
        '@arco-design/web-react',
        'lodash-es',
        'react-resizable',
      ],
    },
  ],
});
