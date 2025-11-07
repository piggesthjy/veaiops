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

from contextlib import (
    AbstractAsyncContextManager,
    AsyncExitStack,
    asynccontextmanager,
)
from typing import Any, AsyncGenerator, Callable, Dict, Optional, Sequence, Type

from fastapi import APIRouter, FastAPI, Response
from starlette.middleware import Middleware

from veaiops.handler.errors.convert import register_exceptions_handler

LifespanFunc = Callable[[FastAPI], AbstractAsyncContextManager[None]]

health_router = APIRouter()


@health_router.get("/healthz", include_in_schema=False)
def healthz():
    """Liveness/readiness probe endpoint."""
    return Response(content="ok", media_type="text/plain")


def combine_lifespans(*lifespans: LifespanFunc) -> LifespanFunc:
    """Combine multiple lifespan functions into a single lifespan function.

    Args:
        *lifespans(LifespanFunc): A sequence of lifespan functions to combine.

    Returns:
        A single combined lifespan function.
    """

    @asynccontextmanager
    async def combined_lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        async with AsyncExitStack() as stack:
            for lifespan in lifespans:
                await stack.enter_async_context(lifespan(app))
            yield

    return combined_lifespan


def create_fastapi_app(
    title: str,
    lifespans: Optional[Sequence[LifespanFunc]] = None,
    middlewares: Optional[Sequence[Middleware]] = None,
    routers: Optional[Sequence[APIRouter]] = None,
    exception_handlers: Optional[Dict[Type[Exception], Callable[..., Any]]] = None,
) -> FastAPI:
    """Creates and configures a FastAPI application instance.

    This utility function simplifies the process of initializing a FastAPI app
    by providing a centralized way to configure its core components.

    Args:
        lifespans: A sequence of async context manager for application startup and shutdown events.
        title: The title of the application, displayed in the OpenAPI docs.
        middlewares: A list of Starlette `Middleware` instances to be added.
        routers: A list of FastAPI `APIRouter` instances to be included.
        exception_handlers: A dictionary of custom exception handlers.

    Returns:
        A configured FastAPI application instance.
    """
    if lifespans:
        lifespan = combine_lifespans(*lifespans)
    else:
        lifespan = None

    app = FastAPI(title=title, lifespan=lifespan, middleware=middlewares)

    app.include_router(health_router)

    if routers:
        for router in routers:
            app.include_router(router)

    if exception_handlers:
        for exc, handler in exception_handlers.items():
            app.add_exception_handler(exc, handler)

    register_exceptions_handler(app)

    return app
