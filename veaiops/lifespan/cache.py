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

from contextlib import asynccontextmanager

from veaiops.cache import VolcengineMetricCache, VolcengineProductCache
from veaiops.utils.log import logger


@asynccontextmanager
async def cache_lifespan(app):
    """Cache lifespan management."""
    try:
        # Initialize on startup
        logger.info("🔄 Initializing Volcengine product cache...")
        await volcengine_product_cache.refresh_products()
        logger.info("🔄 Initializing Volcengine metric cache...")
        await volcengine_metric_cache.refresh_metrics()
    except Exception as e:
        logger.critical(f"Failed to initialize cache during startup: {e}. Application will not start.", exc_info=True)
        raise

    # Start scheduled tasks
    volcengine_product_cache.start_refresh_task()
    logger.info("Volcengine product cache is ready")
    volcengine_metric_cache.start_refresh_task()
    logger.info("Volcengine metric cache is ready")

    yield
    await graceful_shutdown()


# Global cache instance
volcengine_product_cache = VolcengineProductCache(refresh_interval_seconds=600)

# Global cache instance
volcengine_metric_cache = VolcengineMetricCache(refresh_interval_seconds=600)  # 10 minutes


# Graceful shutdown handler
async def graceful_shutdown():
    """Gracefully shutdown all cache tasks."""
    await volcengine_product_cache.stop_refresh_task()
    await volcengine_metric_cache.stop_refresh_task()

    logger.info("Cache cleanup completed")
