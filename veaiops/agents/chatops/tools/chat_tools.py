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

from datetime import datetime
from typing import Optional

from beanie import SortDirection

from veaiops.schema.documents import Message
from veaiops.utils.log import logger
from veaiops.utils.message import reorg_reversed_msgs


async def get_chat_history(
    chat_id: str,
    end_date: Optional[str] = None,
    start_date: Optional[str] = None,
) -> list:
    """Get chat history messages.

    Args:
        chat_id (str): The ID of the chat.
        end_date (Optional[str]): The end date for chat messages, format: YYYY-MM-DD HH:MM:SS. Defaults to None.
        start_date (Optional[str]): The start date for chat messages, format: YYYY-MM-DD HH:MM:SS. Defaults to None.

    Returns:
        list[Message]: The list of chat history messages.
    """
    queries = [Message.chat_id == chat_id]
    if start_date:
        try:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d %H:%M:%S")
            queries.append(Message.msg_time >= start_datetime)
        except Exception as e:
            logger.warning(f"Invalid start_date format: {start_date}. Error: {e}")
    if end_date:
        try:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d %H:%M:%S")
            queries.append(Message.msg_time <= end_datetime)
        except Exception as e:
            logger.warning(f"Invalid end_date format: {end_date}. Error: {e}")

    chat_messages = await Message.find(*queries).sort([("msg_time", SortDirection.DESCENDING)]).to_list()

    reorged_list = reorg_reversed_msgs(chat_messages=chat_messages, max_images=0)

    return reorged_list
