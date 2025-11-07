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

import apiClient from "@/utils/api-client";
import { Message } from "@arco-design/web-react";
import type { Project, ProjectFormData } from '@project/types';
import { API_RESPONSE_CODE } from "@veaiops/constants";

/**
 * 项目列表查询参数
 */
export interface ProjectListParams {
  skip?: number;
  limit?: number;
  name?: string;
  status?: string;
  priority?: string;
  owner?: string;
}

/**
 * 项目列表响应
 */
export interface ProjectListResponse {
  data: Project[];
  total: number;
  skip: number;
  limit: number;
}

/**
 * 导入日志
 */
export interface ImportLog {
  level: "info" | "warning" | "error";
  message: string;
  timestamp: string;
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  message: string;
  imported_count: number;
  failed_count: number;
  logs: ImportLog[];
}

/**
 * 获取项目列表
 */
export const getProjectList = async (
  params: ProjectListParams = {}
): Promise<ProjectListResponse> => {
  try {
    // 注意：空字符串应该被过滤掉，只传递有效的 name 值
    const nameParam =
      params.name && params.name.trim() !== ''
        ? params.name.trim()
        : undefined;
    const response =
      await apiClient.projects.getApisV1ManagerSystemConfigProjects({
        skip: params.skip || 0,
        limit: params.limit || 10,
        name: nameParam,
      });

    if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
      const projects = Array.isArray(response.data) ? response.data : [];

      // 转换后端数据格式到前端格式
      // 注意：API 返回的是 api-generate 中的 Project 类型（包含 _id）
      // Project 类型只有 _id 和 project_id 字段，没有 id 字段
      const formattedProjects: Project[] = projects.map((item: import('api-generate').Project) => ({
        _id: item._id,
        project_id: item.project_id,
        name: item.name || "",
        is_active: item.is_active ?? true,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
      }));

      return {
        data: formattedProjects,
        total: response.total || formattedProjects.length,
        skip: response.skip || 0,
        limit: response.limit || 10,
      };
    }

    throw new Error(response.message || "获取项目列表失败");
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorMessage =
      error instanceof Error
        ? error.message
        : "获取项目列表失败，请重试";
    Message.error(errorMessage);
    // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    throw errorObj;
  }
};

/**
 * 创建项目
 */
export const createProject = async (
  data: Pick<ProjectFormData, "project_id" | "name">
): Promise<boolean> => {
  try {
    const response =
      await apiClient.projects.postApisV1ManagerSystemConfigProjects({
        requestBody: {
          project_id: data.project_id,
          name: data.name,
        },
      });

    if (response.code === API_RESPONSE_CODE.SUCCESS) {
      return true;
    }

    throw new Error(response.message || "创建项目失败");
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorMessage =
      error instanceof Error ? error.message : "创建项目失败";
    Message.error(errorMessage);
    return false;
  }
};

/**
 * 删除项目
 */
export const deleteProject = async (
  id: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response =
      await apiClient.projects.deleteApisV1ManagerSystemConfigProjects({
        projectId: id,
      });

    if (response.code === API_RESPONSE_CODE.SUCCESS) {
      Message.success("项目删除成功");
      return {
        success: true,
        message: "项目删除成功",
      };
    }

    throw new Error(response.message || "删除项目失败");
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorMessage =
      error instanceof Error ? error.message : "删除项目失败";
    Message.error(errorMessage);
    // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
    const errorObj =
      error instanceof Error ? error : new Error(String(error));
    throw errorObj;
  }
};

/**
 * 导入项目数据
 * 使用Python后端的专用导入接口，支持详细日志
 */
export const importProjects = async (
  file: File,
  _onProgress?: (logs: ImportLog[]) => void
): Promise<ImportResult> => {
  try {
    // 检查文件类型
    if (!file.name.endsWith(".csv")) {
      throw new Error("只支持CSV文件格式");
    }

    // 检查文件大小 (10MB限制)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("文件大小不能超过10MB");
    }

    const response =
      await apiClient.projects.postApisV1ManagerSystemConfigProjectsImport({
        formData: { file },
      });

    if (response.code === API_RESPONSE_CODE.SUCCESS) {
      const result: ImportResult = {
        success: true,
        message: response.message || "导入成功",
        imported_count: 0, // 从响应中获取实际数量
        failed_count: 0,
        logs: [
          {
            level: "info",
            message: response.message || "导入完成",
            timestamp: new Date().toISOString(),
          },
        ],
      };

      return result;
    }

    throw new Error(response.message || "导入项目失败");
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorMessage =
      error instanceof Error ? error.message : "导入项目失败";
    Message.error(errorMessage);

    return {
      success: false,
      message: errorMessage,
      imported_count: 0,
      failed_count: 1,
      logs: [
        {
          level: "error",
          message: errorMessage,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }
};

/**
 * 查询同步状态接口
 *
 * 用于调试日志导出功能，包含表格的查询状态信息
 */
export interface QuerySyncState {
  /** 当前页码 */
  current?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 筛选条件 */
  filters?: Record<string, unknown>;
  /** 排序信息 */
  sorter?: Record<string, unknown>;
  /** URL 搜索参数 */
  searchParams?: Record<string, unknown>;
}

/**
 * 导出调试日志
 *
 * @param querySync - 查询同步状态对象，包含表格的当前查询状态
 */
export const exportDebugLogs = (querySync: QuerySyncState) => {
  try {
    const debugData = {
      timestamp: new Date().toISOString(),
      module: "project-management",
      querySync: {
        current: querySync?.current,
        pageSize: querySync?.pageSize,
        filters: querySync?.filters,
        sorter: querySync?.sorter,
        searchParams: querySync?.searchParams,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    const dataStr = JSON.stringify(debugData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `project-management-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    Message.success("调试日志已导出");
  } catch (error) {
    // ✅ 正确：透出实际的错误信息
    const errorMessage =
      error instanceof Error
        ? error.message
        : "导出调试日志失败";
    Message.error(errorMessage);
  }
};
