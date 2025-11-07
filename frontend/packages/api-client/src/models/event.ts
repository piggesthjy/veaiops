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
import type { AgentNotification } from './agent-notification';
import type { AgentType } from './agent-type';
import type { ChannelMsg } from './channel-msg';
import type { EventLevel } from './event-level';
import type { EventStatus } from './event-status';
export type Event = {
  /**
   * MongoDB document ID
   */
  _id?: string;
  /**
   * Unique event identifier
   */
  event_id?: string;
  /**
   * The type of the agent that generated the event
   */
  agent_type: AgentType;
  /**
   * The level of the event
   */
  event_level: EventLevel;
  /**
   * The region associated with the event
   */
  region?: Array<string>;
  /**
   * The project associated with the event
   */
  project?: Array<string>;
  /**
   * The product associated with the event
   */
  product?: Array<string>;
  /**
   * The customer associated with the event
   */
  customer?: Array<string>;
  /**
   * The raw data of the event
   */
  raw_data: (AgentNotification | Record<string, any>);
  /**
   * The type of the datasource that generated the event
   */
  datasource_type: string;
  /**
   * The message content for each channel
   */
  channel_msg?: Record<string, ChannelMsg>;
  /**
   * The status of the event
   */
  status?: EventStatus;
  /**
   * The timestamp when the event was created
   */
  created_at?: string;
  /**
   * The timestamp when the event was last updated
   */
  updated_at?: string;
};
