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

from fastapi import Header

from veaiops.handler.errors import UnauthorizedError
from veaiops.settings import WebhookSettings, get_settings
from veaiops.utils.log import logger

WEBHOOK_SECRET = get_settings(WebhookSettings).secret.get_secret_value()


async def verify_sign(x_secret: Optional[str] = Header(None)):
    """Dependency to verify webhook secret token."""
    if WEBHOOK_SECRET and x_secret != WEBHOOK_SECRET:
        logger.warning(f"Received webhook with invalid token, got={x_secret}")
        raise UnauthorizedError(message="Invalid webhook token")
    if not WEBHOOK_SECRET:
        logger.warning("WEBHOOK_SECRET not set, skipping verification.")
