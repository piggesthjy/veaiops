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

from veaiops.utils.pagination import convert_skip_limit_to_page_params


def test_convert_skip_limit_to_page_params():
    """Test conversion for various skip/limit combinations including edge cases."""
    # Basic cases
    page_number, page_size = convert_skip_limit_to_page_params(0, 10)
    assert page_number == 1 and page_size == 10

    page_number, page_size = convert_skip_limit_to_page_params(10, 10)
    assert page_number == 2 and page_size == 10

    page_number, page_size = convert_skip_limit_to_page_params(50, 25)
    assert page_number == 3 and page_size == 25

    # Edge cases
    page_number, page_size = convert_skip_limit_to_page_params(10, 0)
    assert page_number == 1 and page_size == 0  # Zero limit defaults to page 1

    page_number, page_size = convert_skip_limit_to_page_params(-5, 10)
    assert page_number == 1 and page_size == 10  # Negative skip defaults to page 1
