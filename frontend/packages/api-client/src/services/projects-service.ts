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

/* generated using openapi-typescript-codegen -- do not edit */
import type { APIResponseBoolean } from '../models/api-response-boolean';
import type { APIResponseProject } from '../models/api-response-project';
import type { APIResponseString } from '../models/api-response-string';
import type { PaginatedAPIResponseProjectList } from '../models/paginated-api-response-project-list';
import type { ProjectCreateRequest } from '../models/project-create-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class ProjectsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get All Projects
   * Get all projects with optional pagination and filtering
   * @returns PaginatedAPIResponseProjectList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerSystemConfigProjects({
    skip,
    limit = 100,
    name,
  }: {
    skip?: number,
    limit?: number,
    name?: string,
  }): CancelablePromise<PaginatedAPIResponseProjectList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/system-config/projects/',
      query: {
        'skip': skip,
        'limit': limit,
        'name': name,
      },
    });
  }
  /**
   * Create Project
   * Create a new project
   * @returns APIResponseProject Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigProjects({
    requestBody,
  }: {
    requestBody: ProjectCreateRequest,
  }): CancelablePromise<APIResponseProject> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/projects/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Import Projects From CSV
   * Import projects from CSV file
   * @returns APIResponseString Import Successful
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigProjectsImport({
    formData,
  }: {
    formData: {
      /**
       * CSV file containing project data
       */
      file: Blob;
    },
  }): CancelablePromise<APIResponseString> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/projects/import',
      formData: formData,
      mediaType: 'multipart/form-data',
    });
  }
  /**
   * Delete Project By ID
   * Delete a project by ID
   * @returns APIResponseBoolean Deletion Successful
   * @throws ApiError
   */
  public deleteApisV1ManagerSystemConfigProjects({
    projectId,
  }: {
    /**
     * The ID of the project to delete
     */
    projectId: string,
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/system-config/projects/{project_id}',
      path: {
        'project_id': projectId,
      },
    });
  }
}
