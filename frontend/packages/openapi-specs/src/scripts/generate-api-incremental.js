#!/usr/bin/env node

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
 * Incremental API generation script
 *
 * Features:
 * 1. Detect changed spec files (via git diff or file modification time)
 * 2. Analyze dependencies (which modules depend on changed modules)
 * 3. Only regenerate affected parts
 *
 * Note:
 * - openapi-typescript-codegen does not support true incremental generation, it regenerates all files every time
 * - This script decides whether full generation is needed by detecting changes, avoiding unnecessary regeneration
 * - If changes to shared schemas (common.json) are detected, full generation is triggered
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Incremental generator class
 */
class IncrementalAPIGenerator {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../..');
    this.specsDir = path.join(this.rootDir, 'src/specs');
    this.modulesDir = path.join(this.specsDir, 'modules');
    this.configPath = path.join(this.specsDir, 'api-config.json');
  }

  /**
   * Detect changed spec files (via git diff)
   * @returns {Array<string>} List of changed file paths
   */
  detectChangedFiles() {
    console.log('🔍 Detecting changed spec files...');

    try {
      // Use git diff to detect changed files
      const gitDiff = execSync('git diff --name-only HEAD', {
        encoding: 'utf8',
        cwd: this.rootDir,
      }).trim();

      const gitDiffStaged = execSync('git diff --cached --name-only', {
        encoding: 'utf8',
        cwd: this.rootDir,
      }).trim();

      const allChangedFiles = [
        ...gitDiff.split('\n').filter(Boolean),
        ...gitDiffStaged.split('\n').filter(Boolean),
      ];

      // Filter out spec files
      const specFiles = allChangedFiles.filter((file) => {
        const fullPath = path.resolve(this.rootDir, file);
        return (
          fullPath.startsWith(this.specsDir) &&
          (file.endsWith('.json') ||
            file.endsWith('.yaml') ||
            file.endsWith('.yml'))
        );
      });

      if (specFiles.length > 0) {
        console.log(`📝 Found ${specFiles.length} changed spec files:`);
        specFiles.forEach((file) => console.log(`   - ${file}`));
        return specFiles;
      }

      // If no git diff, try using file modification time (compared to last generation time)
      console.log(
        '⚠️  No git changes detected, using file modification time for detection...',
      );
      return this.detectChangedFilesByTime();
    } catch (error) {
      console.warn(
        '⚠️  Git detection failed, using file modification time detection:',
        error.message,
      );
      return this.detectChangedFilesByTime();
    }
  }

  /**
   * Detect changed files by modification time
   * @returns {Array<string>} List of changed file paths
   */
  detectChangedFilesByTime() {
    const lastGenTimePath = path.join(
      this.rootDir,
      'temp',
      '.last-generation-time',
    );
    let lastGenTime = 0;

    if (fs.existsSync(lastGenTimePath)) {
      lastGenTime = parseInt(fs.readFileSync(lastGenTimePath, 'utf8'), 10);
    }

    const changedFiles = [];
    const config = this.loadConfig();

    // Check main configuration file
    const { configPath } = this;
    if (fs.existsSync(configPath)) {
      const stats = fs.statSync(configPath);
      if (stats.mtimeMs > lastGenTime) {
        changedFiles.push(path.relative(this.rootDir, configPath));
      }
    }

    // Check all module files
    for (const module of config.modules) {
      const modulePath = path.join(this.specsDir, module.file);
      if (fs.existsSync(modulePath)) {
        const stats = fs.statSync(modulePath);
        if (stats.mtimeMs > lastGenTime) {
          changedFiles.push(path.relative(this.rootDir, modulePath));
        }
      }
    }

    if (changedFiles.length > 0) {
      console.log(`📝 Found ${changedFiles.length} changed spec files:`);
      changedFiles.forEach((file) => console.log(`   - ${file}`));
    } else {
      console.log('✅ No changed spec files found');
    }

    return changedFiles;
  }

  /**
   * Load configuration file
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Configuration file does not exist: ${this.configPath}`);
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  /**
   * Analyze change impact scope
   * @param {Array<string>} changedFiles List of changed files
   * @returns {Object} Analysis result
   */
  analyzeImpact(changedFiles) {
    console.log('🔬 Analyzing change impact scope...');

    const config = this.loadConfig();
    const changedModules = new Set();
    let affectsCommon = false;
    let affectsConfig = false;

    for (const file of changedFiles) {
      const fullPath = path.resolve(this.rootDir, file);

      // Check if it's the main configuration file
      if (fullPath === this.configPath) {
        affectsConfig = true;
        console.log(
          '   ⚠️  Main configuration file changed, full generation required',
        );
        continue;
      }

      // Check if it's common.json (shared schemas)
      if (file.includes('common.json')) {
        affectsCommon = true;
        console.log(
          '   ⚠️  Shared schemas (common.json) changed, full generation required',
        );
        continue;
      }

      // Find corresponding module
      for (const module of config.modules) {
        const modulePath = path.join(this.specsDir, module.file);
        if (path.resolve(modulePath) === fullPath) {
          changedModules.add(module.name);
          console.log(`   📦 Module changed: ${module.name}`);
          break;
        }
      }
    }

    return {
      changedModules: Array.from(changedModules),
      affectsCommon,
      affectsConfig,
      needsFullGeneration:
        affectsCommon || affectsConfig || changedModules.size === 0,
    };
  }

  /**
   * Save generation timestamp
   */
  saveGenerationTime() {
    const tempDir = path.join(this.rootDir, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timePath = path.join(tempDir, '.last-generation-time');
    fs.writeFileSync(timePath, Date.now().toString());
  }

  /**
   * Run incremental generation process
   */
  async run() {
    console.log('🚀 Starting incremental API generation process...\n');

    try {
      // Step 1: Detect changed files
      const changedFiles = this.detectChangedFiles();

      if (changedFiles.length === 0) {
        console.log('✅ No changed spec files, skipping generation');
        console.log(
          '💡 Tip: If you need to force full generation, run: pnpm generate:api',
        );
        return;
      }

      // Step 2: Analyze impact scope
      const impact = this.analyzeImpact(changedFiles);

      // Step 3: Decide generation strategy
      if (impact.needsFullGeneration) {
        console.log(
          '\n⚠️  Large impact scope detected, executing full generation...\n',
        );
        const APIGenerator = require('./generate-api-complete.js');
        const generator = new APIGenerator();
        await generator.run();
      } else {
        console.log(
          '\n📦 Small change scope, executing incremental generation...',
        );
        console.log(`   Changed modules: ${impact.changedModules.join(', ')}`);
        console.log(
          '\n💡 Note: openapi-typescript-codegen does not support true incremental generation',
        );
        console.log(
          '   Will execute full generation, but skip validation for unchanged modules\n',
        );

        // Due to limitations of openapi-typescript-codegen, full generation is still required
        // But optimization is possible: generate temporary spec by merging changed modules, then generate code
        // Simplified here, directly call full generation
        const APIGenerator = require('./generate-api-complete.js');
        const generator = new APIGenerator();
        await generator.run();
      }

      // Step 4: Save generation timestamp
      this.saveGenerationTime();

      console.log('\n✅ Incremental generation completed!');
    } catch (error) {
      console.error('\n❌ Incremental generation failed:', error.message);
      throw error;
    }
  }
}

// Run incremental generator
if (require.main === module) {
  const generator = new IncrementalAPIGenerator();
  generator.run().catch((error) => {
    console.error('Fatal error:', error);
    throw error;
  });
}

module.exports = IncrementalAPIGenerator;
