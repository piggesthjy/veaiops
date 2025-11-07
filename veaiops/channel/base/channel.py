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

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TypeVar

from beanie import Document
from fastapi.responses import JSONResponse
from google.genai.types import Part

from veaiops.schema.documents import Chat, Message
from veaiops.schema.types import AgentType, ChannelType
from veaiops.utils.log import logger

# Type variable for Document classes
T = TypeVar("T", bound=Document)


class BaseChannel(ABC):
    """Base class for all chat channels."""

    channel: ChannelType
    msg: Optional[Message] = None
    chat: Optional[Chat] = None

    @abstractmethod
    async def payload_to_msg(self, payload: Dict[str, Any]) -> Optional[Message]:
        """Convert provider payload -> Message.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.

        Returns:
            Optional[Message]: The constructed Message object.
        """
        pass

    @abstractmethod
    async def msg_to_llm_compatible(self, *args, **kwargs) -> List[Part]:
        """Convert message to LLM-compatible input content."""
        pass

    @abstractmethod
    async def payload_to_chat(self, payload: Dict[str, Any]) -> Optional[Chat]:
        """Convert provider payload -> Chat.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.

        Returns:
            Optional[Chat]: The constructed Chat object.
        """
        pass

    @abstractmethod
    async def payload_response(self, payload: Dict[str, Any]) -> JSONResponse:
        """Convert provider payload -> Dict response.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.

        Returns:
            JSONResponse: The response object to be sent back to the provider.
        """
        pass

    async def check_idempotence(self, document_class: type[T], **filter_kwargs: Any) -> bool:
        """Check if document with given filter criteria already exists.

        This is a generic idempotence check method that can work with any Document class.
        It uses the provided filter criteria to query the database.

        Args:
            document_class: The Document class to query (e.g., Message, Chat)
            **filter_kwargs: Keyword arguments for filtering the documents
                            These should match the field names in the document_class

        Returns:
            bool: True if document already exists, False otherwise
        """
        try:
            # Build the query using the provided filter criteria
            query_conditions = {}
            for field_name, field_value in filter_kwargs.items():
                # Check if field exists in the document class
                if hasattr(document_class, field_name):
                    query_conditions[field_name] = field_value
                else:
                    logger.warning(
                        f"Field '{field_name}' not found in {document_class.__name__}. This filter will be ignored.",
                    )

            if not query_conditions:
                logger.error("No valid filter criteria provided for idempotence check")
                return False

            # Execute the query using dictionary conditions
            existing_document = await document_class.find_one(query_conditions)

            if existing_document:
                logger.info(f"Document already exists in {document_class.__name__} with criteria: {filter_kwargs}")
                return True
            else:
                logger.debug(f"No existing document found in {document_class.__name__} with criteria: {filter_kwargs}")
                return False

        except Exception as e:
            logger.error(f"Error checking idempotence for {document_class.__name__}: {e}")
            return False

    @abstractmethod
    async def recreate_chat_from_payload(self, payload: dict) -> None:
        """Check if the chat record for the message exists; create it if not.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.
        """
        pass

    async def run_msg_payload(self, payload: dict[str, Any]):
        """Process the incoming payload by converting it to Message and Chat.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.
        """
        msg = await self.payload_to_msg(payload)

        if not msg:
            logger.info(f"Failed to convert payload to Message. Payload: {payload}")
            return
        # Check chat existence, create chat if not exist
        chat = await Chat.find_one(Chat.chat_id == msg.chat_id, Chat.bot_id == msg.bot_id, Chat.channel == msg.channel)
        if not chat:
            await self.recreate_chat_from_payload(payload)

        logger.info(f"Dispatching message to chatops agent handler. msg_id={msg.msg_id}")
        # Import here to avoid circular import
        from veaiops.agents.chatops import chatops_agents_handler

        await chatops_agents_handler(msg)

    @abstractmethod
    async def send_message(self, content: dict, agent_type: AgentType, *args, **kwargs) -> List[str]:
        """Send a message card by template id.

        Args:
            content (dict): The content of the template card.
            agent_type (AgentType): The type of agent sending the message.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            List[str]: The output message id list.
        """
        pass

    @abstractmethod
    async def callback_handle(self, payload: Dict[str, Any]) -> Any:
        """Convert provider payload -> response.

        Args:
            payload (Dict[str, Any]): The incoming payload from the provider.

        Returns:
            The response object to be sent back to the provider.
        """
        pass
