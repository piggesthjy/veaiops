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

module.exports = {
  // Frontend file handling (relative to the frontend directory)
  // Exclude the api-generate directory (auto-generated files, skip lint)
  '**/*.{js,jsx,ts,tsx}': [
    (filenames) => {
      // Filter out files under the api-generate directory
      const filtered = filenames.filter(
        (f) => !f.includes('/api-generate/') && !f.includes('\\api-generate\\'),
      );
      if (filtered.length === 0) {
        return 'echo "Skipping api-generate files"';
      }
      // Convert absolute paths to paths relative to the frontend directory
      const relativePaths = filtered.map((f) => {
        const frontendIndex = f.indexOf('/frontend/');
        if (frontendIndex !== -1) {
          return f.substring(frontendIndex + '/frontend/'.length);
        }
        return f;
      });
      return [
        'eslint --fix',
        `biome check --files-ignore-unknown=true --fix ${relativePaths.join(' ')}`,
      ];
    },
  ],
  '**/*.{json,css,scss}': [
    (filenames) => {
      // Convert absolute paths to paths relative to the frontend directory
      const relativePaths = filenames.map((f) => {
        const frontendIndex = f.indexOf('/frontend/');
        if (frontendIndex !== -1) {
          return f.substring(frontendIndex + '/frontend/'.length);
        }
        return f;
      });
      return `biome check --files-ignore-unknown=true --fix ${relativePaths.join(' ')}`;
    },
  ],
  '**/*.less': [
    // Skip Biome checks for Less files; Biome doesn't support Less
    () => 'echo "Skipping Less files - Biome does not support Less"',
  ],
  '**/*.{md,mdx}': [
    // Only basic checks for Markdown; no formatting
    () => 'echo "Skipping markdown files"',
  ],
  'package.json': [],
};
