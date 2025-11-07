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

const fs = require('fs');

/**
 * 文件工具函数
 */
class FileUtils {
  /**
   * 递归查找Python文件
   */
  static findPythonFiles(dirPath) {
    const files = [];

    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = require('path').join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...FileUtils.findPythonFiles(fullPath));
      } else if (item.endsWith('.py') && item !== '__init__.py') {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * 加载API配置
   */
  static loadConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️  配置文件不存在: ${configPath}`);
      return { schemas: {} };
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(
        `📋 加载API配置: ${Object.keys(config.schemas || {}).length} 个额外schemas`,
      );
      return config;
    } catch (error) {
      console.warn(`⚠️  读取配置文件失败: ${error.message}`);
      return { schemas: {} };
    }
  }
}

module.exports = { FileUtils };
