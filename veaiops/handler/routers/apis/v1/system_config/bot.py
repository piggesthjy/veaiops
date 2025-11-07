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
from datetime import datetime, timezone
from typing import Any, List, Literal, Optional, Set

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import Eq
from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, status

from veaiops.agents.chatops.default import set_default_bot
from veaiops.handler.errors import BadRequestError, RecordNotFoundError
from veaiops.handler.services.user import get_current_supervisor, get_current_user
from veaiops.schema.base import AgentCfg, VolcCfg
from veaiops.schema.documents import Bot, BotAttribute, Interest, VeKB
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse
from veaiops.schema.models.config import CreateBotPayload, UpdateBotPayload
from veaiops.schema.types import ChannelType, KBType
from veaiops.utils.bot import check_bot_configuration, reload_bot_group_chat
from veaiops.utils.crypto import EncryptedSecretStr, decrypt_secret_value
from veaiops.utils.log import logger

bot_router = APIRouter(prefix="/bots", tags=["Bots"])


@bot_router.post("/", response_model=APIResponse[Bot], status_code=status.HTTP_201_CREATED)
async def create_bot(
    bot_data: CreateBotPayload, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_supervisor)
) -> APIResponse[Bot]:
    """Create a new bot with progressive configuration support.

    Phase 1 (Required): Basic bot information - channel, bot_id, secret
    Phase 2 (Optional): Advanced ChatOps configuration - volc_cfg, agent_cfg, webhook_urls

    If Phase 2 configurations are not provided, system defaults will be used.

    Args:
        bot_data (CreateBotPayload): The data for the new bot.
        background_tasks (BackgroundTasks): FastAPI background tasks for async operations.
        current_user (User): The currently authenticated user.

    Returns:
        APIResponse[Bot]: API response containing the created bot information.
    """
    # Handle volc_cfg: use provided config or system default
    if bot_data.volc_cfg:
        ak = (
            EncryptedSecretStr(bot_data.volc_cfg.ak.get_secret_value())
            if bot_data.volc_cfg.ak is not None
            else VolcCfg().ak
        )
        sk = (
            EncryptedSecretStr(bot_data.volc_cfg.sk.get_secret_value())
            if bot_data.volc_cfg.sk is not None
            else VolcCfg().sk
        )
        volc_cfg = VolcCfg(
            ak=ak,
            sk=sk,
            tos_region=bot_data.volc_cfg.tos_region,
            tos_endpoint=bot_data.volc_cfg.tos_endpoint,
            extra_kb_collections=bot_data.volc_cfg.extra_kb_collections,
        )
    else:
        volc_cfg = VolcCfg(
            ak=EncryptedSecretStr(""),
            sk=EncryptedSecretStr(""),
        )

    # Handle agent_cfg: use provided config or system default
    if bot_data.agent_cfg:
        apikey = (
            EncryptedSecretStr(bot_data.agent_cfg.api_key.get_secret_value())
            if bot_data.agent_cfg.api_key is not None
            else AgentCfg().api_key
        )
        agent_cfg = AgentCfg(
            provider="openai",
            name=bot_data.agent_cfg.name,
            embedding_name=bot_data.agent_cfg.embedding_name,
            api_base=bot_data.agent_cfg.api_base,
            api_key=apikey,
        )
    else:
        agent_cfg = AgentCfg(
            provider="openai",
            api_key=EncryptedSecretStr(""),
        )

    # Create a new bot instance
    new_bot = Bot(
        channel=bot_data.channel,
        bot_id=bot_data.bot_id,
        secret=EncryptedSecretStr(bot_data.secret.get_secret_value()),
        volc_cfg=volc_cfg,
        agent_cfg=agent_cfg,
        created_user=current_user.username,
        updated_user=current_user.username,
    )

    # do bot ak/sk check
    try:
        await check_bot_configuration(bot_data.bot_id, bot_data.secret.get_secret_value(), bot_data.channel)
    except Exception as e:
        raise BadRequestError(message=f"{e}")

    # do volc_cfg check
    try:
        await volc_cfg.do_check()
    except Exception as e:
        raise BadRequestError(message=f"Volc configuration err with known reason. e:{e}")

    # Save the new bot
    _bot = await Bot.find_one(Bot.channel == new_bot.channel, Bot.bot_id == new_bot.bot_id)
    if not _bot:
        await new_bot.insert()
        await set_default_bot(bot=new_bot)
        if new_bot.volc_cfg.extra_kb_collections:
            instances: List[VeKB] = [
                VeKB(
                    bot_id=new_bot.bot_id,
                    channel=new_bot.channel,
                    collection_name=item,
                    project="default",
                    kb_type=KBType.Custom,
                    bucket_name="",
                )
                for item in set(new_bot.volc_cfg.extra_kb_collections)
                if item != ""
            ]
            await VeKB.insert_many(instances)
    else:
        new_bot = _bot

    # Reload group chat list in the background
    background_tasks.add_task(reload_bot_group_chat, bot_id=new_bot.bot_id, channel=new_bot.channel)

    return APIResponse(
        message="Bot created successfully",
        data=new_bot,
    )


@bot_router.get("/", response_model=PaginatedAPIResponse[List[Bot]])
async def get_all_bots(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    channel: Optional[ChannelType] = None,
) -> PaginatedAPIResponse[List[Bot]]:
    """Get all bots with optional skip, limit, name and channel filtering.

    Args:
        skip (int): Number of bots to skip (default: 0).
        limit (int): Maximum number of bots to return (default: 100).
        name (Optional[str]): Optional name filter for fuzzy matching.
        channel (Optional[ChannelType]): Optional channel filter.

    Returns:
        PaginatedResponse[List[Bot]]: API response containing list of bots with pagination info.
    """
    # Build query based on provided parameters
    query_filters = {}
    if name:
        query_filters["name"] = {"$regex": name, "$options": "i"}
    if channel:
        query_filters["channel"] = channel

    # Build query
    if query_filters:
        query = Bot.find(query_filters)
    else:
        query = Bot.find_all()

    # Calculate total count
    total = await query.count()

    # Apply skip and limit
    bots = await query.skip(skip).limit(limit).to_list()

    return PaginatedAPIResponse(
        message="Bots retrieved successfully",
        data=bots,
        limit=limit,
        skip=skip,
        total=total,
    )


@bot_router.get("/{uid}", response_model=APIResponse[Bot])
async def get_bot_by_id(uid: PydanticObjectId) -> APIResponse[Bot]:
    """Get a bot by ID.

    Args:
        uid (PydanticObjectId): The ID of the bot Document to retrieve.

    Returns:
        APIResponse[Bot]: API response containing the bot information.
    """
    bot = await Bot.get(uid)
    if not bot:
        raise RecordNotFoundError(message=f"Bot with ID {uid} not found")

    return APIResponse(message="Bot retrieved successfully", data=bot)


@bot_router.get("/{uid}/secrets", response_model=APIResponse[str])
async def get_bot_secret(
    uid: PydanticObjectId,
    field_name: Literal["secret", "agent_cfg.api_key", "volc_cfg.ak", "volc_cfg.sk"],
    current_user: User = Depends(get_current_supervisor),
) -> APIResponse[str]:
    """Get a decrypted secret value from a bot by its ID and field name.

    Args:
        uid (PydanticObjectId): The ID of the bot Document to retrieve.
        field_name (str): The name of the secret field to decrypt.
                          Allowed values: "secret", "agent_cfg.api_key", "volc_cfg.ak", "volc_cfg.sk".
        current_user (User): The current user to retrieve secret value from.

    Returns:
        APIResponse[str]: API response containing the decrypted secret value.
    """
    bot = await Bot.get(uid)
    if not bot:
        raise RecordNotFoundError(message=f"Bot with ID {uid} not found")

    logger.info(f"Retrieving bot {uid} secret value by {current_user}")
    decrypted_value: str = ""
    match field_name:
        case "secret":
            decrypted_value = decrypt_secret_value(bot.secret)
        case "agent_cfg.api_key":
            if bot.agent_cfg:
                decrypted_value = decrypt_secret_value(bot.agent_cfg.api_key)
        case "volc_cfg.ak":
            if bot.volc_cfg:
                decrypted_value = decrypt_secret_value(bot.volc_cfg.ak)
        case "volc_cfg.sk":
            if bot.volc_cfg:
                decrypted_value = decrypt_secret_value(bot.volc_cfg.sk)
        case _:
            # This case should not be reached due to Literal typing, but as a safeguard:
            raise BadRequestError(message=f"Invalid field name: {field_name}")

    return APIResponse(message="Secret retrieved successfully", data=decrypted_value)


@bot_router.put("/{uid}", response_model=APIResponse[bool])
async def update_bot_by_id(
    uid: PydanticObjectId, payload: UpdateBotPayload, current_user: User = Depends(get_current_user)
) -> APIResponse[bool]:
    """Update a bot by ID.

    Args:
        uid (PydanticObjectId): The ID of the bot Document to update.
        payload (UpdateBotPayload): The data to update.
        current_user (User): The currently authenticated user.

    Returns:
        APIResponse[bool]: API response indicating success or failure of update.
    """
    # Find the bot by ID
    db_bot = await Bot.get(uid)
    if not db_bot:
        raise RecordNotFoundError(message=f"Bot with ID {uid} not found")

    update_data = payload.model_dump(exclude_unset=True)
    # Handle secret if it's being updated
    if "secret" in update_data and update_data["secret"] is not None:
        update_data["secret"] = EncryptedSecretStr(update_data["secret"].get_secret_value())
    else:
        update_data["secret"] = db_bot.secret
    try:
        await check_bot_configuration(db_bot.bot_id, decrypt_secret_value(update_data["secret"]), db_bot.channel)
    except Exception as e:
        raise BadRequestError(message=str(e))
    for key, value in update_data.items():
        setattr(db_bot, key, value)
    agent_cfg = payload.agent_cfg
    if agent_cfg:
        if agent_cfg.api_key is not None:
            api_key = EncryptedSecretStr(agent_cfg.api_key.get_secret_value())
        else:
            api_key = db_bot.agent_cfg.api_key
        db_bot.agent_cfg = AgentCfg(
            provider="openai",
            name=agent_cfg.name,
            embedding_name=agent_cfg.embedding_name,
            api_base=agent_cfg.api_base,
            api_key=api_key,
        )
        try:
            await db_bot.agent_cfg.do_check()
        except Exception as e:
            raise BadRequestError(message=str(e))
    volc_cfg = payload.volc_cfg
    if volc_cfg:
        if volc_cfg.ak is not None:
            ak = EncryptedSecretStr(volc_cfg.ak.get_secret_value())
        else:
            ak = db_bot.volc_cfg.ak
        if volc_cfg.sk is not None:
            sk = EncryptedSecretStr(volc_cfg.sk.get_secret_value())
        else:
            sk = db_bot.volc_cfg.sk
        db_bot.volc_cfg = VolcCfg(
            ak=ak,
            sk=sk,
            tos_region=volc_cfg.tos_region,
            tos_endpoint=volc_cfg.tos_endpoint,
            extra_kb_collections=volc_cfg.extra_kb_collections,
        )
        try:
            await db_bot.volc_cfg.do_check()
        except Exception as e:
            raise BadRequestError(message=str(e))

    db_bot.updated_at = datetime.now(timezone.utc)
    db_bot.updated_user = current_user.username
    await db_bot.save()

    conditions: List[Any] = [
        Eq(VeKB.bot_id, db_bot.bot_id),
        Eq(VeKB.channel, db_bot.channel),
        Eq(VeKB.kb_type, KBType.Custom),
    ]
    veKBs = await VeKB.find(*conditions).to_list()

    exist_collection_names: Set[str] = set()
    exist_id_map: dict[str, str] = {}  # key: collection_name, value: document_id

    for kb in veKBs:
        exist_collection_names.add(kb.collection_name)
        exist_id_map[kb.collection_name] = str(kb.id)

    new_collection_names = db_bot.volc_cfg.extra_kb_collections or []
    ids_to_delete: List[ObjectId] = [
        ObjectId(exist_id_map[name]) for name in exist_collection_names if name not in new_collection_names
    ]
    if ids_to_delete:
        await VeKB.find({"_id": {"$in": ids_to_delete}}).delete_many()

    need_create_instances: List[VeKB] = [
        VeKB(
            bot_id=db_bot.bot_id,
            channel=db_bot.channel,
            collection_name=name,
            project="default",
            kb_type=KBType.Custom,
            bucket_name="",
        )
        for name in set(new_collection_names)
        if name not in exist_collection_names and name != ""
    ]
    if need_create_instances:
        await VeKB.insert_many(need_create_instances)

    return APIResponse(
        message=f"Bot with ID {uid} updated successfully",
        data=True,
    )


@bot_router.delete("/{uid}", response_model=APIResponse[bool])
async def delete_bot_by_id(uid: PydanticObjectId) -> APIResponse[bool]:
    """Delete a bot by ID.

    Args:
        uid (PydanticObjectId): The ID of the bot Document to delete.

    Returns:
        APIResponse[bool]: API response indicating success or failure of deletion.
    """
    # Find the bot by ID
    bot = await Bot.get(uid)
    if not bot:
        raise RecordNotFoundError(message=f"Bot with ID {uid} not found")

    # Delete the InterestAgentConfigs and BotAttributes related to the bot
    query = {"channel": bot.channel, "bot_id": bot.bot_id}

    await BotAttribute.find(query).delete_many()
    await Interest.find(query).delete_many()

    # Delete Bot
    await bot.delete()

    return APIResponse(
        message=f"Bot with ID {uid} deleted successfully",
        data=True,
    )
