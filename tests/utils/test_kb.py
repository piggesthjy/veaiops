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

import json
from unittest.mock import MagicMock

import pytest
from volcengine.viking_knowledgebase import Doc, Point

from veaiops.schema.types import CitationType
from veaiops.utils.kb import (
    EnhancedCollection,
    EnhancedVikingKBService,
    convert_viking_to_citations,
)


# Fixtures
@pytest.fixture
def mock_service():
    """Create a mock Viking KB service."""
    return MagicMock()


@pytest.fixture
def collection(mock_service):
    """Create an EnhancedCollection instance with mock service."""
    return EnhancedCollection(mock_service, "test_collection")


# EnhancedCollection Tests


def test_delete_point(collection, mock_service):
    """Test delete_point with basic and optional parameters."""
    # Test basic parameters
    collection.delete_point("point_123")
    mock_service.json_exception.assert_called_once()
    call_args = mock_service.json_exception.call_args
    params = json.loads(call_args[0][2])
    assert params["point_id"] == "point_123"
    assert params["collection_name"] == "test_collection"
    assert params["project"] == "default"

    # Test with all optional parameters
    mock_service.reset_mock()
    collection.delete_point(
        "point_123",
        collection_name="other_collection",
        project="custom_project",
        resource_id="res_456",
    )
    call_args = mock_service.json_exception.call_args
    params = json.loads(call_args[0][2])
    assert params["point_id"] == "point_123"
    assert params["collection_name"] == "other_collection"
    assert params["project"] == "custom_project"
    assert params["resource_id"] == "res_456"


def test_add_doc_lark_type(collection, mock_service):
    """Test add_doc with lark type."""
    collection.add_doc(
        add_type="lark",
        doc_id="doc_123",
        doc_type="document",
        lark_file={"file_id": "lark_123"},
        meta={"author": "test"},
    )

    call_args = mock_service.json_exception.call_args
    params = json.loads(call_args[0][2])
    assert params["add_type"] == "lark"
    assert params["doc_id"] == "doc_123"
    assert params["lark_file"] == {"file_id": "lark_123"}
    assert params["meta"] == {"author": "test"}


def test_list_docs(mock_service):
    """Test list_docs with basic and filter parameters."""
    # Test basic parameters
    mock_service.json_exception.return_value = json.dumps(
        {"data": {"doc_list": [{"doc_id": "doc_1", "doc_name": "Doc 1"}]}}
    )
    collection = EnhancedCollection(mock_service, "test_collection")
    docs = collection.list_docs()
    assert len(docs) == 1
    assert isinstance(docs[0], Doc)

    # Test with filter parameters
    mock_service.reset_mock()
    mock_service.json_exception.return_value = json.dumps({"data": {"doc_list": [{"doc_id": "doc_1"}]}})
    collection = EnhancedCollection(mock_service, "test_collection")
    collection.list_docs(offset=10, limit=50, doc_type="pdf", filter={"status": "active"})
    call_args = mock_service.json_exception.call_args
    params = json.loads(call_args[0][2])
    assert params["offset"] == 10
    assert params["limit"] == 50
    assert params["filter"] == {"status": "active"}


def test_check_doc_exists_success(mock_service):
    """Test check_doc_exists when doc is ready."""
    collection = EnhancedCollection(mock_service, "test_collection")

    mock_doc = MagicMock(spec=Doc)
    mock_doc.status = {"process_status": 0}
    collection.get_doc = MagicMock(return_value=mock_doc)

    result = collection.check_doc_exists("doc_123")

    assert result == mock_doc


def test_check_doc_exists_failed_processing(mock_service):
    """Test check_doc_exists when doc processing failed."""
    collection = EnhancedCollection(mock_service, "test_collection")

    mock_doc = MagicMock(spec=Doc)
    mock_doc.status = {"process_status": 1}
    collection.get_doc = MagicMock(return_value=mock_doc)
    collection.delete_doc = MagicMock()

    result = collection.check_doc_exists("doc_123")

    assert result is None
    collection.delete_doc.assert_called_once_with(project="default", doc_id="doc_123")


def test_check_doc_exists_not_ready(mock_service):
    """Test check_doc_exists when doc is not ready."""
    from tenacity import RetryError

    collection = EnhancedCollection(mock_service, "test_collection")

    mock_doc = MagicMock(spec=Doc)
    mock_doc.status = {"process_status": 2, "failed_code": "ERROR_001"}
    collection.get_doc = MagicMock(return_value=mock_doc)

    with pytest.raises(RetryError):
        collection.check_doc_exists("doc_123")


def test_add_point(mock_service):
    """Test add_point with various parameter combinations."""
    mock_service.json_exception.return_value = json.dumps({"data": {"point_id": "point_123", "doc_id": "doc_123"}})
    collection = EnhancedCollection(mock_service, "test_collection")

    # Test successful case
    mock_doc = MagicMock(spec=Doc)
    mock_doc.status = {"process_status": 0}
    collection.check_doc_exists = MagicMock(return_value=mock_doc)

    point = collection.add_point(doc_id="doc_123", chunk_type="text", content="Test content")
    assert isinstance(point, Point)

    # Test when doc is not ready
    collection.check_doc_exists = MagicMock(return_value=None)
    point = collection.add_point(doc_id="doc_123", chunk_type="text")
    assert point is None

    # Test with all optional parameters
    mock_service.reset_mock()
    collection.check_doc_exists = MagicMock(return_value=mock_doc)
    mock_service.json_exception.return_value = json.dumps({"data": {"point_id": "point_123"}})

    point = collection.add_point(
        doc_id="doc_123",
        chunk_type="faq",
        content="Answer",
        question="Question",
        fields=[{"name": "field1"}],
        resource_id="res_456",
    )
    assert isinstance(point, Point)
    call_args = mock_service.json_exception.call_args
    params = json.loads(call_args[0][2])
    assert params["question"] == "Question"
    assert params["fields"] == [{"name": "field1"}]


def test_update_point_with_all_params(mock_service):
    """Test update_point with all optional parameters."""
    collection = EnhancedCollection(mock_service, "test_collection")

    collection.update_point(
        point_id="point_123",
        collection_name="other_collection",
        project="custom_project",
        resource_id="res_456",
        content="New content",
        fields=[{"field": "value"}],
        question="New question",
    )

    call_args = mock_service.json_exception.call_args
    params = json.loads(call_args[0][2])
    assert params["point_id"] == "point_123"
    assert params["content"] == "New content"
    assert params["question"] == "New question"
    assert params["fields"] == [{"field": "value"}]


def test_list_all_points(mock_service):
    """Test list_all_points with various batch scenarios."""
    collection = EnhancedCollection(mock_service, "test_collection")

    # Test single batch
    mock_points = [MagicMock(spec=Point) for _ in range(50)]
    collection.list_points = MagicMock(return_value=mock_points)
    points = collection.list_all_points()
    assert len(points) == 50

    # Test multiple batches
    batch1 = [MagicMock(spec=Point) for _ in range(100)]
    batch2 = [MagicMock(spec=Point) for _ in range(50)]
    collection.list_points = MagicMock(side_effect=[batch1, batch2])
    points = collection.list_all_points(doc_ids=["doc_1"])
    assert len(points) == 150
    assert collection.list_points.call_count == 2

    # Test max offset limit
    mock_points = [MagicMock(spec=Point) for _ in range(100)]
    collection.list_points = MagicMock(return_value=mock_points)
    points = collection.list_all_points()
    # Should stop at offset 20000
    assert collection.list_points.call_count == 200
    assert len(points) == 20000


# EnhancedVikingKBService Tests


def test_get_api_info():
    """Test get_api_info returns correct structure."""
    api_info = EnhancedVikingKBService.get_api_info()

    # Check some key endpoints
    assert "CreateCollection" in api_info
    assert "GetCollection" in api_info
    assert "AddDoc" in api_info
    assert "DeleteDoc" in api_info
    assert "AddPoint" in api_info
    assert "UpdatePoint" in api_info
    assert "SearchCollection" in api_info
    assert "Ping" in api_info

    # Verify API info structure
    create_collection = api_info["CreateCollection"]
    assert create_collection.method == "POST"
    assert "/api/knowledge/collection/create" in create_collection.path


def test_service_get_collection(mock_service):
    """Test get_collection method with and without resource_id."""
    service = EnhancedVikingKBService(ak="test_ak", sk="test_sk")

    # Test basic get_collection
    mock_response = {
        "data": {
            "collection_name": "test_collection",
            "pipeline_list": [{"index_list": [{"index_config": {"fields": [{"name": "field1", "type": "text"}]}}]}],
        }
    }
    service.json_exception = MagicMock(return_value=json.dumps(mock_response))
    collection = service.get_collection("test_collection")
    assert isinstance(collection, EnhancedCollection)
    assert collection.collection_name == "test_collection"

    # Test with resource_id
    service.json_exception = MagicMock(return_value=json.dumps(mock_response))
    service.get_collection("test_collection", project="custom_project", resource_id="res_123")
    call_args = service.json_exception.call_args
    params = json.loads(call_args[0][2])
    assert params["name"] == "test_collection"
    assert params["project"] == "custom_project"
    assert params["resource_id"] == "res_123"


# convert_viking_to_citations Tests


def test_convert_viking_to_citations(mock_service):
    """Test citation conversion with various data sources and edge cases."""
    # Test single document citation
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Test content",
                    "chunk_source": "document",
                    "doc_info": {
                        "doc_name": "Test Document",
                        "update_time": 1234567890,
                        "doc_meta": json.dumps([{"field_name": "source", "field_value": "http://example.com"}]),
                    },
                }
            ]
        }
    ]
    citations = convert_viking_to_citations(viking_returns)
    assert len(citations) == 1
    assert citations[0].title == "Test Document"
    assert citations[0].content == "Test content"
    assert citations[0].source == "http://example.com"
    assert citations[0].citation_type == CitationType.Document

    # Test QA citation
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Answer content",
                    "original_question": "What is the question?",
                    "chunk_source": "qa",
                    "doc_info": {"doc_name": "FAQ Doc", "update_time": 1234567890},
                }
            ]
        }
    ]
    citations = convert_viking_to_citations(viking_returns)
    assert len(citations) == 1
    assert citations[0].title == "What is the question?"
    assert citations[0].citation_type == CitationType.QA

    # Test multiple documents
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Content 1",
                    "doc_info": {"doc_name": "Doc 1"},
                },
                {
                    "id": "point_2",
                    "content": "Content 2",
                    "doc_info": {"doc_name": "Doc 2"},
                },
            ]
        }
    ]
    citations = convert_viking_to_citations(viking_returns)
    assert len(citations) == 2

    # Test missing doc_meta
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Content",
                    "doc_info": {"doc_name": "Doc"},
                }
            ]
        }
    ]
    citations = convert_viking_to_citations(viking_returns)
    assert len(citations) == 1
    assert citations[0].source == ""

    # Test invalid JSON in doc_meta
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Content",
                    "doc_info": {
                        "doc_name": "Doc",
                        "doc_meta": "invalid json {{{",
                    },
                }
            ]
        }
    ]
    citations = convert_viking_to_citations(viking_returns)
    assert len(citations) == 1

    # Test nested and empty result lists
    viking_returns = [
        {"result_list": [{"id": "1", "content": "Content 1", "doc_info": {"doc_name": "Doc 1"}}]},
        {"result_list": [{"id": "2", "content": "Content 2", "doc_info": {"doc_name": "Doc 2"}}]},
        {"result_list": []},
        {"no_result_list": []},
    ]
    citations = convert_viking_to_citations(viking_returns)
    assert len(citations) == 2


def test_qa_citation():
    """Test with QA citation."""
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Answer content",
                    "original_question": "What is the question?",
                    "chunk_source": "qa",
                    "doc_info": {
                        "doc_name": "FAQ Doc",
                        "update_time": 1234567890,
                    },
                }
            ]
        }
    ]

    citations = convert_viking_to_citations(viking_returns)

    assert len(citations) == 1
    assert citations[0].title == "What is the question?"
    assert citations[0].citation_type == CitationType.QA


def test_deduplication_and_conversion(mock_service):
    """Test deduplication and content consolidation for citations."""
    # Test same content deduplication
    viking_returns_same = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Same content",
                    "doc_info": {"doc_name": "Doc 1"},
                },
                {
                    "id": "point_2",
                    "content": "Same content",
                    "doc_info": {"doc_name": "Doc 1"},
                },
            ]
        }
    ]
    citations = convert_viking_to_citations(viking_returns_same)
    assert len(citations) == 1

    # Test different content consolidation
    viking_returns_diff = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Content 1",
                    "doc_info": {"doc_name": "Doc 1"},
                },
                {
                    "id": "point_2",
                    "content": "Content 2",
                    "doc_info": {"doc_name": "Doc 1"},
                },
            ]
        }
    ]
    citations = convert_viking_to_citations(viking_returns_diff)
    assert len(citations) == 1
    assert "Content 1" in citations[0].content
    assert "Content 2" in citations[0].content


def test_multiple_documents():
    """Test with multiple different documents."""
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Content 1",
                    "doc_info": {"doc_name": "Doc 1"},
                },
                {
                    "id": "point_2",
                    "content": "Content 2",
                    "doc_info": {"doc_name": "Doc 2"},
                },
            ]
        }
    ]

    citations = convert_viking_to_citations(viking_returns)

    assert len(citations) == 2
    titles = [c.title for c in citations]
    assert "Doc 1" in titles
    assert "Doc 2" in titles


def test_missing_doc_meta():
    """Test with missing doc_meta."""
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Content",
                    "doc_info": {"doc_name": "Doc"},
                }
            ]
        }
    ]

    citations = convert_viking_to_citations(viking_returns)

    assert len(citations) == 1
    assert citations[0].source == ""


def test_invalid_doc_meta_json():
    """Test with invalid JSON in doc_meta."""
    viking_returns = [
        {
            "result_list": [
                {
                    "id": "point_1",
                    "content": "Content",
                    "doc_info": {
                        "doc_name": "Doc",
                        "doc_meta": "invalid json {{{",
                    },
                }
            ]
        }
    ]

    citations = convert_viking_to_citations(viking_returns)
    assert len(citations) == 1


def test_nested_result_lists():
    """Test with multiple nested result lists."""
    viking_returns = [
        {"result_list": [{"id": "1", "content": "Content 1", "doc_info": {"doc_name": "Doc 1"}}]},
        {"result_list": [{"id": "2", "content": "Content 2", "doc_info": {"doc_name": "Doc 2"}}]},
        {"result_list": []},  # Empty result list
    ]

    citations = convert_viking_to_citations(viking_returns)

    assert len(citations) == 2


def test_empty_result_lists():
    """Test with items that have no result_list."""
    viking_returns = [
        {"no_result_list": []},
        {"result_list": [{"id": "1", "content": "Content", "doc_info": {"doc_name": "Doc"}}]},
    ]

    citations = convert_viking_to_citations(viking_returns)

    assert len(citations) == 1
