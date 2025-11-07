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
 * Project CRUD 操作 Hook
 * @description 项目的创建、更新、删除、导入等操作
 */

import { Form, Message } from '@arco-design/web-react';
import {
  type ProjectFormData,
  canDeleteProject,
  createProject,
  deleteProject,
  getDeleteRestrictionReason,
  importProjects,
  validateProjectFormData,
} from '@project';
import type { Project } from 'api-generate';
import { useCallback, useState } from 'react';

/**
 * Project CRUD Hook 返回值
 */
export interface UseProjectCRUDReturn {
  // 状态
  form: ReturnType<typeof Form.useForm<ProjectFormData>>[0];
  editingProject: Project | null;
  modalVisible: boolean;
  submitting: boolean;

  // 导入相关状态
  importDrawerVisible: boolean;
  uploading: boolean;

  // 新建项目相关状态
  createDrawerVisible: boolean;
  creating: boolean;

  // 状态管理
  setEditingProject: (project: Project | null) => void;
  setModalVisible: (visible: boolean) => void;

  // CRUD 操作
  handleSubmit: (values: ProjectFormData) => Promise<boolean>;
  handleCancel: () => void;
  handleDelete: (projectId: string) => Promise<boolean>;
  checkDeletePermission: (project: Project) => boolean;

  // 导入相关操作
  handleImport: (file: File) => Promise<boolean>;
  handleOpenImportDrawer: () => void;
  handleCloseImportDrawer: () => void;

  // 新建项目相关操作
  handleCreate: (values: {
    project_id: string;
    name: string;
  }) => Promise<boolean>;
  handleOpenCreateDrawer: () => void;
  handleCloseCreateDrawer: () => void;
}

/**
 * Project CRUD Hook
 */
export const useProjectCRUD = (): UseProjectCRUDReturn => {
  const [form] = Form.useForm<ProjectFormData>();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 导入相关状态
  const [importDrawerVisible, setImportDrawerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 新建项目相关状态
  const [createDrawerVisible, setCreateDrawerVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // 🎯 CRUD 操作函数
  /**
   * 处理表单提交
   * 支持新增和编辑两种模式
   */
  const handleSubmit = useCallback(
    async (values: ProjectFormData): Promise<boolean> => {
      try {
        // 表单验证
        const validationErrors = validateProjectFormData(values);
        if (validationErrors.length > 0) {
          Message.error(validationErrors[0]);
          return false;
        }

        setSubmitting(true);

        let success = false;

        if (editingProject) {
          // 编辑模式 - 暂时只支持创建，编辑功能待后端API支持
          Message.warning('编辑功能暂未开放，请联系管理员');
          return false;
        } else {
          // 新增模式
          success = await createProject(values);
        }

        if (success) {
          setModalVisible(false);
          setEditingProject(null);
          form.resetFields();
          return true;
        }

        return false;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '操作失败，请重试';
        Message.error(errorMessage);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [editingProject, form],
  );

  /**
   * 关闭弹窗
   */
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingProject(null);
    form.resetFields();
    setSubmitting(false);
  }, [form]);

  /**
   * 删除项目
   * 包含权限检查和用户确认
   */
  const handleDelete = useCallback(
    async (projectId: string): Promise<boolean> => {
      try {
        const result = await deleteProject(projectId);
        return result;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '删除项目失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );

  /**
   * 检查项目删除权限
   */
  const checkDeletePermission = useCallback((project: Project): boolean => {
    const canDelete = canDeleteProject(project);

    if (!canDelete) {
      const reason = getDeleteRestrictionReason(project);
      if (reason) {
        Message.warning(reason);
      }
    }

    return canDelete;
  }, []);

  /**
   * 处理项目导入
   */
  const handleImport = useCallback(async (file: File): Promise<boolean> => {
    try {
      setUploading(true);
      const success = await importProjects(file);

      if (success) {
        Message.success('项目导入成功');
        setImportDrawerVisible(false);
        return true;
      } else {
        Message.error('项目导入失败');
        return false;
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      const errorMessage =
        error instanceof Error ? error.message : '项目导入失败，请重试';
      Message.error(errorMessage);
      return false;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * 打开导入抽屉
   */
  const handleOpenImportDrawer = useCallback(() => {
    setImportDrawerVisible(true);
  }, []);

  /**
   * 关闭导入抽屉
   */
  const handleCloseImportDrawer = useCallback(() => {
    setImportDrawerVisible(false);
  }, []);

  /**
   * 处理新建项目
   */
  const handleCreate = useCallback(
    async (values: { project_id: string; name: string }): Promise<boolean> => {
      try {
        setCreating(true);
        const success = await createProject(values);

        if (success) {
          Message.success('项目创建成功');
          setCreateDrawerVisible(false);
          return true;
        } else {
          Message.error('项目创建失败');
          return false;
        }
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '项目创建失败，请重试';
        Message.error(errorMessage);
        return false;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  /**
   * 打开新建抽屉
   */
  const handleOpenCreateDrawer = useCallback(() => {
    setCreateDrawerVisible(true);
  }, []);

  /**
   * 关闭新建抽屉
   */
  const handleCloseCreateDrawer = useCallback(() => {
    setCreateDrawerVisible(false);
  }, []);

  return {
    form,
    editingProject,
    modalVisible,
    submitting,
    importDrawerVisible,
    uploading,
    createDrawerVisible,
    creating,
    setEditingProject,
    setModalVisible,
    handleSubmit,
    handleCancel,
    handleDelete,
    checkDeletePermission,
    handleImport,
    handleOpenImportDrawer,
    handleCloseImportDrawer,
    handleCreate,
    handleOpenCreateDrawer,
    handleCloseCreateDrawer,
  };
};
