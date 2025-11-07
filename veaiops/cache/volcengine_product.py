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

import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional

import aiohttp

from veaiops.utils.log import logger


@dataclass
class VolcengineMetricProduct:
    """Volcengine monitoring product information data model.

    This class is used to store product information from Volcengine monitoring services,
    including product namespace, description, type name, and type ID.

    Attributes:
        namespace: Product namespace, used to identify product category
        description: Product description information
        type_name: Product type name
        type_id: Product type ID
    """

    namespace: str
    description: str
    type_name: str
    type_id: str


class VolcengineProductCache:
    """Volcengine monitoring product cache manager."""

    def __init__(self, refresh_interval_seconds: int = 600):
        self.products: List[VolcengineMetricProduct] = []
        self.last_update: Optional[datetime] = None
        self._refresh_task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()
        self.refresh_interval_seconds = refresh_interval_seconds

    async def refresh_products(self):
        """Refresh product data. Raises an exception on failure."""
        try:
            url = "https://cloudmonitor-api.console.volcengine.com/external/api/documents"
            params = {"Action": "ListMetricProducts", "Version": "2018-01-01"}
            headers = {"Content-Type": "application/json"}

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async with session.post(url, json={}, params=params, headers=headers) as response:
                    response.raise_for_status()
                    data = await response.json()
                    products = data.get("Result", {}).get("Data", [])

                    self.products = [
                        VolcengineMetricProduct(
                            namespace=p["Namespace"],
                            description=p["Description"],
                            type_name=p["Type"],
                            type_id=p["TypeId"],
                        )
                        for p in products
                    ]

                    self.last_update = datetime.now(timezone.utc)
                    logger.info(f"Refreshed {len(self.products)} Volcengine monitoring products")
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError) as e:
            logger.error(f"Failed to refresh product data: {e}", exc_info=True)
            raise Exception("Failed to refresh product data") from e

    async def schedule_cache_refresh(self):
        """Scheduled cache refresh."""
        while not self._stop_event.is_set():
            try:
                # Wait for refresh interval or stop signal
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=self.refresh_interval_seconds)
                    # Exit loop if stop signal is received
                    break
                except asyncio.TimeoutError:
                    # Normal refresh time reached
                    pass

                await self.refresh_products()

            except asyncio.CancelledError:
                logger.info("Cache refresh task has been cancelled")
                break
            except Exception as e:
                logger.error(f"Scheduled refresh exception: {e}", exc_info=True)
                # Wait for some time before retrying
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=60)
                except asyncio.TimeoutError:
                    continue

    def start_refresh_task(self):
        """Start refresh task."""
        if self._refresh_task is None or self._refresh_task.done():
            self._stop_event = asyncio.Event()
            self._refresh_task = asyncio.create_task(self.schedule_cache_refresh())
            logger.info("Started Volcengine product cache refresh task")

    async def stop_refresh_task(self):
        """Gracefully stop refresh task."""
        if self._refresh_task and not self._refresh_task.done():
            logger.info("Stopping cache refresh task...")
            self._stop_event.set()

            try:
                await asyncio.wait_for(self._refresh_task, timeout=5)
            except asyncio.TimeoutError:
                self._refresh_task.cancel()
                try:
                    await self._refresh_task
                except asyncio.CancelledError:
                    pass

            logger.info("Cache refresh task has stopped")

    def get_products(self) -> List[VolcengineMetricProduct]:
        """Get cached product data."""
        return self.products

    def get_products_dict(self) -> Dict[str, Dict]:
        """Get product data dictionary."""
        return {
            p.namespace: {
                "namespace": p.namespace,
                "description": p.description,
                "type": p.type_name,
                "type_id": p.type_id,
            }
            for p in self.products
        }
