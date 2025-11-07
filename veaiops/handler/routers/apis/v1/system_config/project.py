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


import csv
from io import StringIO
from typing import List, Optional

from beanie.operators import In
from fastapi import APIRouter, Depends, Request, UploadFile, status

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.services.user import get_current_user
from veaiops.schema.documents import Project
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse
from veaiops.schema.models.config import CreateProjectPayload

project_router = APIRouter(prefix="/projects", tags=["Projects"])


@project_router.post("/", response_model=APIResponse[Project], status_code=status.HTTP_201_CREATED)
async def create_project(
    request: Request, project_data: CreateProjectPayload, user: User = Depends(get_current_user)
) -> APIResponse[Project]:
    """Create a new project.

    Args:
        request (Request): FastAPI request object.
        project_data (CreateProjectPayload): The data for the new project.
        user (User): The current user.

    Returns:
        APIResponse[Project]: API response containing the created project information.
    """
    # Create a new project instance
    new_project = Project(
        project_id=project_data.project_id,
        name=project_data.name,
        created_user=user.username,
        updated_user=user.username,
    )

    # Check if project already exists
    existing_project = await Project.find_one(Project.project_id == new_project.project_id)
    if existing_project:
        raise RecordNotFoundError(message=f"Project with ID {new_project.project_id} already exists")

    # Save the new project
    await new_project.insert()

    return APIResponse(
        message="Project created successfully",
        data=new_project,
    )


@project_router.get("/", response_model=PaginatedAPIResponse[List[Project]])
async def get_all_projects(
    request: Request, skip: int = 0, limit: int = 100, name: Optional[str] = None
) -> PaginatedAPIResponse[List[Project]]:
    """Get all projects with optional skip, limit and name fuzzy matching.

    Args:
        request (Request): FastAPI request object.
        skip (int): Number of projects to skip (default: 0).
        limit (int): Maximum number of projects to return (default: 100).
        name (Optional[str]): Optional name filter for fuzzy matching.

    Returns:
        PaginatedResponse[List[Project]]: API response containing list of projects with pagination info.
    """
    # Build query based on provided parameters
    if name:
        query = Project.find({"name": {"$regex": name, "$options": "i"}})
    else:
        query = Project.find_all()

    # Calculate total count
    total = await query.count()

    # Apply skip and limit
    projects = await query.skip(skip).limit(limit).to_list()

    return PaginatedAPIResponse(
        message="Projects retrieved successfully",
        data=projects,
        limit=limit,
        skip=skip,
        total=total,
    )


@project_router.post("/import", response_model=APIResponse[str])
async def import_projects_from_csv(
    request: Request, file: UploadFile, user: User = Depends(get_current_user)
) -> APIResponse[str]:
    """Import projects from CSV file.

    Args:
        request (Request): FastAPI request object.
        file (UploadFile): CSV file containing project data.
        user (User): The current user.

    Returns:
        APIResponse[str]: API response containing import result message.
    """
    # Read CSV file content
    content = await file.read()
    csv_content = content.decode("utf-8")
    csv_file = StringIO(csv_content)
    csv_reader = csv.DictReader(csv_file)

    all_rows = list(csv_reader)
    if not all_rows:
        return APIResponse(message="No projects found in the CSV file.", data="Imported 0 projects.")

    project_ids_from_csv = {row["project_id"] for row in all_rows}

    # Find existing projects by ID
    existing_projects = await Project.find(In(Project.project_id, list(project_ids_from_csv))).to_list()
    existing_project_ids = {p.project_id for p in existing_projects}

    # Prepare projects for bulk insert, filtering out duplicates from CSV and DB
    projects_to_insert = []
    seen_in_csv = set()
    for row in all_rows:
        if row["project_id"] not in existing_project_ids and row["project_id"] not in seen_in_csv:
            project = Project(
                project_id=row["project_id"],
                name=row["name"],
                created_user=user.username,
                updated_user=user.username,
            )
            projects_to_insert.append(project)
            seen_in_csv.add(row["project_id"])

    # Bulk insert projects
    if projects_to_insert:
        await Project.insert_many(projects_to_insert)

    imported_count = len(projects_to_insert)
    skipped_count = len(all_rows) - imported_count

    message = (
        f"Successfully imported {imported_count} projects. Skipped {skipped_count} existing or duplicate projects."
    )
    data = f"Imported {imported_count} projects. Skipped {skipped_count}."

    return APIResponse(
        message=message,
        data=data,
    )


@project_router.delete("/{project_id}", response_model=APIResponse[bool])
async def delete_project_by_id(request: Request, project_id: str) -> APIResponse[bool]:
    """Delete a project by ID.

    Args:
        request (Request): FastAPI request object.
        project_id (str): The ID of the project to delete.

    Returns:
        APIResponse[bool]: API response indicating success or failure of deletion.
    """
    # Find the project by ID
    project = await Project.find_one(Project.project_id == project_id)

    if not project:
        raise RecordNotFoundError(message=f"Project with ID {project_id} not found")

    # Delete the project
    await project.delete()

    return APIResponse(
        message=f"Project with ID {project_id} deleted successfully",
        data=True,
    )
