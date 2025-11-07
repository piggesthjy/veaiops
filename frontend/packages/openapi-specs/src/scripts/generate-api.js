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

/**
 * 为什么禁用 max-lines 规则：
 * - 这是一个代码生成脚本，包含复杂的 OpenAPI 规范处理和代码生成逻辑
 * - 脚本的逻辑完整性和可维护性比行数限制更重要
 * - 拆分脚本会导致逻辑分散，增加理解和维护成本
 * - 生成脚本通常不会被频繁修改，行数问题影响较小
 */
/* eslint-disable max-lines */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Step 0: Helper Functions
// ============================================================================

/**
 * Merge multiple path files
 */
const mergePaths = (specsDir) => {
  const pathsDir = path.join(specsDir, 'paths');
  const paths = {};

  // Check if paths directory exists
  if (fs.existsSync(pathsDir)) {
    // Read all path files
    const pathFiles = fs
      .readdirSync(pathsDir)
      .filter((file) => file.endsWith('.json') && file !== 'index.json');

    for (const file of pathFiles) {
      try {
        const filePath = path.join(pathsDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (content.paths) {
          Object.assign(paths, content.paths);
        }
      } catch (error) {
        console.warn(
          `Warning: Could not read path file ${file}: ${error.message}`,
        );
      }
    }
  }

  return paths;
};

/**
 * Merge module files from modules directory
 */
const mergeModules = (specsDir) => {
  const modulesDir = path.join(specsDir, 'modules');
  const paths = {};
  const schemas = {};

  if (!fs.existsSync(modulesDir)) {
    console.warn('Warning: modules directory not found');
    return { paths, schemas };
  }

  // Read all module files
  const moduleFiles = fs
    .readdirSync(modulesDir)
    .filter((file) => file.endsWith('.json'));

  console.log(`📦 Found ${moduleFiles.length} module files`);

  for (const file of moduleFiles) {
    try {
      const filePath = path.join(modulesDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Merge paths from module
      if (content.paths) {
        Object.assign(paths, content.paths);
        console.log(
          `  ✅ Merged paths from ${file}: ${Object.keys(content.paths).length} endpoints`,
        );
      }

      // Merge schemas from module
      if (content.components?.schemas) {
        Object.assign(schemas, content.components.schemas);
        console.log(
          `  ✅ Merged schemas from ${file}: ${Object.keys(content.components.schemas).length} schemas`,
        );
      }
    } catch (error) {
      console.warn(
        `Warning: Could not read module file ${file}: ${error.message}`,
      );
    }
  }

  return { paths, schemas };
};

/**
 * Merge multiple schema files
 */
const mergeSchemas = (specsDir) => {
  const schemasDir = path.join(specsDir, 'schemas');
  const schemas = {};

  // Check if schemas directory exists
  if (!fs.existsSync(schemasDir)) {
    console.warn('Warning: schemas directory not found');
    return schemas;
  }

  // Read all schema files
  const schemaFiles = fs
    .readdirSync(schemasDir)
    .filter((file) => file.endsWith('.json') && file !== 'index.json');

  for (const file of schemaFiles) {
    try {
      const filePath = path.join(schemasDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Directly merge all top-level properties as schema
      Object.assign(schemas, content);
    } catch (error) {
      console.warn(
        `Warning: Could not read schema file ${file}: ${error.message}`,
      );
    }
  }

  return schemas;
};

/**
 * Recursively inline all $ref references
 */
const inlineRefs = (obj, schemas, visited = new Set()) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => inlineRefs(item, schemas, visited));
  }

  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      // Parse $ref reference
      let schemaName = null;

      if (value.startsWith('#/components/schemas/')) {
        schemaName = value.replace('#/components/schemas/', '');
      } else if (value.includes('#/')) {
        // Handle relative path references like "../schemas/auth.json#/LoginRequest"
        const parts = value.split('#/');
        if (parts.length === 2) {
          schemaName = parts[1];
        }
      } else if (value.startsWith('#/')) {
        // Handle current file references like "#/LoginRequest"
        schemaName = value.replace('#/', '');
      }

      if (schemaName) {
        // Prevent circular references
        if (visited.has(schemaName)) {
          return { $ref: `#/components/schemas/${schemaName}` }; // Standardize reference
        }

        if (schemas[schemaName]) {
          visited.add(schemaName);
          const resolved = inlineRefs(schemas[schemaName], schemas, visited);
          visited.delete(schemaName);
          return resolved;
        } else {
          console.warn(`Warning: Schema ${schemaName} not found`);
          return { $ref: `#/components/schemas/${schemaName}` };
        }
      } else {
        // Keep other types of references
        return { $ref: value };
      }
    } else {
      result[key] = inlineRefs(value, schemas, visited);
    }
  }

  return result;
};

// ============================================================================
// Step 1: Build OpenAPI Specification
// ============================================================================

/**
 * Build OpenAPI specification from modular files
 */
const buildOpenAPI = () => {
  console.log('🔨 Step 1: Building OpenAPI specification...');

  const specsDir = path.resolve(__dirname, '../specs');
  const outputFile = path.resolve(__dirname, '../../../../openapi-spec.json');

  try {
    // Read main file
    const mainFile = path.join(specsDir, 'main.json');
    const mainSpec = JSON.parse(fs.readFileSync(mainFile, 'utf8'));

    // Merge paths and schemas from different sources
    const legacyPaths = mergePaths(specsDir);
    const legacySchemas = mergeSchemas(specsDir);
    const { paths: modulePaths, schemas: moduleSchemas } =
      mergeModules(specsDir);

    // Combine all paths and schemas
    const allPaths = { ...legacyPaths, ...modulePaths };
    const allSchemas = { ...legacySchemas, ...moduleSchemas };

    console.log(
      `📊 Found ${Object.keys(allPaths).length} API paths (${Object.keys(legacyPaths).length} legacy + ${Object.keys(modulePaths).length} modular)`,
    );
    console.log(
      `📋 Found ${Object.keys(allSchemas).length} schemas (${Object.keys(legacySchemas).length} legacy + ${Object.keys(moduleSchemas).length} modular)`,
    );

    // Build complete specification
    const fullSpec = {
      ...mainSpec,
      paths: {
        ...mainSpec.paths,
        ...allPaths,
      },
      components: {
        ...mainSpec.components,
        schemas: {
          ...mainSpec.components.schemas,
          ...allSchemas,
        },
      },
    };

    // Inline all $ref references
    console.log('🔗 Inlining $ref references...');
    const resolvedSpec = inlineRefs(fullSpec, allSchemas);

    // Write output file
    fs.writeFileSync(outputFile, JSON.stringify(resolvedSpec, null, 2));

    console.log('✅ OpenAPI specification built successfully!');
    console.log(`📄 Output: ${outputFile}`);

    // Validate JSON format
    try {
      JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      console.log('✅ Generated JSON is valid');
    } catch (error) {
      console.error('❌ Generated JSON is invalid:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    throw error;
  }
};

// ============================================================================
// Step 1a: Generate OpenAPI spec from Python code analysis
// ============================================================================

/**
 * Generate OpenAPI spec from Python code analysis
 */
const generateFromPythonCode = async () => {
  console.log('🔍 Step 1a: Analyzing Python code...');

  try {
    const { PythonCodeAnalyzer } = require('./python-code-analyzer');
    const analyzer = new PythonCodeAnalyzer();
    await analyzer.generate();
    console.log('✅ Python code analysis completed');
  } catch (error) {
    console.warn(
      '⚠️  Python code analysis failed, falling back to manual specs:',
      error.message,
    );
    // 如果Python代码分析失败，继续使用手动维护的规范
    return false;
  }
  return true;
};

// ============================================================================
// Step 2: Generate TypeScript API Code
// ============================================================================

/**
 * Generate TypeScript API code using openapi-typescript-codegen
 */
const generateAPICode = async () => {
  console.log('🚀 Step 2: Generating TypeScript API code...');

  const inputFile = path.resolve(__dirname, '../../../../openapi-spec.json');
  const outputDir = path.resolve(
    __dirname,
    '../../../../apps/veaiops/api-generate',
  );

  if (!fs.existsSync(inputFile)) {
    throw new Error(`OpenAPI spec file not found: ${inputFile}`);
  }

  // Remove existing generated code
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  // Check for custom openapi-typescript-codegen first
  const localCodegenPath = path.resolve(
    __dirname,
    '../../../../../../openapi-typescript-codegen',
  );

  if (fs.existsSync(localCodegenPath)) {
    console.log('使用自定义的 openapi-typescript-codegen');
    const command = `node ${localCodegenPath}/bin/index.js -i ${inputFile} -o ${outputDir} --name VolcAIOpsApi --client fetch --useOptions --exportCore true --exportServices true --exportModels true --exportSchemas false`;

    execSync(command, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../../../..'),
    });
    console.log('✅ TypeScript API code generated successfully (custom)');
  } else {
    // Try to use programmatic API first
    try {
      const { generate } = require('openapi-typescript-codegen');
      await generate({
        input: inputFile,
        output: outputDir,
        clientName: 'VolcAIOpsApi',
        httpClient: 'fetch',
        useOptions: false,
        useUnionTypes: false,
        exportCore: true,
        exportServices: true,
        exportModels: true,
        exportSchemas: false,
        indent: '2',
        postfixServices: 'Service',
        write: true,
      });
      console.log(
        '✅ TypeScript API code generated successfully (programmatic)',
      );
    } catch (programmaticError) {
      console.warn(
        '⚠️  Programmatic generation failed, falling back to CLI:',
        programmaticError.message,
      );

      const command = `npx openapi-typescript-codegen -i ${inputFile} -o ${outputDir} --name VolcAIOpsApi`;
      execSync(command, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../../../..'),
      });
      console.log('✅ TypeScript API code generated successfully (CLI)');
    }
  }
};

// ============================================================================
// Step 3: Rename Generated Files
// ============================================================================

/**
 * Convert PascalCase or camelCase to kebab-case
 */
const toKebabCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // 在小写字母和大写字母之间插入连字符
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // 处理连续大写字母的情况
    .toLowerCase();
};

/**
 * Convert file name from PascalCase to kebab-case
 */
const convertFileName = (fileName) => {
  const nameWithoutExt = path.parse(fileName).name;
  const { ext } = path.parse(fileName);
  return toKebabCase(nameWithoutExt) + ext;
};

/**
 * Recursively rename files in directory
 */
const renameFilesInDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      renameFilesInDirectory(filePath);
    } else if (file.endsWith('.ts') && file !== 'index.ts') {
      const newFileName = convertFileName(file);
      if (newFileName !== file) {
        const newFilePath = path.join(dirPath, newFileName);

        console.log(`Renaming: ${filePath} -> ${newFilePath}`);
        fs.renameSync(filePath, newFilePath);
      }
    }
  }
};

/**
 * Update import/export statements in files
 */
const updateImports = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      updateImports(filePath);
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      // Update import statements
      const importPatterns = [
        /from '\.\.?\/models\/(\w+)';/g,
        /from '\.\.?\/services\/(\w+)';/g,
        /from '\.\.?\/core\/(\w+)';/g,
        /from '\.\.?\/\.\.?\/models\/(\w+)';/g,
        /from '\.\.?\/\.\.?\/services\/(\w+)';/g,
        /from '\.\.?\/\.\.?\/core\/(\w+)';/g,
        /from '\.\/(\w+)';/g, // Handle direct file references like './VolcAIOpsApi'
      ];

      importPatterns.forEach((pattern) => {
        content = content.replace(pattern, (match, fileName) => {
          const newFileName = convertFileName(`${fileName}.ts`).replace(
            '.ts',
            '',
          );
          if (newFileName !== fileName) {
            updated = true;
            return match.replace(fileName, newFileName);
          }
          return match;
        });
      });

      // Update export statements
      const exportPatterns = [
        /from '\.\/models\/(\w+)';/g,
        /from '\.\/services\/(\w+)';/g,
        /from '\.\/core\/(\w+)';/g,
      ];

      exportPatterns.forEach((pattern) => {
        content = content.replace(pattern, (match, fileName) => {
          const newFileName = convertFileName(`${fileName}.ts`).replace(
            '.ts',
            '',
          );
          if (newFileName !== fileName) {
            updated = true;
            return match.replace(fileName, newFileName);
          }
          return match;
        });
      });

      if (updated) {
        console.log(`Updating imports in: ${filePath}`);
        fs.writeFileSync(filePath, content);
      }
    }
  }
};

/**
 * Rename generated files from PascalCase to kebab-case
 */
const renameGeneratedFiles = () => {
  console.log('🔄 Step 3: Renaming generated files to kebab-case...');

  const apiGeneratePath = path.resolve(
    __dirname,
    '../../../../apps/veaiops/api-generate',
  );

  if (!fs.existsSync(apiGeneratePath)) {
    console.warn('⚠️  API generate directory not found, skipping file renaming');
    return;
  }

  // Step 3.1: Rename files
  console.log('Step 3.1: Renaming files...');
  renameFilesInDirectory(path.join(apiGeneratePath, 'models'));
  renameFilesInDirectory(path.join(apiGeneratePath, 'services'));
  renameFilesInDirectory(path.join(apiGeneratePath, 'core'));
  // Also rename files in the root directory (excluding index.ts)
  renameFilesInDirectory(apiGeneratePath);

  // Step 3.2: Update imports and exports
  console.log('Step 3.2: Updating imports and exports...');
  updateImports(apiGeneratePath);

  console.log('✅ File renaming process completed!');
};

// ============================================================================
// Step 4: Fix OpenAPI Configuration
// ============================================================================

/**
 * Fix OpenAPI configuration for dynamic BASE URL
 */
const fixOpenAPIConfig = () => {
  console.log('🔧 Step 4: Fixing OpenAPI configuration...');

  const openApiFilePath = path.resolve(
    __dirname,
    '../../../../apps/veaiops/api-generate/core/open-api.ts',
  );

  if (!fs.existsSync(openApiFilePath)) {
    console.warn('⚠️  OpenAPI config file not found, skipping fix');
    return;
  }

  let content = fs.readFileSync(openApiFilePath, 'utf8');

  // Replace hardcoded BASE URL with dynamic configuration
  const baseUrlPattern = /BASE:\s*['"`][^'"`]*['"`],/;
  const replacement = `BASE: process.env.REACT_APP_API_BASE_URL || window.location.origin,`;

  if (baseUrlPattern.test(content)) {
    content = content.replace(baseUrlPattern, replacement);
    fs.writeFileSync(openApiFilePath, content);
    console.log('✅ OpenAPI BASE URL configuration fixed');
  } else {
    console.warn('⚠️  BASE URL pattern not found in OpenAPI config');
  }
};

// ============================================================================
// Step 5: Replace Any Types with Unknown
// ============================================================================

/**
 * Replace 'any' types with 'unknown' for better type safety
 */
const replaceAnyWithUnknown = () => {
  console.log('🔄 Step 5: Replacing any types with unknown...');

  const apiGeneratePath = path.resolve(
    __dirname,
    '../../../../apps/veaiops/api-generate',
  );

  if (!fs.existsSync(apiGeneratePath)) {
    console.warn(
      '⚠️  API generate directory not found, skipping any replacement',
    );
    return;
  }

  /**
   * Process a single file to replace 'any' with 'unknown'
   */
  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Replace 'any' types but preserve JSDoc comments and Promise error handlers
    const replacements = [
      // Function parameters: (value: any) =>
      {
        pattern: /\(([^)]*?):\s*any\)/g,
        replacement: (match, paramName) => {
          // Skip if it's a Promise error handler (reason?: any)
          if (
            paramName.includes('reason?') ||
            paramName.includes('onRejected')
          ) {
            return match;
          }
          return match.replace(': any', ': unknown');
        },
      },
      // Variable declarations: : any
      {
        pattern: /:\s*any(?=\s*[;,=)])/g,
        replacement: ': unknown',
      },
      // Generic types: <any>
      {
        pattern: /<any>/g,
        replacement: '<unknown>',
      },
      // Function return types: ): any =>
      {
        pattern: /\):\s*any(?=\s*=>)/g,
        replacement: '): unknown',
      },
      // Promise types: Promise<any>
      {
        pattern: /Promise<any>/g,
        replacement: 'Promise<unknown>',
      },
      // Array types: any[]
      {
        pattern: /\bany\[\]/g,
        replacement: 'unknown[]',
      },
      // Object types: Record<string, any>
      {
        pattern: /Record<([^,]+),\s*any>/g,
        replacement: 'Record<$1, unknown>',
      },
      // Type assertions: as any (but preserve necessary ones in type guards)
      {
        pattern: /\bas\s+any(?!\)\.)/g,
        replacement: 'as unknown',
      },
      // JSDoc return types: @returns any -> @returns unknown
      {
        pattern: /@returns\s+any\s/g,
        replacement: '@returns unknown ',
      },
    ];

    replacements.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          updated = true;
          content = newContent;
        }
      }
    });

    // Additional check for updated flag when using function replacements
    const originalContent = fs.readFileSync(filePath, 'utf8');
    if (content !== originalContent) {
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated types in: ${filePath}`);
    }
  };

  /**
   * Recursively process all TypeScript files in directory
   */
  const processDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.ts')) {
        processFile(filePath);
      }
    }
  };

  // Process all directories
  processDirectory(apiGeneratePath);

  console.log('✅ Any type replacement completed!');
};

// ============================================================================
// Step 5.5: Fix Duplicate Code Issues
// ============================================================================

/**
 * Fix duplicate code issues in generated TypeScript files
 */
const fixDuplicateCode = () => {
  console.log('🔧 Step 5.5: Fixing duplicate code issues...');

  const apiGeneratePath = path.resolve(
    __dirname,
    '../../../../apps/veaiops/api-generate',
  );

  if (!fs.existsSync(apiGeneratePath)) {
    console.warn(
      '⚠️  API generate directory not found, skipping duplicate code fix',
    );
    return;
  }

  /**
   * Process a single file to fix duplicate code
   */
  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Fix duplicate JSON.stringify in getRequestBody function
    const duplicateJsonStringifyPattern =
      /export const getRequestBody = \(options: ApiRequestOptions\): unknown => \{[\s\S]*?\};/;

    if (duplicateJsonStringifyPattern.test(content)) {
      const fixedFunction = `export const getRequestBody = (options: ApiRequestOptions): BodyInit | null => {
  if (options.body !== undefined) {
    if (isString(options.body) || isBlob(options.body) || isFormData(options.body)) {
      return options.body;
    } else {
      return JSON.stringify(options.body);
    }
  }
  return null;
};`;

      content = content.replace(duplicateJsonStringifyPattern, fixedFunction);
      updated = true;
    }

    // Fix sendRequest function parameter type
    const sendRequestPattern =
      /export const sendRequest = async \(\s*config: OpenAPIConfig,\s*options: ApiRequestOptions,\s*url: string,\s*body: unknown,/;
    if (sendRequestPattern.test(content)) {
      content = content.replace(/body: unknown,/, 'body: BodyInit | null,');
      updated = true;
    }

    // Add missing getHeaders function if not present
    if (!content.includes('export const getHeaders')) {
      const getHeadersFunction = `
export const getHeaders = async (config: OpenAPIConfig, options: ApiRequestOptions): Promise<Headers> => {
  const headers = new Headers();

  const token = config.TOKEN;
  const username = config.USERNAME;
  const password = config.PASSWORD;

  if (isStringWithValue(token)) {
    headers.append('Authorization', \`Bearer \${token}\`);
  }

  if (isStringWithValue(username) && isStringWithValue(password)) {
    const credentials = base64(\`\${username}:\${password}\`);
    headers.append('Authorization', \`Basic \${credentials}\`);
  }

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (isDefined(value)) {
        headers.append(key, String(value));
      }
    });
  }

  return headers;
};
`;
      // Insert before sendRequest function
      const sendRequestIndex = content.indexOf('export const sendRequest');
      if (sendRequestIndex !== -1) {
        content = `${content.slice(0, sendRequestIndex)}${getHeadersFunction}\n${content.slice(sendRequestIndex)}`;
        updated = true;
      }
    }

    // Fix resolve type assertion
    const resolvePattern = /resolve\(result\.body\);/;
    if (resolvePattern.test(content)) {
      content = content.replace(resolvePattern, 'resolve(result.body as T);');
      updated = true;
    }

    // Fix duplicate code patterns
    const duplicatePatterns = [
      // Remove duplicate type definitions and functions
      {
        pattern:
          /\};\s*type\s+Resolver<T>\s*=[\s\S]*?export\s+const\s+getHeaders[\s\S]*?return\s+new\s+Headers\(headers\);\s*\};/g,
        replacement: '};',
      },
      // Remove any trailing duplicate resolver/getHeaders after the main ones
      {
        pattern: /(\};)\s*type\s+Resolver<T>[\s\S]*$/,
        replacement: '$1',
      },
    ];

    duplicatePatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    });

    // Fix type issues in helper functions
    const typeFixPatterns = [
      // Fix isBlob function
      {
        pattern:
          /export const isBlob = \(value: unknown\): value is Blob => \{[\s\S]*?\};/,
        replacement: `export const isBlob = (value: unknown): value is Blob => {
  return value != null && typeof value === 'object' &&
    'type' in value && typeof (value as any).type === 'string' &&
    'stream' in value && typeof (value as any).stream === 'function' &&
    'arrayBuffer' in value && typeof (value as any).arrayBuffer === 'function' &&
    'constructor' in value && typeof (value as any).constructor === 'function' &&
    'name' in (value as any).constructor && typeof (value as any).constructor.name === 'string' &&
    /^(Blob|File)$/.test((value as any).constructor.name) &&
    /^(Blob|File)$/.test((value as any)[Symbol.toStringTag]);
};`,
      },
      // Fix getFormData function
      {
        pattern:
          /export const getFormData = \(options: ApiRequestOptions\): FormData \| undefined => \{[\s\S]*?return undefined;\s*\};\s*(?:[\s\S]*?return formData;\s*\}\s*return undefined;\s*\};)?/,
        replacement: `export const getFormData = (options: ApiRequestOptions): FormData | undefined => {
  if (options.formData) {
    const formData = new FormData();

    const process = (key: string, value: unknown) => {
      if (isString(value) || isBlob(value)) {
        formData.append(key, value);
      } else {
        formData.append(key, JSON.stringify(value));
      }
    };

    Object.entries(options.formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => process(key, v));
      } else {
        process(key, value);
      }
    });

    return formData;
  }
  return undefined;
};`,
      },
    ];

    typeFixPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed duplicate code in: ${filePath}`);
    }
  };

  /**
   * Recursively process all TypeScript files in directory
   */
  const processDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.ts') && file.includes('request')) {
        processFile(filePath);
      }
    }
  };

  // Process all directories
  processDirectory(apiGeneratePath);

  console.log('✅ Duplicate code fix completed!');
};

// ============================================================================
// Step 6: Remove Generated Comments
// ============================================================================

/**
 * Remove generated comments from TypeScript files
 */
const removeGeneratedComments = () => {
  console.log('🧹 Step 6: Removing generated comments...');

  const apiGeneratePath = path.resolve(
    __dirname,
    '../../../../apps/veaiops/api-generate',
  );

  if (!fs.existsSync(apiGeneratePath)) {
    console.warn(
      '⚠️  API generate directory not found, skipping comment removal',
    );
    return;
  }

  /**
   * Process a single file to remove generated comments
   */
  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Remove generated comments at the beginning of the file
    const generatedComments = [
      '/* generated using openapi-typescript-codegen -- do not edit */',
      '/* istanbul ignore file */',
      '/* tslint:disable */',
      '/* eslint-disable */',
    ];

    generatedComments.forEach((comment) => {
      if (content.includes(comment)) {
        content = content.replace(`${comment}\n`, '');
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Removed generated comments from: ${filePath}`);
    }
  };

  /**
   * Recursively process all TypeScript files in directory
   */
  const processDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.ts')) {
        processFile(filePath);
      }
    }
  };

  // Process all directories
  processDirectory(apiGeneratePath);

  console.log('✅ Generated comments removed!');
};

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main function to execute all steps
 */
const main = async () => {
  console.log('🎯 Starting complete API generation process...\n');

  try {
    // Step 1a: Optional - Try Python code analysis first
    const pythonAnalysisDone = await generateFromPythonCode();
    if (!pythonAnalysisDone) {
      console.log('Falling back to manual OpenAPI spec.');
      // Step 1: Build OpenAPI specification from manual specs
      buildOpenAPI();
    }
    console.log('');

    // Step 2: Generate TypeScript API code
    await generateAPICode();
    console.log('');

    // Step 3: Rename files to kebab-case
    renameGeneratedFiles();
    console.log('');

    // Step 4: Fix OpenAPI configuration
    fixOpenAPIConfig();
    console.log('');

    // Step 5: Replace 'any' types with 'unknown'
    replaceAnyWithUnknown();
    console.log('');

    // Step 5.5: Fix duplicate code issues
    fixDuplicateCode();
    console.log('');

    // Step 6: Remove generated comments
    removeGeneratedComments();
    console.log('');

    console.log('🎉 Complete API generation process finished successfully!');
    console.log('📁 Generated files location: apps/veaiops/api-generate/');
  } catch (error) {
    console.error('❌ API generation process failed:', error.message);
    throw error;
  }
};

// Execute if this script is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script execution failed:', error);
    throw error;
  });
}

module.exports = {
  buildOpenAPI,
  generateFromPythonCode,
  generateAPICode,
  renameGeneratedFiles,
  fixOpenAPIConfig,
  replaceAnyWithUnknown,
  fixDuplicateCode,
  removeGeneratedComments,
  main,
};
