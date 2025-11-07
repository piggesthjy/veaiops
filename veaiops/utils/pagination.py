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


def convert_skip_limit_to_page_params(skip: int, limit: int) -> tuple[int, int]:
    """Convert skip/limit pagination parameters to page_number/page_size format.

    Args:
        skip: Number of items to skip
        limit: Maximum number of items to return

    Returns:
        Tuple of (page_number, page_size)
    """
    page_number = 1
    if skip > 0 and limit > 0:
        page_number = (skip // limit) + 1
    page_size = limit
    return page_number, page_size
