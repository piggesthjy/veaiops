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


from typing import Optional

import httpx
from starlette_context import context


class AsyncClientWithCtx(httpx.AsyncClient):
    """An httpx.AsyncClient that propagates context headers.

    This client extends `httpx.AsyncClient` to automatically include
    `X-Request-ID` and `X-Correlation-ID` headers in outgoing requests.
    These headers are sourced from the `starlette_context` if it exists,
    allowing for distributed tracing across services.

    It behaves as an asynchronous context manager, just like the parent
    `httpx.AsyncClient`.

    Example:
        >>> async with AsyncClientWithCtx() as client:
        >>>     response = await client.get("https://example.com")
    """

    def build_request(self, method: str, url: str, **kwargs) -> httpx.Request:
        """Build a request, adding context headers if available.

        Args:
            method (str): The HTTP method (e.g., "GET", "POST").
            url (str): The URL for the request.
            **kwargs: Additional keyword arguments to pass to `httpx.AsyncClient.build_request`.

        Returns:
            httpx.Request: The constructed request object.
        """
        request = super().build_request(method, url, **kwargs)
        if context.exists():
            for key in ("X-Request-ID", "X-Correlation-ID"):
                value: Optional[str] = context.data.get(key)
                if value and key not in request.headers:
                    request.headers[key] = value
        return request

    async def __aenter__(self):
        return await super().__aenter__()

    async def __aexit__(self, *exc):
        return await super().__aexit__(*exc)
