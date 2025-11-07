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
import type { APIResponseCustomer } from '../models/api-response-customer';
import type { APIResponseCustomerList } from '../models/api-response-customer-list';
import type { APIResponseImportResult } from '../models/api-response-import-result';
import type { CustomerCreateRequest } from '../models/customer-create-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class CustomersService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get All Customers
   * Get all customers with optional pagination and filtering
   * @returns APIResponseCustomerList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerSystemConfigCustomers({
    skip,
    limit = 100,
    name,
  }: {
    skip?: number,
    limit?: number,
    name?: string,
  }): CancelablePromise<APIResponseCustomerList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/system-config/customers/',
      query: {
        'skip': skip,
        'limit': limit,
        'name': name,
      },
    });
  }
  /**
   * Create Customer
   * Create a new customer
   * @returns APIResponseCustomer Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigCustomers({
    requestBody,
  }: {
    requestBody: CustomerCreateRequest,
  }): CancelablePromise<APIResponseCustomer> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/customers/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Import Customers From CSV
   * Import customers from CSV file with detailed results
   * @returns APIResponseImportResult Import Completed with Results
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigCustomersImport({
    formData,
  }: {
    formData: {
      /**
       * CSV file containing customer data
       */
      file: Blob;
    },
  }): CancelablePromise<APIResponseImportResult> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/customers/import',
      formData: formData,
      mediaType: 'multipart/form-data',
    });
  }
  /**
   * Delete Customer By ID
   * Delete a customer by ID
   * @returns APIResponseBoolean Deletion Successful
   * @throws ApiError
   */
  public deleteApisV1ManagerSystemConfigCustomers({
    customerId,
  }: {
    /**
     * The ID of the customer to delete
     */
    customerId: string,
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/system-config/customers/{customer_id}',
      path: {
        'customer_id': customerId,
      },
    });
  }
}
