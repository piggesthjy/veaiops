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

from beanie import SortDirection
from google.genai.types import Part

from veaiops.schema.documents import Message


async def get_backward_chat_messages(inspect_history: int, msg: Message, max_images: int = 2) -> List[Part]:
    """Retrieve chat messages based on the interest configuration.

    Args:
        inspect_history (int): The history depth to inspect.
        msg (Message): The current message.
        max_images (int): Maximum number of images to include.

    Returns:
        List[Message]: List of messages in the chat history.
    """
    if inspect_history == 1:
        chat_messages = [msg]
    else:
        chat_messages = (
            await Message.find(
                Message.chat_id == msg.chat_id,
                Message.channel == msg.channel,
                Message.msg_time <= msg.msg_time,
            )
            .sort([("msg_time", SortDirection.DESCENDING)])
            .limit(inspect_history)
            .to_list()
        )

    reorged_msgs = reorg_reversed_msgs(chat_messages=chat_messages, max_images=max_images)
    return reorged_msgs


async def get_forward_chat_messages(inspect_history: int, msg: Message, max_images: int = 1) -> List[Part]:
    """Get the latest messages after the given message.

    Args:
        inspect_history (int): The history depth to inspect.
        msg (Message): The reference message.
        max_images (int): Maximum number of images to include.

    Returns:
        List[Part]: List of messages in the chat history.
    """
    chat_messages = (
        await Message.find(
            Message.chat_id == msg.chat_id,
            Message.channel == msg.channel,
            Message.msg_time > msg.msg_time,
        )
        .sort([("msg_time", SortDirection.ASCENDING)])
        .limit(inspect_history)
        .to_list()
    )
    chat_messages.reverse()

    reorged_msgs = reorg_reversed_msgs(chat_messages=chat_messages, max_images=max_images)
    return reorged_msgs


async def get_msg_context(msg: Message, context_window=30) -> List[Message]:
    """Get the context messages within the specified time window before and after the given message.

    Args:
        msg (Message): The reference message.
        context_window (int): The maximum number of context messages to retrieve.

    Returns:
        List[Part]: List of context messages.
    """
    before_msgs = (
        await Message.find(
            Message.chat_id == msg.chat_id,
            Message.channel == msg.channel,
            Message.msg_time <= msg.msg_time,
        )
        .sort([("msg_time", SortDirection.DESCENDING)])
        .limit(context_window)
        .to_list()
    )

    after_msgs = (
        await Message.find(
            Message.chat_id == msg.chat_id,
            Message.channel == msg.channel,
            Message.msg_time > msg.msg_time,
        )
        .sort([("msg_time", SortDirection.ASCENDING)])
        .limit(context_window)
        .to_list()
    )
    after_msgs.reverse()
    # Descending order
    chat_messages = after_msgs + before_msgs
    return chat_messages


async def get_knowledge_point_group_context(knowledge_key: str) -> List[Part]:
    """Get the QA content from the message's proactive reply.

    Args:
        question (str): The question text.
        answer (str): The answer text.
        knowledge_key (str): The knowledge_key from VeKB.

    Returns:
        str: The formatted QA content.
    """
    msg = await Message.find_one(Message.proactive_reply.knowledge_key == knowledge_key)
    if not msg:
        raise ValueError(f"Message with knowledge_key {knowledge_key} not found.")

    chat_messages = await get_msg_context(msg=msg)
    reorged_msgs = reorg_reversed_msgs(chat_messages=chat_messages, max_images=0)

    return reorged_msgs


async def get_latest_user_message(msg: Message) -> List[Part]:
    """Get the latest user message before the given message.

    Args:
        msg (Message): The reference message.

    Returns:
        Message: The latest user message.
    """
    messages = (
        await Message.find(
            Message.chat_id == msg.chat_id,
            Message.channel == msg.channel,
            Message.msg_time <= msg.msg_time,
        )
        .sort([("msg_time", SortDirection.DESCENDING)])
        .limit(50)
        .to_list()
    )
    sender_id = msg.msg_sender_id
    chat_messages = []
    for m in messages:
        if m.msg_sender_id == sender_id:
            chat_messages.append(m)
        else:
            break

    reorged_msgs = reorg_reversed_msgs(chat_messages=chat_messages, max_images=0)
    return reorged_msgs


def reorg_reversed_msgs(chat_messages: List[Message], max_images: int = 2, prefix: str = "") -> List[Part]:
    """Reorg chat_message: merge consecutive text, split by image, separate different sender with <sender id>.

    Args:
        chat_messages (List[Message]): List of messages in the chat history.
        max_images (int): Maximum number of images to include.
        prefix (str): Prefix to add to each message part.

    Returns:
        List[Part]: List of reorganized messages.
    """
    reorged_list: List[Part] = []
    current_text = ""
    last_sender = None
    image_count = 0

    def get_sender_tag(sender_id) -> str:
        if sender_id:
            return f"<user: {sender_id[-6:]}>"
        else:
            return ""

    for chat_msg in chat_messages:
        if not chat_msg.msg_llm_compatible:
            continue
        for part in chat_msg.msg_llm_compatible:
            if part.text:
                if last_sender is None or last_sender != chat_msg.msg_sender_id:
                    if current_text:
                        sender_tag = get_sender_tag(last_sender or chat_msg.msg_sender_id)
                        reorged_list.append(Part(text=f"{sender_tag}\n{current_text}"))
                        current_text = ""

                current_text = f"{part.text}\n{current_text}".strip()
                last_sender = chat_msg.msg_sender_id
            elif part.inline_data and part.inline_data.mime_type and part.inline_data.mime_type.startswith("image"):
                if current_text:
                    reorged_list.append(Part(text=current_text))
                    current_text = ""

                if image_count < max_images:
                    reorged_list.append(part)
                    image_count += 1
            else:
                continue
    if current_text:
        sender_tag = get_sender_tag(last_sender)
        part = Part(text=f"{sender_tag}\n{current_text}".strip())
        if prefix:
            part = Part(text=f"{prefix}\n\n{part.text}")

        reorged_list.append(part)
    elif prefix:
        reorged_list.append(Part(text=prefix))

    reorged_list.reverse()
    return reorged_list
