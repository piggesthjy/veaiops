# Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from veaiops.schema.models.chatops import Citation


class AgentReplyResp(BaseModel):
    """Response model for agent notifications."""

    response: str
    citations: List[Citation] = Field(default_factory=list)


class ExternalLinkReviewResult(BaseModel):
    """Result of external link review."""

    url: str
    status: Literal["success", "failure"]
    message: str


class ProactiveReply(BaseModel):
    """Proactive reply results."""

    answer: Optional[str] = None
    rewrite_query: Optional[str] = None
    rewrite_sub_queries: Optional[List[str]] = None
    citations: Optional[List[Citation]] = None
    query_embedding: Optional[List[float]] = None
    answer_embedding: Optional[List[float]] = None
    answer_similarity: Optional[float] = None  # Similarity score with historical answers
    query_similarity: Optional[float] = None  # Similarity score with historical queries
    is_first_answer: bool = False  # Whether the answer is a new answer
    is_first_query: bool = False  # Whether the query is a new query
    knowledge_key: Optional[str] = None  # Associated VeKB point ID
    review_status: Literal["pending", "add", "keep", "delete", "modify", None] = None
    modified_query: Optional[str] = None  # Modified question after review
    modified_answer: Optional[str] = None  # Modified answer after review
    deleted_citations: Optional[List[str]] = None  # Citation IDs deleted during review
