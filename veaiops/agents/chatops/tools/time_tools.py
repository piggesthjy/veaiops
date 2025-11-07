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

from datetime import datetime, timedelta, timezone


async def get_utc_time(hours: int = 8) -> str:
    """Get current UTC time as string. Default is UTC+8.

    Args:
        hours (int): Timezone offset in hours. Default is 8 for UTC+8.

    Returns:
        str: Current time in "YYYY-MM-DD HH:MM:SS" format.
    """
    utc_time = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=hours))).strftime("%Y-%m-%d %H:%M:%S")
    return utc_time
