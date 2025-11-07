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

"""Utility functions for channel tests."""

from typing import Any, Optional


def create_url_verification_payload(challenge: str) -> dict[str, Any]:
    """Create a URL verification payload for Lark webhook.

    Args:
        challenge: Challenge string to be echoed back

    Returns:
        dict: URL verification payload
    """
    return {
        "type": "url_verification",
        "challenge": challenge,
    }


def create_lark_message_payload(
    bot_id: str,
    chat_id: str,
    msg_id: str,
    content: str,
    msg_type: str = "text",
    mentions: Optional[list[dict[str, Any]]] = None,
    chat_type: str = "group",
    message_type: Optional[str] = None,
    create_time_ms: Optional[int] = None,
) -> dict[str, Any]:
    """Create a Lark message payload for testing.

    Args:
        bot_id: Bot ID
        chat_id: Chat/session ID
        msg_id: Message ID
        content: Message content (JSON string for text messages)
        msg_type: Message type (default: "text")
        mentions: Optional list of mentions
        chat_type: Chat type (default: "group")

    Returns:
        dict: Lark message webhook payload
    """
    # allow tests to pass either `message_type` or `msg_type`
    final_msg_type = message_type or msg_type

    # allow tests to pass create_time in ms; fall back to fixed default string if not provided
    final_create_time = str(create_time_ms) if create_time_ms is not None else "1609459200000"

    payload = {
        "schema": "2.0",
        "header": {
            "event_id": f"evt_{msg_id}",
            "event_type": "im.message.receive_v1",
            "app_id": bot_id,
            "create_time": final_create_time,
            "token": "test_token",
        },
        "event": {
            "sender": {
                "sender_id": {
                    "open_id": "ou_test_sender",
                },
                "sender_type": "user",
            },
            "message": {
                "message_id": msg_id,
                "message_type": final_msg_type,
                "content": content,
                "create_time": final_create_time,
                "chat_id": chat_id,
                "chat_type": chat_type,
            },
        },
    }

    if mentions:
        payload["event"]["message"]["mentions"] = mentions

    return payload


def create_lark_chat_payload(
    bot_id: str,
    chat_id: str,
    chat_name: str,
    chat_type: str = "group",
    operator_id: str = "ou_operator",
    create_time_ms: Optional[int] = None,
) -> dict[str, Any]:
    """Create a Lark chat event payload for testing (e.g., bot added to chat).

    Args:
        bot_id: Bot ID
        chat_id: Chat/session ID
        chat_name: Chat name
        chat_type: Chat type (default: "group")
        operator_id: Operator user ID (default: "ou_operator")

    Returns:
        dict: Lark chat event webhook payload
    """
    final_create_time = str(create_time_ms) if create_time_ms is not None else "1609459200000"

    return {
        "schema": "2.0",
        "header": {
            "event_id": f"evt_{chat_id}_add",
            "event_type": "im.chat.member.bot.added_v1",
            "app_id": bot_id,
            "create_time": final_create_time,
            "token": "test_token",
        },
        "event": {
            "chat_id": chat_id,
            "chat_type": chat_type,
            "name": chat_name,
            "operator_id": {
                "open_id": operator_id,
            },
        },
    }
