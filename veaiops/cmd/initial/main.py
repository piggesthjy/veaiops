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
from veaiops.settings import (
    AgentSettings,
    BotSettings,
    EncryptionSettings,
    LogSettings,
    MongoSettings,
    O11ySettings,
    VolcEngineSettings,
    WebhookSettings,
    get_settings,
    init_settings,
)

init_settings(
    MongoSettings,
    LogSettings,
    EncryptionSettings,
    O11ySettings,
    AgentSettings,
    VolcEngineSettings,
    WebhookSettings,
    BotSettings,
)

import asyncio  # noqa: E402
import os  # noqa: E402
from typing import List  # noqa: E402

from beanie import init_beanie  # noqa: E402
from pymongo import AsyncMongoClient  # noqa: E402

from veaiops.agents.chatops.default import set_default_bot  # noqa: E402
from veaiops.cmd.initial.default_metric_templates import DEFAULT_METRIC_TEMPLATES  # noqa: E402
from veaiops.schema.base import AgentCfg, VolcCfg  # noqa: E402
from veaiops.schema.documents import Bot, User, VeKB  # noqa: E402
from veaiops.schema.documents.template.metric import MetricTemplate  # noqa: E402
from veaiops.schema.types import KBType  # noqa: E402
from veaiops.utils.bot import reload_bot_group_chat  # noqa: E402
from veaiops.utils.crypto import EncryptedSecretStr  # noqa: E402
from veaiops.utils.log import logger  # noqa: E402


async def init_metric_templates() -> None:
    """Initialize metric templates from default data."""
    # Connect to MongoDB
    mongo_client = AsyncMongoClient(get_settings(MongoSettings).mongo_uri)
    mongodb_veaiops = mongo_client.veaiops

    # Initialize Beanie
    await init_beanie(
        mongodb_veaiops,
        document_models=[MetricTemplate],
    )

    # Get templates data
    templates_data: List[dict] = DEFAULT_METRIC_TEMPLATES
    logger.info(f"Loaded {len(templates_data)} metric templates from default data")

    # Import templates to database
    imported_count = 0
    for template_data in templates_data:
        try:
            # Check if template with same name and metric_type already exists
            existing_template = await MetricTemplate.find_one(
                {"name": template_data["name"], "metric_type": template_data["metric_type"]}
            )

            if existing_template:
                logger.info(
                    f"Template {template_data['name']} with metric_type "
                    f"{template_data['metric_type']} already exists, skipping..."
                )
                continue

            # Create new template
            template = MetricTemplate(**template_data)
            await template.insert()
            imported_count += 1
            logger.info(f"Imported template: {template.name} (metric_type: {template.metric_type})")
        except Exception as e:
            logger.error(f"Failed to import template {template_data.get('name', 'Unknown')}: {e}")
            continue

    logger.info(f"Successfully imported {imported_count} metric templates")

    # Close MongoDB connection
    await mongo_client.close()


async def init_bot() -> None:
    """Initialize bot from environment variables."""
    # Connect to MongoDB
    mongo_client = AsyncMongoClient(get_settings(MongoSettings).mongo_uri)
    mongodb_veaiops = mongo_client.veaiops

    # Initialize Beanie with Bot model
    await init_beanie(
        mongodb_veaiops,
        document_models=[Bot, VeKB],
    )

    bot_settings = get_settings(BotSettings)
    volc_settings = get_settings(VolcEngineSettings)
    agent_settings = get_settings(AgentSettings)

    if not bot_settings.id:
        return
    # Set new Bot to Mongo
    bot = Bot(
        channel=bot_settings.channel,
        bot_id=bot_settings.id,
        secret=EncryptedSecretStr(bot_settings.secret.get_secret_value()),
        volc_cfg=VolcCfg(
            ak=EncryptedSecretStr(volc_settings.ak.get_secret_value()),
            sk=EncryptedSecretStr(volc_settings.sk.get_secret_value()),
            tos_endpoint=volc_settings.tos_endpoint,
            tos_region=volc_settings.tos_region,
            extra_kb_collections=volc_settings.extra_kb_collections,
        ),
        agent_cfg=AgentCfg(
            provider=agent_settings.provider,
            name=agent_settings.name,
            embedding_name=agent_settings.embedding_name,
            api_base=agent_settings.api_base,
            api_key=EncryptedSecretStr(agent_settings.api_key.get_secret_value()),
        ),
    )

    # Please do not use await Bot.find_one(Bot.bot_id == bot.bot_id).update(SetOnInsert(bot.model_dump()), upsert=True).
    # Make Sure it can trigger the before_event

    if not await Bot.find_one(Bot.bot_id == bot.bot_id, Bot.channel == bot.channel):
        await bot.insert()
        await set_default_bot(bot=bot)

        asyncio.create_task(reload_bot_group_chat(bot_id=bot.bot_id, channel=bot.channel))
        if bot.volc_cfg.extra_kb_collections:
            instances: List[VeKB] = [
                VeKB(
                    bot_id=bot.bot_id,
                    channel=bot.channel,
                    collection_name=item,
                    project="default",
                    kb_type=KBType.Custom,
                    bucket_name="",
                )
                for item in set(bot.volc_cfg.extra_kb_collections)
                if item != ""
            ]
            await VeKB.insert_many(instances)


async def init_admin_user() -> None:
    """Initialize admin user with credentials from environment variables or defaults."""
    # Get admin user credentials from environment variables or use defaults
    admin_username = os.environ.get("INIT_ADMIN_USERNAME", "admin")
    admin_email = os.environ.get("INIT_ADMIN_EMAIL", "admin@veaiops.com")
    admin_password = os.environ.get("INIT_ADMIN_PASSWORD")
    if not admin_password:
        raise ValueError("INIT_ADMIN_PASSWORD not set!")

    # Connect to MongoDB
    mongo_client = AsyncMongoClient(get_settings(MongoSettings).mongo_uri)
    mongodb_veaiops = mongo_client.veaiops

    # Initialize Beanie with User model
    await init_beanie(
        mongodb_veaiops,
        document_models=[User],
    )

    # Check if admin user already exists
    existing_user = await User.find_one({"username": admin_username})
    if existing_user:
        logger.info(f"User with username '{admin_username}' already exists, skipping creation...")
        await mongo_client.close()
        return

    # Create admin user with encrypted password
    encrypted_password = EncryptedSecretStr(admin_password)

    user = User(
        username=admin_username, email=admin_email, password=encrypted_password, is_supervisor=True, is_active=True
    )

    try:
        await user.insert()
        logger.info(f"Successfully created admin user with username '{admin_username}' and email '{admin_email}'")
        if admin_password == "Veaiops_admin":
            logger.info("IMPORTANT: Please change the default admin password after first login!")
        else:
            logger.info("IMPORTANT: Please keep your admin password secure!")
    except Exception as e:
        logger.error(f"Failed to create admin user: {e}")
    finally:
        # Close MongoDB connection
        await mongo_client.close()


async def init_all() -> None:
    """Initialize all components."""
    logger.info("Starting initialization...")
    await init_metric_templates()
    await init_admin_user()
    await init_bot()
    logger.info("Initialization completed.")


def main() -> None:
    """Main function to run the initialization."""
    logger.info("Starting all initialization...")
    asyncio.run(init_all())
    logger.info("All initialization completed.")


if __name__ == "__main__":
    main()
