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

from typing import List

import openai
from openai.types.embedding import Embedding
from tenacity import retry, stop_after_attempt, wait_fixed


@retry(stop=stop_after_attempt(3), wait=wait_fixed(2))
async def embedding_create(api_key: str, base_url: str, model: str, raw_input: List[str]) -> List[Embedding]:
    """Create embedding for List of text.

    Args:
        api_key (str): API key for the embedding service
        base_url (str): Base URL for the embedding service
        model (str): Model name for the embedding service
        raw_input (List[str]): List of text inputs to create embeddings for

    Returns:
        List[Embedding]: List of embeddings for the input texts
    """
    async with openai.AsyncOpenAI(api_key=api_key, base_url=base_url) as client:
        response = await client.embeddings.create(
            model=model,
            input=raw_input,
            encoding_format="float",
        )

    return response.data
