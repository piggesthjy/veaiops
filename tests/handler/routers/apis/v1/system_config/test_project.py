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

from io import BytesIO

import pytest
import pytest_asyncio
from fastapi import UploadFile

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.routers.apis.v1.system_config.project import (
    create_project,
    delete_project_by_id,
    get_all_projects,
    import_projects_from_csv,
)
from veaiops.schema.documents import Project, User
from veaiops.schema.models.config import CreateProjectPayload


@pytest_asyncio.fixture
async def test_project(test_user: User):
    """Fixture to create and clean up a test project."""
    project = Project(
        project_id="test_project_001",
        name="Test Project",
        created_user=test_user.username,
        updated_user=test_user.username,
    )
    await project.insert()
    yield project
    await project.delete()


@pytest_asyncio.fixture
async def test_projects(test_user: User):
    """Fixture to create multiple test projects."""
    projects = [
        Project(
            project_id=f"test_project_{i:03d}",
            name=f"Test Project {i}",
            created_user=test_user.username,
            updated_user=test_user.username,
        )
        for i in range(1, 6)
    ]
    await Project.insert_many(projects)
    yield projects
    for proj in projects:
        await proj.delete()


@pytest.mark.asyncio
async def test_create_project_success(test_user: User, mock_request):
    """Test successfully creating a new project."""
    # Arrange
    project_data = CreateProjectPayload(
        project_id="new_project_001",
        name="New Project",
    )

    # Act
    response = await create_project(request=mock_request, project_data=project_data, user=test_user)

    # Assert
    assert response.message == "Project created successfully"
    assert response.data is not None
    assert response.data.project_id == "new_project_001"
    assert response.data.name == "New Project"
    assert response.data.created_user == test_user.username
    assert response.data.updated_user == test_user.username

    # Verify project was created
    created_project = await Project.find_one(Project.project_id == "new_project_001")
    assert created_project is not None

    # Cleanup
    await created_project.delete()


@pytest.mark.asyncio
async def test_create_project_duplicate_id(test_user: User, test_project: Project, mock_request):
    """Test creating a project with duplicate ID."""
    # Arrange
    project_data = CreateProjectPayload(
        project_id="test_project_001",
        name="Duplicate Project",
    )

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await create_project(request=mock_request, project_data=project_data, user=test_user)

    assert "Project with ID test_project_001 already exists" in str(exc_info.value)


@pytest.mark.asyncio
async def test_get_all_projects_without_filters(test_projects, mock_request):
    """Test getting all projects without filters."""
    # Arrange
    # Act
    response = await get_all_projects(request=mock_request)

    # Assert
    assert response.message == "Projects retrieved successfully"
    assert response.data is not None
    assert len(response.data) >= 5
    assert response.total >= 5
    assert response.skip == 0
    assert response.limit == 100


@pytest.mark.asyncio
async def test_get_all_projects_with_pagination(test_projects, mock_request):
    """Test getting projects with pagination."""
    # Arrange
    # Act
    response = await get_all_projects(request=mock_request, skip=2, limit=2)

    # Assert
    assert response.message == "Projects retrieved successfully"
    assert response.data is not None
    assert len(response.data) == 2
    assert response.skip == 2
    assert response.limit == 2
    assert response.total >= 5


@pytest.mark.asyncio
async def test_get_all_projects_with_name_filter(test_projects, mock_request):
    """Test getting projects with name filter."""
    # Arrange

    # Act
    response = await get_all_projects(request=mock_request, name="Project 3")

    # Assert
    assert response.message == "Projects retrieved successfully"
    assert response.data is not None
    assert len(response.data) == 1
    assert response.data[0].project_id == "test_project_003"
    assert response.total == 1


@pytest.mark.asyncio
async def test_import_projects_from_csv_new_projects(test_user: User, mock_request):
    """Test importing new projects from CSV."""
    # Arrange

    csv_content = b"project_id,name\ncsv_001,CSV Project 1\ncsv_002,CSV Project 2"
    mock_file = UploadFile(filename="projects.csv", file=BytesIO(csv_content))

    # Act
    response = await import_projects_from_csv(request=mock_request, file=mock_file, user=test_user)

    # Assert
    assert response.data is not None
    assert "Imported 2 projects" in response.data
    assert "Successfully imported 2 projects" in response.message

    # Verify projects were inserted
    project1 = await Project.find_one(Project.project_id == "csv_001")
    project2 = await Project.find_one(Project.project_id == "csv_002")
    assert project1 is not None
    assert project1.name == "CSV Project 1"
    assert project1.created_user == test_user.username
    assert project2 is not None
    assert project2.name == "CSV Project 2"
    assert project2.created_user == test_user.username

    # Cleanup
    await Project.find({"project_id": {"$in": ["csv_001", "csv_002"]}}).delete()


@pytest.mark.asyncio
async def test_import_projects_from_csv_with_duplicates(test_user: User, test_project: Project, mock_request):
    """Test importing projects with duplicate IDs."""
    # Arrange

    csv_content = b"project_id,name\ntest_project_001,Duplicate Project\ncsv_003,New Project"
    mock_file = UploadFile(filename="projects.csv", file=BytesIO(csv_content))

    # Act
    response = await import_projects_from_csv(request=mock_request, file=mock_file, user=test_user)

    # Assert
    assert response.data is not None
    assert "Imported 1 projects" in response.data
    assert "Successfully imported 1 projects" in response.message
    assert "Skipped 1" in response.message

    # Verify only new project was inserted
    project = await Project.find_one(Project.project_id == "csv_003")
    assert project is not None
    assert project.name == "New Project"
    assert project.created_user == test_user.username

    # Verify existing project was not modified
    existing = await Project.find_one(Project.project_id == "test_project_001")
    assert existing is not None
    assert existing.name == "Test Project"

    # Cleanup
    csv_project = await Project.find_one(Project.project_id == "csv_003")
    if csv_project:
        await csv_project.delete()


@pytest.mark.asyncio
async def test_import_projects_from_csv_with_duplicates_within_csv(test_user: User, mock_request):
    """Test importing projects with duplicate IDs within the same CSV."""
    # Arrange

    csv_content = b"project_id,name\ncsv_004,First Entry\ncsv_004,Duplicate Entry\ncsv_005,Unique Entry"
    mock_file = UploadFile(filename="projects.csv", file=BytesIO(csv_content))

    # Act
    response = await import_projects_from_csv(request=mock_request, file=mock_file, user=test_user)

    # Assert
    assert response.data is not None
    assert "Imported 2 projects" in response.data
    assert "Successfully imported 2 projects" in response.message
    assert "Skipped 1" in response.message

    # Verify only first occurrence of duplicate was inserted
    project = await Project.find_one(Project.project_id == "csv_004")
    assert project is not None
    assert project.name == "First Entry"

    # Cleanup
    await Project.find({"project_id": {"$in": ["csv_004", "csv_005"]}}).delete()


@pytest.mark.asyncio
async def test_import_projects_from_csv_empty_file(test_user: User, mock_request):
    """Test importing from empty CSV file."""
    # Arrange

    csv_content = b"project_id,name\n"
    mock_file = UploadFile(filename="projects.csv", file=BytesIO(csv_content))

    # Act
    response = await import_projects_from_csv(request=mock_request, file=mock_file, user=test_user)

    # Assert
    assert response.message == "No projects found in the CSV file."
    assert response.data == "Imported 0 projects."


@pytest.mark.asyncio
async def test_delete_project_by_id_success(test_user: User, test_project: Project, mock_request):
    """Test successfully deleting a project by ID."""
    # Arrange

    project_id = "test_project_001"

    # Verify project exists before deletion
    existing = await Project.find_one(Project.project_id == project_id)
    assert existing is not None

    # Act
    response = await delete_project_by_id(request=mock_request, project_id=project_id)

    # Assert
    assert response.message == f"Project with ID {project_id} deleted successfully"
    assert response.data is True

    # Verify project was deleted
    deleted_project = await Project.find_one(Project.project_id == project_id)
    assert deleted_project is None


@pytest.mark.asyncio
async def test_delete_project_by_id_not_found(mock_request):
    """Test deleting a non-existent project."""
    # Arrange

    project_id = "non_existent_project"

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_project_by_id(request=mock_request, project_id=project_id)

    assert f"Project with ID {project_id} not found" in str(exc_info.value)
