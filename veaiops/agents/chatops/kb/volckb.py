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


from io import StringIO
from typing import Any, Optional

import tos
from pydantic import BaseModel, ConfigDict
from tenacity import retry, stop_after_attempt, wait_exponential
from tos import TosClientV2
from volcengine.viking_knowledgebase import FieldType, IndexType, VikingKnowledgeBaseService
from volcengine.viking_knowledgebase.exception import CollectionNotExistException, DocNotExistException

from veaiops.schema.documents import Bot, Chat, Message
from veaiops.schema.types import KBType
from veaiops.utils.kb import EnhancedCollection
from veaiops.utils.log import logger


class VeAIOpsKBManager(BaseModel):
    """Knowledge base for VeAIOps."""

    bot_id: str
    collection_name: str
    project: str
    kb_type: KBType
    bucket_name: str
    tos_client: TosClientV2
    vikingkb: VikingKnowledgeBaseService
    model_config = ConfigDict(arbitrary_types_allowed=True)

    def model_post_init(self, __context: Any) -> None:
        """Post-initialization for the model."""
        self.get_or_create_collection()

    def create_collection(self) -> EnhancedCollection:
        """Create a new knowledge base collection.

        Raises:
            NotImplementedError: If the knowledge base type is not supported.

        Returns:
            EnhancedCollection: The created knowledge base collection.
        """
        preprocessing = None
        match self.kb_type:
            case KBType.AutoDoc:
                index = {
                    "index_type": IndexType.HNSW_HYBRID,
                    "index_config": {
                        "fields": [
                            {"field_name": "bot_id", "field_type": FieldType.String.value, "default_val": None},
                            {"field_name": "source", "field_type": FieldType.String.value, "default_val": None},
                            {"field_name": "file_name", "field_type": FieldType.String.value, "default_val": None},
                            {
                                "field_name": "kb_type",
                                "field_type": FieldType.String.value,
                                "default_val": KBType.AutoDoc.value,
                            },
                        ],
                    },
                }
                preprocessing = {
                    "chunking_strategy": "default",
                    "chunk_length": 200,
                }

            case KBType.AutoQA:
                index = {
                    "index_type": IndexType.HNSW_HYBRID,
                    "index_config": {
                        "fields": [
                            {"field_name": "bot_id", "field_type": FieldType.String.value, "default_val": None},
                            {"field_name": "source", "field_type": FieldType.String.value, "default_val": None},
                            {"field_name": "file_name", "field_type": FieldType.String.value, "default_val": None},
                            {
                                "field_name": "kb_type",
                                "field_type": FieldType.String.value,
                                "default_val": KBType.AutoQA.value,
                            },
                        ],
                    },
                }

            case _:
                raise NotImplementedError(f"create collection for {self.kb_type}")

        collection = self.vikingkb.create_collection(
            collection_name=self.collection_name,
            project=self.project,
            description=f"{self.kb_type} Knowledge base for bot {self.bot_id}",
            data_type="unstructured_data",
            index=index,
            preprocessing=preprocessing,
        )
        return collection

    def get_or_create_collection(self) -> Optional[EnhancedCollection]:
        """Get or create the knowledge base collection.

        Returns:
            Optional[EnhancedCollection]: The knowledge base collection if it exists or was created, None otherwise.
        """
        collection = None
        try:
            collection = self.vikingkb.get_collection(collection_name=self.collection_name, project=self.project)
        except CollectionNotExistException as e:
            logger.info(f"Collection {self.collection_name} does not exist in project {self.project}: {str(e)}")
            # create collection if not exist
            collection = self.create_collection()
        except Exception as e:
            logger.error(f"Error initializing knowledge base collection: {str(e)}")

        return collection

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry_error_callback=lambda retry_state: None,
    )
    async def _put_tos_object(self, data: str, file_name: str, metadata: dict, data_type: str = "txt") -> Optional[str]:
        """Upload an object to TOS.

        Args:
            data (str): The content of the object.
            file_name (str): The name of the file.
            metadata (dict): Metadata associated with the object.
            data_type (str): The file type for tos docs.

        Raises:
            e: If an error occurs while uploading the object.

        Returns:
            Optional[str]: The URL of the uploaded object if successful, None otherwise.
        """
        tos_obj_path = f"{self.bucket_name}/{self.bot_id}/{file_name}.{data_type}"
        try:
            if data_type == "faq.xlsx":
                self.tos_client.put_object_from_file(
                    bucket=self.bucket_name,
                    key=f"{self.bot_id}/{file_name}.{data_type}",
                    file_path=data,
                    meta=metadata,
                )
            else:
                content = StringIO(data)
                self.tos_client.put_object(
                    bucket=self.bucket_name,
                    key=f"{self.bot_id}/{file_name}.{data_type}",
                    content=content,
                    meta=metadata,
                )
            logger.info(f"Put tos object successfully, tos={tos_obj_path}")
            return tos_obj_path
        except tos.exceptions.TosClientError as e:
            logger.error(f"Fail with TOS client error msg={e.message}, cause={e.cause} tos={tos_obj_path}")
            bot = await Bot.find_one(Bot.bot_id == self.bot_id)
            from veaiops.agents.chatops.default.default_knowledgebase import set_default_knowledgebase

            if bot:
                await set_default_knowledgebase(bot=bot)

        except tos.exceptions.TosServerError as e:
            logger.error(
                f"Fail with TOS server error {e.code} msg={e.message}, request_id={e.request_id} tos={tos_obj_path}"
            )
            bot = await Bot.find_one(Bot.bot_id == self.bot_id)
            from veaiops.agents.chatops.default.default_knowledgebase import set_default_knowledgebase

            if bot:
                await set_default_knowledgebase(bot=bot)

        except Exception as e:
            logger.error(f"Unknown TOS put object error {e}, tos={tos_obj_path}")
            raise e

        return None

    async def add_from_text(self, text: str, file_name: str, metadata: dict, data_type: str = "txt") -> bool:
        """Add content to the knowledge base from text.

        Args:
            text (str): Text content to be added.
            file_name (str): The name of the file.
            metadata (dict): Metadata associated with the document.
            data_type (str, optional): The file type for tos docs. Defaults to "txt".

        Raises:
            e: If an error occurs while adding content to the knowledge base.

        Returns:
            bool: True if the content was added successfully, False otherwise.
        """
        # Upload to tos with
        tos_path = await self._put_tos_object(data=text, file_name=file_name, metadata=metadata, data_type=data_type)
        if not tos_path:
            logger.error(f"Upload to TOS failed. file_name={file_name}")
            return False
        logger.info(f"Upload to TOS success url={tos_path}")

        # Add to knowledge base
        collection = self.get_or_create_collection()
        if not isinstance(collection, EnhancedCollection):
            logger.error("Knowledge base collection is not initialized.")
            return False

        collection.add_doc(project=self.project, add_type="tos", tos_path=tos_path, meta=metadata)

        return True

    async def add_from_qa(self, question: str, answer: str, msg_id: str) -> Optional[str]:
        """Add a QA pair to the knowledge base.

        Args:
            question (str): The question text.
            answer (str): The answer text.
            msg_id (str): The message ID associated with the QA pair.

        Raises:
            ValueError: If the message or chat associated with the msg_id is not found.

        Returns:
            Optional[str]: The ID of the added point in the knowledge base, if successful.
        """
        # Add to knowledge base
        collection = self.get_or_create_collection()
        if not isinstance(collection, EnhancedCollection):
            logger.error("Knowledge base collection is not initialized.")
            return None

        # Check qa doc exists

        msg = await Message.find_one(Message.msg_id == msg_id)
        if not msg:
            raise Exception(f"Message with id {msg_id} not found.")
        chat = await Chat.find_one(Chat.chat_id == msg.chat_id)

        if not chat:
            raise Exception(f"Chat with id {msg.chat_id} not found.")

        doc_id = msg.chat_id
        try:
            collection.get_doc(doc_id=doc_id)
        except DocNotExistException:
            logger.info(f"QA doc does not exist, creating new one. bot_id={self.bot_id}")
            import os

            current_dir = os.path.dirname(os.path.abspath(__file__))
            await self.add_from_text(
                text=f"{current_dir}/Q&A问答对.faq.xlsx",
                file_name=f"{chat.name}_{chat.chat_id}",
                metadata={"source": chat.chat_link, "file_name": chat.name, "doc_id": doc_id},
                data_type="faq.xlsx",
            )
        except Exception as e:
            logger.error(f"Error checking QA doc existence: {str(e)}")
            return None

        res = collection.add_point(
            collection_name=self.collection_name,
            project=self.project,
            doc_id=doc_id,
            chunk_type="faq",
            content=answer,
            question=question,
        )
        return res.point_id if res else None
