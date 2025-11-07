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
from veaiops.schema.documents import Product
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse

product_router = APIRouter(prefix="/products", tags=["Products"])


@product_router.get("/", response_model=PaginatedAPIResponse[List[Product]])
async def get_all_products(
    request: Request, skip: int = 0, limit: int = 100, name: Optional[str] = None
) -> PaginatedAPIResponse[List[Product]]:
    """Get all products with optional skip, limit and name fuzzy matching.

    Args:
        request (Request): FastAPI request object.
        skip (int): Number of products to skip (default: 0).
        limit (int): Maximum number of products to return (default: 100).
        name (Optional[str]): Optional name filter for fuzzy matching.

    Returns:
        PaginatedResponse[List[Product]]: API response containing list of products with pagination info.
    """
    # Build query based on provided parameters
    if name:
        query = Product.find({"name": {"$regex": name, "$options": "i"}})
    else:
        query = Product.find_all()

    # Calculate total count
    total = await query.count()

    # Apply skip and limit
    products = await query.skip(skip).limit(limit).to_list()

    return PaginatedAPIResponse(
        message="Products retrieved successfully",
        data=products,
        limit=limit,
        skip=skip,
        total=total,
    )


@product_router.post("/import", response_model=APIResponse[bool])
async def import_products_from_csv(request: Request, file: UploadFile) -> APIResponse[bool]:
    """Import products from CSV file.

    Args:
        request (Request): FastAPI request object.
        file (UploadFile): CSV file containing product data.

    Returns:
        APIResponse[bool]: API response indicating success or failure of import.
    """
    content = await file.read()
    csv_content = content.decode("utf-8")
    csv_reader = list(csv.DictReader(StringIO(csv_content)))

    product_ids_from_csv = {row.get("product_id") for row in csv_reader if row.get("product_id")}

    existing_products = await Product.find(In(Product.product_id, list(product_ids_from_csv))).to_list()
    existing_product_ids = {p.product_id for p in existing_products}

    products_to_insert = []
    skipped_count = 0
    seen_in_csv = set()

    for row in csv_reader:
        product_id = row.get("product_id")
        name = row.get("name")

        if not product_id or not name:
            skipped_count += 1
            continue

        if product_id not in existing_product_ids and product_id not in seen_in_csv:
            products_to_insert.append(Product(product_id=product_id, name=name))
            seen_in_csv.add(product_id)
        else:
            skipped_count += 1

    if products_to_insert:
        await Product.insert_many(products_to_insert)

    return APIResponse(
        message=f"Successfully imported {len(products_to_insert)} products, skipped {skipped_count} records.",
        data=True,
    )


@product_router.delete("/{product_id}", response_model=APIResponse[bool])
async def delete_product_by_id(request: Request, product_id: str) -> APIResponse[bool]:
    """Delete a product by ID.

    Args:
        request (Request): FastAPI request object.
        product_id (str): The ID of the product to delete.

    Returns:
        APIResponse[bool]: API response indicating success or failure of deletion.
    """
    # Find the product by ID
    product = await Product.find_one(Product.product_id == product_id)

    if not product:
        raise RecordNotFoundError(message=f"Product with ID {product_id} not found")

    # Delete the product
    await product.delete()

    return APIResponse(
        message=f"Product with ID {product_id} deleted successfully",
        data=True,
    )
