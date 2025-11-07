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
import type { AgentTemplateCreateRequest } from '../models/agent-template-create-request';
import type { AgentTemplateUpdateRequest } from '../models/agent-template-update-request';
import type { APIResponseAgentTemplate } from '../models/api-response-agent-template';
import type { APIResponseBoolean } from '../models/api-response-boolean';
import type { PaginatedAPIResponseAgentTemplateList } from '../models/paginated-api-response-agent-template-list';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class AgentTemplateService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get All Agent Templates
   * Get all agent templates with optional pagination
   * @returns PaginatedAPIResponseAgentTemplateList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerEventCenterAgentTemplate({
    skip,
    limit = 100,
    agents,
    channels,
    templateId,
    showAll,
  }: {
    /**
     * Number of agent templates to skip
     */
    skip?: number,
    /**
     * Maximum number of agent templates to return
     */
    limit?: number,
    /**
     * Filter templates by agent type
     */
    agents?: Array<string>,
    /**
     * Filter templates by channel type
     */
    channels?: Array<string>,
    /**
     * Filter templates by template ID
     */
    templateId?: string,
    /**
     * Whether to show disabled items
     */
    showAll?: boolean,
  }): CancelablePromise<PaginatedAPIResponseAgentTemplateList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/event-center/agent_template/',
      query: {
        'skip': skip,
        'limit': limit,
        'agents': agents,
        'channels': channels,
        'template_id': templateId,
        'show_all': showAll,
      },
    });
  }
  /**
   * Create Agent Template
   * Create a new agent template
   * @returns APIResponseAgentTemplate Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerEventCenterAgentTemplate({
    requestBody,
  }: {
    requestBody: AgentTemplateCreateRequest,
  }): CancelablePromise<APIResponseAgentTemplate> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/event-center/agent_template/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Get Agent Template
   * Get an agent template by ID
   * @returns APIResponseAgentTemplate Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerEventCenterAgentTemplate1({
    agentTemplateId,
  }: {
    agentTemplateId: string,
  }): CancelablePromise<APIResponseAgentTemplate> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/event-center/agent_template/{agent_template_id}',
      path: {
        'agent_template_id': agentTemplateId,
      },
    });
  }
  /**
   * Update Agent Template
   * Update an agent template
   * @returns APIResponseAgentTemplate Updated Successfully
   * @throws ApiError
   */
  public putApisV1ManagerEventCenterAgentTemplate({
    agentTemplateId,
    requestBody,
  }: {
    agentTemplateId: string,
    requestBody: AgentTemplateUpdateRequest,
  }): CancelablePromise<APIResponseAgentTemplate> {
    return this.httpRequest.request({
      method: 'PUT',
      url: '/apis/v1/manager/event-center/agent_template/{agent_template_id}',
      path: {
        'agent_template_id': agentTemplateId,
      },
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Delete Agent Template
   * Delete an agent template
   * @returns APIResponseBoolean Deleted Successfully
   * @throws ApiError
   */
  public deleteApisV1ManagerEventCenterAgentTemplate({
    agentTemplateId,
  }: {
    agentTemplateId: string,
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/event-center/agent_template/{agent_template_id}',
      path: {
        'agent_template_id': agentTemplateId,
      },
    });
  }
}
