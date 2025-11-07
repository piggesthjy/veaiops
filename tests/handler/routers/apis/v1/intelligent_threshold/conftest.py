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


import pytest
import pytest_asyncio
from pydantic import SecretStr

from veaiops.schema.base import IntelligentThresholdConfig, MetricThresholdResult
from veaiops.schema.documents import (
    AlarmSyncRecord,
    Connect,
    DataSource,
    IntelligentThresholdTask,
    IntelligentThresholdTaskVersion,
)
from veaiops.schema.documents.datasource.base import VolcengineDataSourceConfig
from veaiops.schema.models.template import MetricTemplateValue
from veaiops.schema.types import (
    AlarmSyncRecordStatus,
    DataSourceType,
    EventLevel,
    IntelligentThresholdDirection,
    IntelligentThresholdTaskStatus,
)


@pytest_asyncio.fixture
async def test_datasource_connect():
    """Create a test connection for datasource."""
    connect = await Connect(
        name="Test Datasource Connect",
        type=DataSourceType.Volcengine,
        zabbix_api_url=None,
        zabbix_api_user=None,
        zabbix_api_password=None,
        aliyun_access_key_id=None,
        aliyun_access_key_secret=None,
        volcengine_access_key_id="test_key_id",
        volcengine_access_key_secret=SecretStr("test_secret"),
        is_active=True,
    ).insert()

    yield connect

    await connect.delete()


@pytest_asyncio.fixture
async def test_datasource(test_datasource_connect):
    """Create a test datasource."""
    datasource = await DataSource(
        name="Test DataSource",
        connect=test_datasource_connect,
        type=DataSourceType.Volcengine,
        volcengine_config=VolcengineDataSourceConfig(
            connect_name=test_datasource_connect.name,
            region="cn-beijing",
            namespace="VCM",
        ),
        is_active=True,
    ).insert()

    yield datasource

    await datasource.delete()


@pytest_asyncio.fixture
async def test_task(test_datasource):
    """Create a test intelligent threshold task."""
    task = await IntelligentThresholdTask(
        task_name="Test Task",
        datasource_id=test_datasource.id,
        datasource_type=DataSourceType.Volcengine,
        auto_update=False,
        projects=["test_project"],
        is_active=True,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    yield task

    await task.delete()


@pytest_asyncio.fixture
async def test_task_version(test_task):
    """Create a test task version."""
    version = await IntelligentThresholdTaskVersion(
        task_id=test_task.id,
        version=1,
        metric_template_value=MetricTemplateValue(name="cpu_usage"),
        n_count=10,
        direction=IntelligentThresholdDirection.UP,
        status=IntelligentThresholdTaskStatus.SUCCESS,
        result=[
            MetricThresholdResult(
                name="cpu.usage",
                thresholds=[IntelligentThresholdConfig(start_hour=0, end_hour=24, upper_bound=80.0, window_size=10)],
                labels={"host": "test"},
                unique_key="cpu.usage_host=test",
                status="Success",
                error_message="",
            )
        ],
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    yield version

    await version.delete()


@pytest_asyncio.fixture
async def test_alarm_sync_record(test_task, test_task_version):
    """Create a test alarm sync record."""
    record = await AlarmSyncRecord(
        task_id=test_task.id,
        task_version_id=test_task_version.id,
        status=AlarmSyncRecordStatus.SUCCESS,
        contact_group_ids=["test_group"],
        webhook="http://test.com/webhook",
        alert_methods=["email"],
        alarm_level=EventLevel.P2,
        total=5,
        created=2,
        updated=2,
        deleted=1,
        failed=0,
    ).insert()

    yield record

    await record.delete()


@pytest.fixture
def mock_call_threshold_agent(monkeypatch):
    """Mock call_threshold_agent to avoid external HTTP calls."""

    async def _mock_call(*args, **kwargs):
        return None

    monkeypatch.setattr(
        "veaiops.handler.routers.apis.v1.intelligent_threshold.task.call_threshold_agent",
        _mock_call,
    )
    monkeypatch.setattr(
        "veaiops.handler.services.intelligent_threshold.mcp.call_threshold_agent",
        _mock_call,
    )
    return _mock_call


@pytest.fixture
def mock_datasource_sync_rules(monkeypatch):
    """Mock datasource sync_rules_for_intelligent_threshold_task method."""

    async def _mock_sync_rules(*args, **kwargs):
        return {
            "total": 5,
            "created": 2,
            "updated": 2,
            "deleted": 1,
            "failed": 0,
            "rule_operations": {"created_ids": ["rule1", "rule2"], "updated_ids": ["rule3", "rule4"]},
        }

    # Mock the DataSourceFactory.create_datasource method
    class MockDataSource:
        async def sync_rules_for_intelligent_threshold_task(self, *args, **kwargs):
            return await _mock_sync_rules(*args, **kwargs)

    def _mock_create_datasource(*args, **kwargs):
        return MockDataSource()

    monkeypatch.setattr(
        "veaiops.handler.services.intelligent_threshold.alarm.DataSourceFactory.create_datasource",
        _mock_create_datasource,
    )

    return _mock_sync_rules


@pytest.fixture
def mock_threshold_recommender(monkeypatch):
    """Mock global threshold recommender."""

    class MockThresholdRecommender:
        async def handle_task(self, *args, **kwargs):
            return None

        async def get_queue_status(self):
            return {
                "queue_size": 0,
                "processing_count": 0,
                "completed_count": 10,
                "failed_count": 0,
            }

    def _mock_get_recommender():
        return MockThresholdRecommender()

    monkeypatch.setattr(
        "veaiops.handler.routers.apis.v1.intelligent_threshold.mcp.get_global_threshold_recommender",
        _mock_get_recommender,
    )

    return _mock_get_recommender
