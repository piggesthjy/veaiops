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
 * 生成建议
 */
export function generateRecommendations(): string[] {
  const recommendations: string[] = [];

  // 检查 localStorage 问题
  const guideStore = localStorage.getItem('global-guide-store');
  if (guideStore) {
    try {
      const parsed = JSON.parse(guideStore);
      if ('state' in parsed && 'guideVisible' in parsed.state) {
        recommendations.push(
          '立即清除 localStorage 中的 global-guide-store 项',
        );
        recommendations.push(
          '检查 partialize 配置，确保 guideVisible 不被持久化',
        );
      }
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || 'JSON 格式问题';
      recommendations.push(
        `修复 global-guide-store 的 JSON 格式问题: ${errorMessage}`,
      );
    }
  }

  // 检查 DOM 问题
  const visibleElements = document.querySelectorAll(
    '[class*="global-guide"]:not([style*="display: none"])',
  );
  if (visibleElements.length > 0) {
    recommendations.push('检查全局引导组件的条件渲染逻辑');
    recommendations.push('确保 guideVisible 状态正确控制组件显示');
  }

  // 通用建议
  recommendations.push('使用浏览器开发者工具检查组件状态');
  recommendations.push('检查 React DevTools 中的组件 props 和 state');
  recommendations.push('清除浏览器缓存和 localStorage 后重新测试');

  return recommendations;
}
