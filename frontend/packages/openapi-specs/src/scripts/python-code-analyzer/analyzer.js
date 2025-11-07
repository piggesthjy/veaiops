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
const path = require('path');
const { FileUtils } = require('./file-utils');
const { CodeParser } = require('./code-parser');
const { TypeConverter } = require('./type-converter');
const { OpenAPIGenerator } = require('./openapi-generator');

/**
 * Python代码分析器
 * 直接解析Python FastAPI代码生成OpenAPI规范
 */
class PythonCodeAnalyzer {
  constructor() {
    this.pythonRoutersPath = path.resolve(
      __dirname,
      '../../../../../../veaiops/handler/routers/apis/v1',
    );
    this.pythonSchemaPath = path.resolve(
      __dirname,
      '../../../../../../veaiops/schema',
    );
    this.configPath = path.resolve(__dirname, '../../specs/api-config.json');
  }

  /**
   * 加载API配置
   */
  loadConfig() {
    return FileUtils.loadConfig(this.configPath);
  }

  /**
   * 分析所有Python路由文件
   */
  analyzeAllRouters() {
    console.log('🔍 分析Python路由文件...');

    const routers = [];
    const routerFiles = FileUtils.findPythonFiles(this.pythonRoutersPath);

    for (const filePath of routerFiles) {
      const routerInfo = this.analyzeRouterFile(filePath);
      if (routerInfo) {
        routers.push(routerInfo);
      }
    }

    console.log(`📊 发现 ${routers.length} 个路由文件`);
    return routers;
  }

  /**
   * 分析单个路由文件
   */
  analyzeRouterFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.pythonRoutersPath, filePath);

      console.log(`📄 分析文件: ${relativePath}`);

      // 提取路由器信息
      const routerInfo = {
        file: relativePath,
        prefix: CodeParser.extractRouterPrefix(content, relativePath),
        tags: CodeParser.extractTags(content, relativePath),
        endpoints: CodeParser.extractEndpoints(
          content,
          CodeParser.extractFunctionDocstring,
          (content, functionName) =>
            CodeParser.extractFunctionParameters(
              content,
              functionName,
              CodeParser.parseParameter,
            ),
        ),
        models: CodeParser.extractModels(content, (body) =>
          TypeConverter.extractModelFields(body, (type) =>
            TypeConverter.pythonTypeToOpenAPI(type),
          ),
        ),
      };

      console.log(`   - 前缀: ${routerInfo.prefix}`);
      console.log(`   - 标签: ${routerInfo.tags.join(', ')}`);
      console.log(`   - 端点: ${routerInfo.endpoints.length} 个`);
      console.log(`   - 模型: ${routerInfo.models.length} 个`);

      return routerInfo;
    } catch (error) {
      console.warn(`⚠️  分析文件失败 ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * 生成完整的OpenAPI规范
   */
  generateOpenAPISpec(config) {
    // 加载额外的配置
    const apiConfig = this.loadConfig();

    const routers = this.analyzeAllRouters();
    return OpenAPIGenerator.generateOpenAPISpec(
      config,
      routers,
      apiConfig,
      (type) => TypeConverter.pythonTypeToOpenAPI(type),
    );
  }

  /**
   * 主执行方法：分析Python代码并生成OpenAPI规范文件
   */
  async generate() {
    try {
      console.log('🔍 开始分析Python代码...');

      // 1. 分析所有路由
      const routers = this.analyzeAllRouters();
      console.log(`📊 发现 ${routers.length} 个路由文件`);

      // 2. 提取所有端点
      const allEndpoints = [];
      for (const router of routers) {
        allEndpoints.push(...router.endpoints);
      }
      console.log(`🔗 发现 ${allEndpoints.length} 个API端点`);

      // 3. 生成OpenAPI规范
      const config = {
        title: 'VolcAIOpsKit API',
        version: '1.0.0',
        description:
          'Auto-generated API specification from Python FastAPI code',
        endpoints: allEndpoints,
      };

      const openApiSpec = this.generateOpenAPISpec(config);

      // 4. 保存到文件
      const outputPath = path.resolve(__dirname, '../../../openapi-spec.json');
      fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));

      console.log(`✅ OpenAPI规范已生成: ${outputPath}`);
      console.log(
        `📄 包含 ${Object.keys(openApiSpec.paths || {}).length} 个API路径`,
      );
      console.log(
        `🏗️  包含 ${Object.keys(openApiSpec.components?.schemas || {}).length} 个数据模型`,
      );

      return openApiSpec;
    } catch (error) {
      console.error('❌ 分析Python代码失败:', error.message);
      throw error;
    }
  }
}

module.exports = { PythonCodeAnalyzer };
