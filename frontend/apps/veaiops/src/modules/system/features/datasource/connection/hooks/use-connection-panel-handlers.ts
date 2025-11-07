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
 * 连接面板事件处理 Hook
 */

import { Message, Modal } from '@arco-design/web-react';
import type {
  Connect,
  ConnectCreateRequest,
  ConnectUpdateRequest,
} from 'api-generate';
import { getErrorMessage } from '../lib/error-handler';

/**
 * 更新连接参数接口
 */
interface UpdateConnectionParams {
  id: string;
  data: ConnectUpdateRequest;
}

interface UseConnectionPanelHandlersProps {
  editingConnect: Connect | null;
  selectedRowKeys: string[];
  create: (values: ConnectCreateRequest) => Promise<Connect>;
  update: (params: UpdateConnectionParams) => Promise<Connect>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => void;
  setCreateModalVisible: (visible: boolean) => void;
  setEditModalVisible: (visible: boolean) => void;
  setTestModalVisible: (visible: boolean) => void;
  setEditingConnect: (connect: Connect | null) => void;
  setTestingConnect: (connect: Connect | null) => void;
  setSelectedRowKeys: (keys: string[]) => void;
}

export function useConnectionPanelHandlers({
  editingConnect,
  selectedRowKeys,
  create,
  update,
  remove,
  refresh,
  setCreateModalVisible,
  setEditModalVisible,
  setTestModalVisible,
  setEditingConnect,
  setTestingConnect,
  setSelectedRowKeys,
}: UseConnectionPanelHandlersProps) {
  // 打开创建弹窗
  const handleCreate = () => {
    setEditingConnect(null);
    setCreateModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: Connect) => {
    if (!record._id) {
      Message.error('连接数据异常，缺少ID信息，请刷新页面后重试');
      return;
    }

    // Connect 类型本身不包含密码字段（后端 SecretStr 不会返回）
    // 编辑时用户需要重新输入密码
    setEditingConnect(record);
    setEditModalVisible(true);
  };

  // 删除单个连接
  const handleDelete = async (record: Connect) => {
    try {
      if (!record._id) {
        throw new Error('连接ID不存在');
      }

      const success = await remove(record._id);

      if (success) {
        Message.success(`连接 "${record.name}" 删除成功`);
      } else {
        Message.warning('删除可能未完全成功，请刷新页面确认');
      }
    } catch (error) {
      // ✅ 正确：透出实际错误信息
      Message.error(getErrorMessage(error));
    }
  };

  // 测试连接
  const handleTest = (record: Connect) => {
    setTestingConnect(record);
    setTestModalVisible(true);
  };

  // 创建监控
  const handleCreateMonitor = (_record: Connect) => {
    Message.info('创建监控功能开发中');
  };

  // 提交创建
  const handleCreateSubmit = async (values: ConnectCreateRequest) => {
    try {
      const response = await create(values);

      if (response?._id) {
        Message.success(`连接 "${response.name}" 创建成功`);
        setCreateModalVisible(false);
      } else {
        Message.warning('创建可能未完全成功，请检查连接列表');
        setCreateModalVisible(false);
      }
    } catch (error) {
      // ✅ 正确：透出实际错误信息
      Message.error(getErrorMessage(error));
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  };

  // 提交编辑
  const handleEditSubmit = async (values: ConnectUpdateRequest) => {
    if (!editingConnect) {
      return;
    }

    try {
      if (!editingConnect._id) {
        throw new Error('连接ID不存在');
      }

      const response = await update({
        id: editingConnect._id,
        data: values,
      });

      if (response) {
        Message.success('更新成功');
        setEditModalVisible(false);
        setEditingConnect(null);
      } else {
        Message.warning('更新可能未完全成功，请检查连接状态');
      }
    } catch (error) {
      // ✅ 正确：透出实际错误信息
      Message.error(getErrorMessage(error));
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      Message.warning('请选择要删除的连接');
      return;
    }

    Modal.confirm({
      title: '批量删除确认',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个连接吗？`,
      onOk: async () => {
        try {
          const results = await Promise.all(
            selectedRowKeys.map((id) => remove(id)),
          );

          const successCount = results.filter((result) => result).length;
          const totalCount = results.length;

          if (successCount === totalCount) {
            Message.success(`批量删除成功，共删除 ${successCount} 个连接`);
          } else if (successCount > 0) {
            Message.warning(
              `部分删除成功，成功删除 ${successCount}/${totalCount} 个连接`,
            );
          } else {
            Message.error('批量删除失败，没有连接被删除');
          }

          setSelectedRowKeys([]);
          refresh();
        } catch (error) {
          // ✅ 正确：透出实际错误信息
          Message.error(getErrorMessage(error));
        }
      },
    });
  };

  return {
    handleCreate,
    handleEdit,
    handleDelete,
    handleTest,
    handleCreateMonitor,
    handleCreateSubmit,
    handleEditSubmit,
    handleBatchDelete,
  };
}
