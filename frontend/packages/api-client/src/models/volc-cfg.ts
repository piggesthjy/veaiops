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
export type VolcCfg = {
  /**
   * 火山引擎Access Key
   */
  ak?: string;
  /**
   * 火山引擎Secret Key
   */
  sk?: string;
  /**
   * TOS区域
   */
  tos_region?: string;
  /**
   * TOS区域
   */
  network_type?: string;
  /**
   * 额外的知识库集合
   */
  extra_kb_collections?: Array<string>;
};
