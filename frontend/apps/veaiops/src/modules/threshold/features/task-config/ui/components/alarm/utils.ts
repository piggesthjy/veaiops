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

import type { SyncAlarmRulesPayload } from 'api-generate';
import { EventLevel } from 'api-generate';
import {
  DATASOURCE_TYPE_LABELS,
  TASK_STATUS_LABELS,
} from '../shared/constants';
import type { ContactGroup } from '../shared/types';

/**
 * 获取数据源类型标签
 */
export const getDatasourceTypeLabel = (type: string): string => {
  return DATASOURCE_TYPE_LABELS[type] || type;
};

/**
 * 获取任务状态标签
 */
export const getTaskStatusLabel = (status?: string): string => {
  if (!status) {
    return '-';
  }
  return TASK_STATUS_LABELS[status] || status;
};

/**
 * 转换联系组为选择器选项
 */
export const transformContactGroupsToOptions = (
  contactGroups: ContactGroup[],
) => {
  return contactGroups.map((group) => ({
    label:
      group.name ||
      group.ContactGroupName ||
      group.Name ||
      group.ContactGroupId ||
      '',
    value: group.id || group.ContactGroupId || group.Name || '',
  }));
};

/**
 * 构建告警规则提交数据
 */
export const buildAlarmSubmitData = (
  formValues: Record<string, unknown>,
  task: Record<string, unknown>,
  datasourceType: string,
): { success: boolean; data?: SyncAlarmRulesPayload; error?: string } => {
  try {
    // 验证必需的任务信息
    if (!task?._id) {
      return {
        success: false,
        error: '缺少任务ID，无法创建告警规则',
      };
    }

    // 构建基础数据（对所有数据源都必需）
    const submitData: Partial<SyncAlarmRulesPayload> & {
      task_id: string;
      task_version_id: string;
      alarm_level: SyncAlarmRulesPayload['alarm_level'];
    } = {
      task_id: task.task_id as string, // 使用任务ID而不是name
      task_version_id: task._id as string, // 使用任务版本ID
      alarm_level:
        (formValues.alarmLevel as SyncAlarmRulesPayload['alarm_level']) ||
        EventLevel.P2,
    };

    // 根据数据源类型添加相应的字段
    // 注意：Zabbix 复用 contact_group_ids 和 alert_methods 字段
    //  - contact_group_ids 在 Zabbix 中对应 usergroup_ids
    //  - alert_methods 在 Zabbix 中对应 mediatype_ids
    if (datasourceType === 'Volcengine') {
      // Volcengine: 只有选择了alert_methods时才需要contact_group_ids
      const { alertMethods } = formValues;
      const hasAlertMethods =
        alertMethods && Array.isArray(alertMethods) && alertMethods.length > 0;

      if (hasAlertMethods) {
        submitData.alert_methods = alertMethods;

        // 如果选择了告警通知方式，必须同时选择联系组
        if (!formValues.contactGroupId) {
          return {
            success: false,
            error: 'Volcengine数据源选择告警通知方式后，必须同时选择联系组',
          };
        }
        submitData.contact_group_ids = [formValues.contactGroupId];
      } else if (formValues.contactGroupId) {
        // 如果只选择了联系组但没有选择告警通知方式，给出提示
      }
    } else if (datasourceType === 'Aliyun') {
      // Aliyun: 联系组可选，不选时仅通过Webhook投递
      if (formValues.contactGroupId) {
        submitData.contact_group_ids = [formValues.contactGroupId];
      }
    } else if (datasourceType === 'Zabbix') {
      // Zabbix: 复用 contact_group_ids (对应usergroup_ids) 和 alert_methods (对应mediatype_ids)
      const { alertMethods, contactGroupId } = formValues;

      // ✅ 修复：初始化为空数组，不选择时传空数组而不是不传字段
      submitData.alert_methods = [];
      submitData.contact_group_ids = [];

      // 如果选择了告警通知方式（媒介类型）
      if (
        alertMethods &&
        Array.isArray(alertMethods) &&
        alertMethods.length > 0
      ) {
        submitData.alert_methods = alertMethods; // Zabbix的媒介类型ID列表

        // 如果选择了告警通知方式，必须同时选择用户组
        if (!contactGroupId) {
          return {
            success: false,
            error: 'Zabbix数据源选择告警通知方式后，必须同时选择告警组',
          };
        }
        submitData.contact_group_ids = [contactGroupId]; // Zabbix的用户组ID列表
      } else if (contactGroupId) {
        // 如果只选择了用户组但没有选择告警通知方式，只添加contact_group_ids
        submitData.contact_group_ids = [contactGroupId];
      }
    }

    return {
      success: true,
      data: submitData,
    };
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `构建提交数据失败: ${errorMessage}`,
    };
  }
};
