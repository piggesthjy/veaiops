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
import type { APIResponseProduct } from '../models/api-response-product';
import type { PaginatedAPIResponseProductList } from '../models/paginated-api-response-product-list';
import type { ProductCreateRequest } from '../models/product-create-request';
import type { CancelablePromise } from '../core/cancelable-promise';
import type { BaseHttpRequest } from '../core/base-http-request';
export class ProductsService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}
  /**
   * Get All Products
   * Get all products with optional pagination and filtering
   * @returns PaginatedAPIResponseProductList Successful Response
   * @throws ApiError
   */
  public getApisV1ManagerSystemConfigProducts({
    skip,
    limit = 100,
    name,
  }: {
    skip?: number,
    limit?: number,
    name?: string,
  }): CancelablePromise<PaginatedAPIResponseProductList> {
    return this.httpRequest.request({
      method: 'GET',
      url: '/apis/v1/manager/system-config/products/',
      query: {
        'skip': skip,
        'limit': limit,
        'name': name,
      },
    });
  }
  /**
   * Create Product
   * Create a new product
   * @returns APIResponseProduct Created Successfully
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigProducts({
    requestBody,
  }: {
    requestBody: ProductCreateRequest,
  }): CancelablePromise<APIResponseProduct> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/products/',
      body: requestBody,
      mediaType: 'application/json',
    });
  }
  /**
   * Import Products From CSV
   * Import products from CSV file
   * @returns APIResponseBoolean Import Successful
   * @throws ApiError
   */
  public postApisV1ManagerSystemConfigProductsImport({
    formData,
  }: {
    formData: {
      /**
       * CSV file containing product data
       */
      file: Blob;
    },
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/apis/v1/manager/system-config/products/import',
      formData: formData,
      mediaType: 'multipart/form-data',
    });
  }
  /**
   * Delete Product By ID
   * Delete a product by ID
   * @returns APIResponseBoolean Deletion Successful
   * @throws ApiError
   */
  public deleteApisV1ManagerSystemConfigProducts({
    productId,
  }: {
    /**
     * The ID of the product to delete
     */
    productId: string,
  }): CancelablePromise<APIResponseBoolean> {
    return this.httpRequest.request({
      method: 'DELETE',
      url: '/apis/v1/manager/system-config/products/{product_id}',
      path: {
        'product_id': productId,
      },
    });
  }
}
