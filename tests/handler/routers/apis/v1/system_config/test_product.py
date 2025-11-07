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
from veaiops.handler.routers.apis.v1.system_config.product import (
    delete_product_by_id,
    get_all_products,
    import_products_from_csv,
)
from veaiops.schema.documents import Product


@pytest_asyncio.fixture
async def test_product():
    """Fixture to create and clean up a test product."""
    product = Product(
        product_id="test_product_001",
        name="Test Product",
    )
    await product.insert()
    yield product
    # Cleanup
    existing_product = await Product.find_one(Product.product_id == "test_product_001")
    if existing_product:
        await existing_product.delete()


@pytest_asyncio.fixture
async def test_products():
    """Fixture to create multiple test products."""
    products = [
        Product(
            product_id=f"test_product_{i:03d}",
            name=f"Test Product {i}",
        )
        for i in range(1, 6)
    ]
    await Product.insert_many(products)
    yield products
    # Cleanup
    product_ids = [f"test_product_{i:03d}" for i in range(1, 6)]
    await Product.find({"product_id": {"$in": product_ids}}).delete()


@pytest.mark.asyncio
async def test_get_all_products_without_filters(mock_request, test_products):
    """Test getting all products without filters."""
    # Arrange

    # Act
    response = await get_all_products(request=mock_request)

    # Assert
    assert response.message == "Products retrieved successfully"
    assert response.data is not None
    assert len(response.data) >= 5
    assert response.total >= 5
    assert response.skip == 0
    assert response.limit == 100


@pytest.mark.asyncio
async def test_get_all_products_with_pagination(mock_request, test_products):
    """Test getting products with pagination."""
    # Arrange

    # Act
    response = await get_all_products(request=mock_request, skip=2, limit=2)

    # Assert
    assert response.message == "Products retrieved successfully"
    assert response.data is not None
    assert len(response.data) == 2
    assert response.skip == 2
    assert response.limit == 2
    assert response.total >= 5


@pytest.mark.asyncio
async def test_get_all_products_with_name_filter(mock_request, test_products):
    """Test getting products with name filter."""
    # Arrange

    # Act
    response = await get_all_products(request=mock_request, name="Product 3")

    # Assert
    assert response.message == "Products retrieved successfully"
    assert response.data is not None
    assert len(response.data) == 1
    assert response.data[0].product_id == "test_product_003"
    assert response.total == 1


@pytest.mark.asyncio
async def test_import_products_from_csv_new_products(mock_request):
    """Test importing new products from CSV."""
    # Arrange
    csv_content = b"product_id,name\ncsv_001,CSV Product 1\ncsv_002,CSV Product 2"
    mock_file = UploadFile(filename="products.csv", file=BytesIO(csv_content))

    # Act
    response = await import_products_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 2 products" in response.message
    assert "skipped 0 records" in response.message

    # Verify products were inserted
    product1 = await Product.find_one(Product.product_id == "csv_001")
    product2 = await Product.find_one(Product.product_id == "csv_002")
    assert product1 is not None
    assert product1.name == "CSV Product 1"
    assert product2 is not None
    assert product2.name == "CSV Product 2"

    # Cleanup
    await Product.find({"product_id": {"$in": ["csv_001", "csv_002"]}}).delete()


@pytest.mark.asyncio
async def test_import_products_from_csv_with_duplicates(test_product: Product, mock_request):
    """Test importing products with duplicate IDs."""
    # Arrange
    csv_content = b"product_id,name\ntest_product_001,Duplicate Product\ncsv_003,New Product"
    mock_file = UploadFile(filename="products.csv", file=BytesIO(csv_content))

    # Act
    response = await import_products_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 1 products" in response.message
    assert "skipped 1 records" in response.message

    # Verify only new product was inserted
    product = await Product.find_one(Product.product_id == "csv_003")
    assert product is not None
    assert product.name == "New Product"

    # Verify existing product was not modified
    existing = await Product.find_one(Product.product_id == "test_product_001")
    assert existing is not None
    assert existing.name == "Test Product"

    # Cleanup
    csv_product = await Product.find_one(Product.product_id == "csv_003")
    if csv_product:
        await csv_product.delete()


@pytest.mark.asyncio
async def test_import_products_from_csv_with_invalid_rows(mock_request):
    """Test importing products with invalid rows (missing required fields)."""
    # Arrange
    csv_content = b"product_id,name\ncsv_004,Valid Product\n,Missing ID\ncsv_005,"
    mock_file = UploadFile(filename="products.csv", file=BytesIO(csv_content))

    # Act
    response = await import_products_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 1 products" in response.message
    assert "skipped 2 records" in response.message

    # Verify only valid product was inserted
    product = await Product.find_one(Product.product_id == "csv_004")
    assert product is not None
    assert product.name == "Valid Product"

    # Verify invalid products were not inserted
    invalid_products = await Product.find({"product_id": {"$in": ["", "csv_005"]}}).to_list()
    assert len(invalid_products) == 0

    # Cleanup
    await Product.find_one(Product.product_id == "csv_004").delete()


@pytest.mark.asyncio
async def test_import_products_from_csv_with_duplicates_within_csv(mock_request):
    """Test importing products with duplicate IDs within the same CSV."""
    # Arrange
    csv_content = b"product_id,name\ncsv_006,First Entry\ncsv_006,Duplicate Entry\ncsv_007,Unique Entry"
    mock_file = UploadFile(filename="products.csv", file=BytesIO(csv_content))

    # Act
    response = await import_products_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 2 products" in response.message
    assert "skipped 1 records" in response.message

    # Verify only first occurrence of duplicate was inserted
    product = await Product.find_one(Product.product_id == "csv_006")
    assert product is not None
    assert product.name == "First Entry"

    # Cleanup
    await Product.find({"product_id": {"$in": ["csv_006", "csv_007"]}}).delete()


@pytest.mark.asyncio
async def test_import_products_from_csv_empty_file(mock_request):
    """Test importing from empty CSV file."""
    # Arrange
    csv_content = b"product_id,name\n"
    mock_file = UploadFile(filename="products.csv", file=BytesIO(csv_content))

    # Act
    response = await import_products_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 0 products" in response.message
    assert "skipped 0 records" in response.message


@pytest.mark.asyncio
async def test_delete_product_by_id_success(test_product: Product, mock_request):
    """Test successfully deleting a product by ID."""
    # Arrange
    product_id = "test_product_001"

    # Verify product exists before deletion
    existing = await Product.find_one(Product.product_id == product_id)
    assert existing is not None

    # Act
    response = await delete_product_by_id(request=mock_request, product_id=product_id)

    # Assert
    assert response.message == f"Product with ID {product_id} deleted successfully"
    assert response.data is True

    # Verify product was deleted
    deleted_product = await Product.find_one(Product.product_id == product_id)
    assert deleted_product is None


@pytest.mark.asyncio
async def test_delete_product_by_id_not_found(mock_request):
    """Test deleting a non-existent product."""
    # Arrange
    product_id = "non_existent_product"

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_product_by_id(request=mock_request, product_id=product_id)

    assert f"Product with ID {product_id} not found" in str(exc_info.value)
