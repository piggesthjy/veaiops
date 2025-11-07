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

const { PythonCodeAnalyzer } = require('./analyzer');

// 如果直接运行此脚本
if (require.main === module) {
  const analyzer = new PythonCodeAnalyzer();
  analyzer.generate().catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    throw error;
  });
}

module.exports = { PythonCodeAnalyzer };
