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
 * 全局引导埋点追踪器
 * 用于收集用户行为数据，优化引导体验
 */

/**
 * 通用追踪方法参数接口
 */
interface TrackParams {
  eventName: string;
  properties: Record<string, any>;
}

export class GlobalGuideTracker {
  private userId: string;
  private sessionId: string;

  constructor() {
    this.userId = this.getUserId();
    this.sessionId = this.generateSessionId();
  }

  /**
   * 获取用户ID
   */
  private getUserId(): string {
    // 从localStorage或用户信息中获取
    return localStorage.getItem('userId') || 'anonymous';
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 追踪步骤查看
   */
  trackStepView(stepNumber: number): void {
    this.track({
      eventName: 'guide_step_view',
      properties: {
        step_number: stepNumber,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪步骤完成
   */
  trackStepComplete(stepNumber: number): void {
    this.track({
      eventName: 'guide_step_complete',
      properties: {
        step_number: stepNumber,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪提示点击
   */
  trackHintClick({
    stepNumber,
    hintType,
  }: {
    stepNumber: number;
    hintType: string;
  }): void {
    this.track({
      eventName: 'guide_hint_click',
      properties: {
        step_number: stepNumber,
        hint_type: hintType,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪快速修复
   */
  trackQuickFix({
    stepNumber,
    fixType,
  }: {
    stepNumber: number;
    fixType: string;
  }): void {
    this.track({
      eventName: 'guide_fix_click',
      properties: {
        step_number: stepNumber,
        fix_type: fixType,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪路由跳转
   */
  trackRouteJump({
    fromRoute,
    toRoute,
  }: {
    fromRoute: string;
    toRoute: string;
  }): void {
    this.track({
      eventName: 'guide_jump_route',
      properties: {
        from_route: fromRoute,
        to_route: toRoute,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪引导关闭
   */
  trackGuideClose(): void {
    this.track({
      eventName: 'guide_close',
      properties: {
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪引导打开
   */
  trackGuideOpen(): void {
    this.track({
      eventName: 'guide_open',
      properties: {
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪错误发生
   */
  trackError({
    stepNumber,
    errorType,
    errorMessage,
  }: {
    stepNumber: number;
    errorType: string;
    errorMessage: string;
  }): void {
    this.track({
      eventName: 'guide_error',
      properties: {
        step_number: stepNumber,
        error_type: errorType,
        error_message: errorMessage,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪任务创建
   */
  trackTaskCreate({
    taskType,
    platform,
  }: {
    taskType: string;
    platform: string;
  }): void {
    this.track({
      eventName: 'guide_task_create',
      properties: {
        task_type: taskType,
        platform,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪注入操作
   */
  trackInjection({
    platform,
    strategy,
    success,
  }: {
    platform: string;
    strategy: string;
    success: boolean;
  }): void {
    this.track({
      eventName: 'guide_injection',
      properties: {
        platform,
        strategy,
        success,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 追踪版本管理
   */
  trackVersionManagement({
    action,
    versionNumber,
  }: {
    action: string;
    versionNumber: number;
  }): void {
    this.track({
      eventName: 'guide_version_management',
      properties: {
        action,
        version_number: versionNumber,
        timestamp: Date.now(),
        user_id: this.userId,
        session_id: this.sessionId,
      },
    });
  }

  /**
   * 通用追踪方法
   */
  private track({ eventName, properties }: TrackParams): void {
    try {
      // 这里可以集成实际的埋点服务
      // 例如：analytics.track(eventName, properties);

      // 存储到本地用于调试
      const trackingData = {
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
      };

      const existingData = JSON.parse(
        localStorage.getItem('guide_tracking') || '[]',
      );
      existingData.push(trackingData);

      // 只保留最近100条记录
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }

      localStorage.setItem('guide_tracking', JSON.stringify(existingData));
    } catch (error) {
      // console.error 已移除
    }
  }

  /**
   * 获取追踪数据
   */
  getTrackingData(): any[] {
    try {
      return JSON.parse(localStorage.getItem('guide_tracking') || '[]');
    } catch (error) {
      console.error('Error getting tracking data:', error);
      return [];
    }
  }

  /**
   * 清除追踪数据
   */
  clearTrackingData(): void {
    localStorage.removeItem('guide_tracking');
  }
}

// 创建全局实例
export const globalGuideTracker = new GlobalGuideTracker();
