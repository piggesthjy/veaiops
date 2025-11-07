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
from fastapi import APIRouter, Request, UploadFile

from veaiops.handler.errors import RecordNotFoundError
from veaiops.schema.documents import Customer
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse

customer_router = APIRouter(prefix="/customers", tags=["Customers"])


@customer_router.get("/", response_model=PaginatedAPIResponse[List[Customer]])
async def get_all_customers(
    request: Request, skip: int = 0, limit: int = 100, name: Optional[str] = None
) -> PaginatedAPIResponse[List[Customer]]:
    """Get all customers with optional skip, limit and name fuzzy matching.

    Args:
        request (Request): FastAPI request object.
        skip (int): Number of customers to skip (default: 0).
        limit (int): Maximum number of customers to return (default: 100).
        name (Optional[str]): Optional name filter for fuzzy matching.

    Returns:
        PaginatedResponse[List[Customer]]: API response containing list of customers with pagination info.
    """
    # Build query based on provided parameters
    if name:
        query = Customer.find({"name": {"$regex": name, "$options": "i"}})
    else:
        query = Customer.find_all()

    # Calculate total count
    total = await query.count()

    # Apply skip and limit
    customers = await query.skip(skip).limit(limit).to_list()

    return PaginatedAPIResponse(
        message="Customers retrieved successfully",
        data=customers,
        limit=limit,
        skip=skip,
        total=total,
    )


@customer_router.post("/import", response_model=APIResponse[bool])
async def import_customers_from_csv(request: Request, file: UploadFile) -> APIResponse[bool]:
    """Import customers from CSV file.

    Args:
        request (Request): FastAPI request object.
        file (UploadFile): CSV file containing customer data.

    Returns:
        APIResponse[bool]: API response indicating success or failure of import.
    """
    content = await file.read()
    csv_content = content.decode("utf-8")
    csv_reader = list(csv.DictReader(StringIO(csv_content)))

    customer_ids_from_csv = {row.get("customer_id") for row in csv_reader if row.get("customer_id")}

    existing_customers = await Customer.find(In(Customer.customer_id, list(customer_ids_from_csv))).to_list()
    existing_customer_ids = {c.customer_id for c in existing_customers}

    customers_to_insert = []
    skipped_count = 0
    seen_in_csv = set()

    for row in csv_reader:
        customer_id = row.get("customer_id")
        name = row.get("name")

        if not customer_id or not name:
            skipped_count += 1
            continue

        if customer_id not in existing_customer_ids and customer_id not in seen_in_csv:
            customers_to_insert.append(
                Customer(
                    customer_id=customer_id,
                    name=name,
                    desensitized_name=row.get("desensitized_name", ""),
                )
            )
            seen_in_csv.add(customer_id)
        else:
            skipped_count += 1

    if customers_to_insert:
        await Customer.insert_many(customers_to_insert)

    return APIResponse(
        message=f"Successfully imported {len(customers_to_insert)} customers, skipped {skipped_count} records.",
        data=True,
    )


@customer_router.delete("/{customer_id}", response_model=APIResponse[bool])
async def delete_customer_by_id(request: Request, customer_id: str) -> APIResponse[bool]:
    """Delete a customer by ID.

    Args:
        request (Request): FastAPI request object.
        customer_id (str): The ID of the customer to delete.

    Returns:
        APIResponse[bool]: API response indicating success or failure of deletion.
    """
    # Find the customer by ID
    customer = await Customer.find_one(Customer.customer_id == customer_id)

    if not customer:
        raise RecordNotFoundError(message=f"Customer with ID {customer_id} not found")

    # Delete the customer
    await customer.delete()

    return APIResponse(
        message=f"Customer with ID {customer_id} deleted successfully",
        data=True,
    )
