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

import { GlobalGuideStepNumber } from '../enums/guide-steps.enum';
import type { GlobalGuideStep, GuideConfig } from './types';

/**
 * Intelligent threshold configuration wizard step configuration
 */
export const GUIDE_STEPS_CONFIG: GlobalGuideStep[] = [
  {
    number: GlobalGuideStepNumber.CONNECTION,
    title: '连接管理',
    description: '点击配置监控数据源连接',
    route: '/system/datasource', // 🔥 Remove URL parameters, only navigate to page
    icon: 'IconLink',
    frontendFeatures: [
      {
        id: 'new-connection',
        name: '新建连接',
        description: '创建新的数据源连接',
        selector: '[data-testid="new-connection-btn"]', // New connection button, located in connection management drawer
        tooltipContent: '点击此处创建数据源连接✨',
        actionType: 'navigation', // Need to navigate to page, open connection management drawer and highlight
      },
      {
        id: 'edit-connection',
        name: '编辑连接',
        description: '修改现有连接配置',
        selector: '[data-testid="edit-connection-btn"]',
        tooltipContent:
          '请先在列表中选择一条连接记录，然后点击此处的编辑按钮进行修改🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select connection first)
      },
      {
        id: 'test-connection',
        name: '测试连接',
        description: '验证连接是否正常',
        selector: '[data-testid="test-connection-btn"]',
        tooltipContent:
          '请先在列表中选择一条连接记录，然后点击此处的测试按钮验证连接🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select connection first)
      },
      {
        id: 'delete-connection',
        name: '删除连接',
        description: '删除不需要的连接',
        selector: '[data-testid="delete-connection-btn"]',
        tooltipContent:
          '请先在列表中选择一条连接记录，然后点击此处的删除按钮🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select connection first)
      },
    ],
    completionCriteria: [
      '连接健康检查通过',
      '权限校验成功',
      '可拉取项目/产品列表',
    ],
    commonIssues: [
      {
        issue: '连接超时',
        solution: '检查网络连接和Endpoint配置',
        action: '检查连接',
      },
      {
        issue: '凭据无效',
        solution: '验证AK/SK或Token的有效性',
        action: '更新凭据',
      },
      {
        issue: '权限不足',
        solution: '确认账号具有必要的监控权限',
        action: '检查权限',
      },
    ],
  },
  {
    number: GlobalGuideStepNumber.DATASOURCE,
    title: '数据源',
    description: '点击选择平台数据源，配置监控指标来源',
    route: '/system/datasource',
    icon: 'IconStorage',
    frontendFeatures: [
      {
        id: 'new-datasource',
        name: '新增数据源',
        description: '创建新的数据源配置',
        selector: '#new-datasource-btn',
        tooltipContent: '点击此按钮打开新增数据源向导🌟',
        actionType: 'direct', // 🔥 Only highlight, do not auto trigger
      },
      {
        id: 'delete-datasource',
        name: '删除数据源',
        description: '删除不需要的数据源',
        selector: '[data-testid="delete-datasource-btn"]',
        tooltipContent: '点击此处可以删除数据源🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
      },
      {
        id: 'edit-datasource',
        name: '编辑数据源',
        description: '修改现有数据源配置',
        selector: '[data-testid="edit-datasource-btn"]',
        tooltipContent: '点击此处可以对数据源进行修改🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
      },
      {
        id: 'toggle-datasource',
        name: '开启/停用数据源',
        description: '启用或禁用数据源',
        selector: '[data-testid="toggle-datasource-btn"]',
        tooltipContent: '点击此处可以对数据源进行开启/停用🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
      },
    ],
    completionCriteria: [
      '数据源配置完整',
      '近30天空洞率低于阈值',
      '维度/实例可获取',
    ],
    commonIssues: [
      {
        issue: '无可用实例',
        solution: '检查namespace/sub_namespace配置或权限范围',
        action: '刷新重试',
      },
      {
        issue: '空洞率过高',
        solution: '调整时间窗口或变更维度组合',
        action: '调整参数',
      },
      {
        issue: '维度不匹配',
        solution: '检查维度字段映射关系',
        action: '修复映射',
      },
    ],
  },
  {
    number: GlobalGuideStepNumber.TEMPLATE,
    title: '指标配置',
    description: '点击配置指标模版阈值',
    route: '/threshold/template',
    icon: 'IconSettings',
    frontendFeatures: [
      {
        id: 'new-metric',
        name: '新增指标',
        description: '创建新的指标配置',
        selector: '[data-testid="new-metric-template-btn"]',
        tooltipContent: '点击这里可以新增指标配置🌟',
        actionType: 'navigation', // Directly trigger new modal
        placement: 'bottom', // Arrow points downward
      },
      {
        id: 'edit-metric',
        name: '编辑指标',
        description: '修改现有指标配置',
        selector: '[data-testid="edit-metric-template-btn"]',
        tooltipContent:
          '请先在列表中选择一条指标记录，然后点击此处的编辑按钮进行修改🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
      },
      {
        id: 'delete-metric',
        name: '删除指标',
        description: '删除不需要的指标',
        selector: '[data-testid="delete-metric-template-btn"]',
        tooltipContent:
          '请先在列表中选择一条指标记录，然后点击此处的删除按钮🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
      },
    ],
    completionCriteria: [
      '模型选择/创建完成',
      '维度映射无缺失',
      '聚合约束满足',
      '指标配置有效',
      '近7/30天预览正常',
      '覆盖率/空洞率达标',
    ],
    commonIssues: [
      {
        issue: '维度映射缺失',
        solution: '补充必选维度的映射关系',
        action: '修复映射',
      },
      {
        issue: '聚合约束冲突',
        solution: '调整聚合方式或维度组合',
        action: '调整约束',
      },
      {
        issue: '模型模板不匹配',
        solution: '选择适合的模型模板或创建自定义模型',
        action: '选择模板',
      },
      {
        issue: '采样周期不稳',
        solution: '切换采样周期并即时刷新预览',
        action: '调整周期',
      },
      {
        issue: '维度过细导致噪声',
        solution: '建议聚合或过滤部分维度值',
        action: '优化维度',
      },
      {
        issue: '数据质量不达标',
        solution: '检查数据源质量和时间范围',
        action: '检查数据',
      },
    ],
  },
  {
    number: GlobalGuideStepNumber.METRIC_CONFIG,
    title: '智能阈值任务',
    description:
      '点击创建/训练智能阈值任务，生成可对比的版本，查看阈值对比结果',
    route: '/threshold/config',
    icon: 'IconThunderbolt',
    frontendFeatures: [
      {
        id: 'new-task',
        name: '新建任务',
        description: '创建新的智能阈值任务',
        selector: '[data-testid="new-task-btn"]',
        tooltipContent: '点击这里可以创建新的智能阈值任务🌟',
        actionType: 'navigation', // Directly trigger new modal
        placement: 'bottom', // Arrow points downward
      },
      {
        id: 'batch-auto-update',
        name: '批量自动更新',
        description: '批量更新任务配置',
        selector: '[data-testid="batch-auto-update-btn"]',
        tooltipContent:
          '请先在列表中选择一条或多条任务记录，然后点击此处的批量更新按钮🌟',
        actionType: 'direct', // Directly trigger batch update modal
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select task first)
        placement: 'bottom', // Arrow points downward
      },
      {
        id: 'view-task-details',
        name: '查看任务详情',
        description: '查看任务的详细信息',
        selector: '[data-testid="view-task-details-btn"]',
        tooltipContent: '请先在列表中选择一条任务记录，然后点击此处查看详情🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select task first)
      },
      {
        id: 'copy-task',
        name: '复制任务',
        description: '复制现有任务配置',
        selector: '[data-testid="copy-task-btn"]',
        tooltipContent:
          '请先在列表中选择一条任务记录，然后点击此处的复制按钮🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select task first)
      },
      {
        id: 'delete-task',
        name: '删除任务',
        description: '删除不需要的任务及其所有版本',
        selector: '[data-testid="delete-task-btn"]',
        tooltipContent:
          '请先在列表中选择一条任务记录，然后点击此处的删除按钮🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select task first)
      },
      {
        id: 'task-metric-template',
        name: '指标模板配置',
        description: '配置任务下的指标模板',
        selector: '[data-testid="view-task-metric-template-btn"]',
        tooltipContent: '点击此处配置指标模板🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        prerequisiteSteps: ['view-task-details'], // Prerequisite step: need to click view task details first
        allowDisabled: true, // Allow showing guide when button is disabled
      },
      {
        id: 're-execute-task',
        name: '任务重新执行',
        description: '重新执行任务',
        selector: '[data-testid="re-execute-task-btn"]',
        tooltipContent: '点击此处重新执行任务🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        prerequisiteSteps: ['view-task-details'], // Prerequisite step: need to click view task details first
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select task first)
        placement: 'bottom', // Arrow points downward
      },
      {
        id: 'view-cleaning-result',
        name: '查看任务结果',
        description: '查看任务结果',
        selector: '[data-testid="view-task-result-btn"]',
        tooltipContent: '点击此处查看任务结果🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        prerequisiteSteps: ['view-task-details'], // Prerequisite step: need to click view task details first
        allowDisabled: true, // Allow showing guide when button is disabled
      },
      {
        id: 'create-alert-rule',
        name: '创建告警规则',
        description: '为任务创建告警规则',
        selector: '[data-testid="create-alert-rule-btn"]',
        tooltipContent: '点击此处创建告警规则🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        prerequisiteSteps: ['view-task-details'], // Prerequisite step: need to click view task details first
        allowDisabled: true, // Allow showing guide when button is disabled (prompt user to select task first)
        placement: 'bottom', // Arrow points downward
      },
      {
        id: 'view-time-series',
        name: '查看时序图',
        description: '查看指标时序图',
        selector: '[data-testid="view-time-series-btn"]',
        tooltipContent: '点击此处查看时序图🌟',
        actionType: 'navigation', // Need to navigate to page and highlight
        prerequisiteSteps: ['view-task-details', 'view-cleaning-result'], // Prerequisite steps: need to click view task details and view task result first
        allowDisabled: true, // Allow showing guide when button is disabled
      },
    ],
    completionCriteria: ['任务创建成功', '训练完成并生成结果', '版本管理可用'],
    commonIssues: [
      {
        issue: '训练失败',
        solution: '检查算法参数和数据质量，建议重跑',
        action: '重新训练',
      },
      {
        issue: '参数不合理',
        solution: '调整n_count、direction等关键参数',
        action: '调整参数',
      },
      {
        issue: '版本冲突',
        solution: '检查版本状态，必要时回滚到稳定版本',
        action: '版本管理',
      },
    ],
  },
  // ========== System Configuration Module Guide ==========
  {
    number: GlobalGuideStepNumber.BOT_MANAGEMENT,
    title: '群聊机器人管理',
    description: '点击配置群聊机器人，管理Bot配置和群组',
    route: '/system/bot-management',
    icon: 'IconRobot',
    frontendFeatures: [
      {
        id: 'new-bot',
        name: '新增Bot',
        description: '创建新的群聊机器人',
        selector: '[data-testid="new-bot-btn"]',
        tooltipContent: '点击此处创建新的群聊机器人✨',
        actionType: 'navigation',
      },
      {
        id: 'edit-bot',
        name: '编辑Bot',
        description: '修改现有Bot配置',
        selector: '[data-testid="edit-bot-btn"]',
        tooltipContent:
          '请先在列表中选择一条Bot记录，然后点击此处的编辑按钮进行修改🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
      {
        id: 'delete-bot',
        name: '删除Bot',
        description: '删除不需要的Bot',
        selector: '[data-testid="delete-bot-btn"]',
        tooltipContent: '请先在列表中选择一条Bot记录，然后点击此处的删除按钮🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
      {
        id: 'view-bot-attributes',
        name: '特别关注',
        description: '查看Bot的详细属性配置',
        selector: '[data-testid="view-bot-attributes-btn"]',
        tooltipContent:
          '请先在列表中选择一条Bot记录，然后点击此处查看🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
      {
        id: 'group-management',
        name: '群管理',
        description: '管理Bot关联的群组',
        selector: '[data-testid="group-management-btn"]',
        tooltipContent: '请先在列表中选择一条Bot记录，然后点击此处管理群组🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
    ],
    completionCriteria: [
      'Bot配置完整',
      'App ID和Open ID配置正确',
      '群组关联成功',
    ],
    commonIssues: [
      {
        issue: 'App ID无效',
        solution: '检查飞书开放平台的App ID配置是否正确',
        action: '检查配置',
      },
      {
        issue: 'Open ID获取失败',
        solution: '确认Bot已正确安装到群组',
        action: '重新安装',
      },
      {
        issue: '群组无法关联',
        solution: '确认Bot权限和群组权限配置',
        action: '检查权限',
      },
    ],
  },
  {
    number: GlobalGuideStepNumber.CARD_TEMPLATE,
    title: '卡片模版管理',
    description: '点击配置消息卡片模版，用于ChatOps消息展示',
    route: '/system/card-template',
    icon: 'IconCard',
    frontendFeatures: [
      {
        id: 'new-card-template',
        name: '新增卡片模版',
        description: '创建新的消息卡片模版',
        selector: '[data-testid="new-card-template-btn"]',
        tooltipContent: '点击此处创建新的卡片模版✨',
        actionType: 'navigation',
      },
      {
        id: 'edit-card-template',
        name: '编辑卡片模版',
        description: '修改现有卡片模版配置',
        selector: '[data-testid="edit-card-template-btn"]',
        tooltipContent:
          '请先在列表中选择一条模版记录，然后点击此处的编辑按钮进行修改🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
      {
        id: 'delete-card-template',
        name: '删除卡片模版',
        description: '删除不需要的卡片模版',
        selector: '[data-testid="delete-card-template-btn"]',
        tooltipContent:
          '请先在列表中选择一条模版记录，然后点击此处的删除按钮🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
    ],
    completionCriteria: ['模版配置完整', '模版格式验证通过', '可用于消息展示'],
    commonIssues: [
      {
        issue: '模版格式错误',
        solution: '检查模版JSON格式是否符合飞书卡片规范',
        action: '修复格式',
      },
      {
        issue: '字段映射缺失',
        solution: '补充必要的字段映射关系',
        action: '完善映射',
      },
    ],
  },
  {
    number: GlobalGuideStepNumber.ACCOUNT,
    title: '账号管理',
    description: '点击管理系统账号，管理用户权限和角色',
    route: '/system/account',
    icon: 'IconUser',
    frontendFeatures: [
      {
        id: 'new-account',
        name: '新增账号',
        description: '创建新的系统账号',
        selector: '[data-testid="new-account-btn"]',
        tooltipContent: '点击此处创建新的系统账号✨',
        actionType: 'navigation',
      },
      {
        id: 'delete-account',
        name: '删除账号',
        description: '删除不需要的账号',
        selector: '[data-testid="delete-account-btn"]',
        tooltipContent:
          '请先在列表中选择一条账号记录，然后点击此处的删除按钮🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
    ],
    completionCriteria: ['账号信息完整', '权限角色配置正确', '账号状态正常'],
    commonIssues: [
      {
        issue: '权限不足',
        solution: '确认当前账号具有管理员权限',
        action: '检查权限',
      },
      {
        issue: '账号状态异常',
        solution: '检查账号的激活状态和锁定状态',
        action: '更新状态',
      },
    ],
  },
  {
    number: GlobalGuideStepNumber.PROJECT,
    title: '项目管理',
    description: '点击管理项目配置，导入和管理项目信息',
    route: '/system/project',
    icon: 'IconFolder',
    frontendFeatures: [
      {
        id: 'new-project',
        name: '新建项目',
        description: '创建新的项目配置',
        selector: '[data-testid="new-project-btn"]',
        tooltipContent: '点击此处创建新的项目配置✨',
        actionType: 'navigation',
      },
      {
        id: 'import-project',
        name: '导入项目',
        description: '批量导入项目配置',
        selector: '[data-testid="import-project-btn"]',
        tooltipContent: '点击此处批量导入项目配置✨',
        actionType: 'navigation',
      },
      {
        id: 'delete-project',
        name: '删除项目',
        description: '删除不需要的项目',
        selector: '[data-testid="delete-project-btn"]',
        tooltipContent:
          '请先在列表中选择一条项目记录，然后点击此处的删除按钮🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
    ],
    completionCriteria: ['项目信息完整', '项目状态正常', '项目配置可用'],
    commonIssues: [
      {
        issue: '项目导入失败',
        solution: '检查导入文件的格式和必填字段',
        action: '检查文件',
      },
      {
        issue: '项目ID冲突',
        solution: '确认项目ID的唯一性',
        action: '修改ID',
      },
    ],
  },
  // ========== Oncall Change Module Guide ==========
  {
    number: GlobalGuideStepNumber.ONCALL_CONFIG,
    title: '内容识别规则',
    description: '点击配置内容识别规则，管理值班规则和通知策略',
    route: '/oncall/config',
    icon: 'IconSettings',
    frontendFeatures: [
      {
        id: 'edit-oncall-rule',
        name: '编辑规则',
        description: '修改现有规则配置',
        selector: '[data-testid="edit-oncall-rule-btn"]',
        tooltipContent:
          '请先在列表中选择一条规则记录，然后点击此处的编辑按钮进行修改🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
      {
        id: 'toggle-oncall-rule',
        name: '启用/停用规则',
        description: '启用或停用规则',
        selector: '[data-testid="toggle-oncall-rule-btn"]',
        tooltipContent: '点击此处可以启用或停用规则🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
      {
        id: 'view-oncall-rule-details',
        name: '查看规则详情',
        description: '查看规则的详细配置',
        selector: '[data-testid="view-oncall-rule-details-btn"]',
        tooltipContent: '请先在列表中选择一条规则记录，然后点击此处查看详情🌟',
        actionType: 'navigation',
        allowDisabled: true,
      },
    ],
    completionCriteria: ['规则配置完整', '消息卡片通知策略设置正确', '规则状态正常'],
    commonIssues: [
      {
        issue: '规则匹配失败',
        solution: '检查规则的匹配条件和时间窗口配置',
        action: '检查配置',
      },
      {
        issue: '通知发送失败',
        solution: '确认通知渠道和Bot配置正确',
        action: '检查渠道',
      },
    ],
  },
  {
    number: GlobalGuideStepNumber.ONCALL_HISTORY,
    title: 'Oncall异动历史',
    description: '点击查看Oncall异动历史记录和统计',
    route: '/oncall/history',
    icon: 'IconClockCircle',
    frontendFeatures: [
      {
        id: 'view-oncall-history',
        name: '查看历史记录',
        description: '查看历史异动记录',
        selector: '[data-testid="oncall-history-table"]',
        tooltipContent: '此处显示所有Oncall异动历史记录🌟',
        actionType: 'direct',
      },
    ],
    completionCriteria: [
      '历史记录正常显示',
    ],
    commonIssues: [
      {
        issue: '历史记录为空',
        solution: '确认时间范围选择是否正确',
        action: '调整时间范围',
      },
      {
        issue: '导出失败',
        solution: '检查导出文件格式和权限',
        action: '检查权限',
      },
    ],
  },
];

/**
 * Global guide configuration
 */
export const GUIDE_CONFIG: GuideConfig = {
  steps: GUIDE_STEPS_CONFIG,
  theme: 'light',
  position: 'top',
  autoAdvance: true,
  showProgress: true,
};
