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
from veaiops.handler.routers.apis.v1.system_config.customer import (
    delete_customer_by_id,
    get_all_customers,
    import_customers_from_csv,
)
from veaiops.schema.documents import Customer


@pytest_asyncio.fixture
async def test_customer():
    """Fixture to create and clean up a test customer."""
    customer = Customer(
        customer_id="test_customer_001",
        name="Test Customer",
        desensitized_name="Test ***",
    )
    await customer.insert()
    yield customer
    # Cleanup
    existing_customer = await Customer.find_one(Customer.customer_id == "test_customer_001")
    if existing_customer:
        await existing_customer.delete()


@pytest_asyncio.fixture
async def test_customers():
    """Fixture to create multiple test customers."""
    customers = [
        Customer(
            customer_id=f"test_customer_{i:03d}",
            name=f"Test Customer {i}",
            desensitized_name=f"Test *** {i}",
        )
        for i in range(1, 6)
    ]
    await Customer.insert_many(customers)
    yield customers
    # Cleanup
    customer_ids = [f"test_customer_{i:03d}" for i in range(1, 6)]
    await Customer.find({"customer_id": {"$in": customer_ids}}).delete()


@pytest.mark.asyncio
async def test_get_all_customers_without_filters(mock_request, test_customers):
    """Test getting all customers without filters."""
    # Arrange

    # Act
    response = await get_all_customers(request=mock_request)

    # Assert
    assert response.message == "Customers retrieved successfully"
    assert response.data is not None
    assert len(response.data) >= 5
    assert response.total >= 5
    assert response.skip == 0
    assert response.limit == 100


@pytest.mark.asyncio
async def test_get_all_customers_with_pagination(mock_request, test_customers):
    """Test getting customers with pagination."""
    # Arrange

    # Act
    response = await get_all_customers(request=mock_request, skip=2, limit=2)

    # Assert
    assert response.message == "Customers retrieved successfully"
    assert response.data is not None
    assert len(response.data) == 2
    assert response.skip == 2
    assert response.limit == 2
    assert response.total >= 5


@pytest.mark.asyncio
async def test_get_all_customers_with_name_filter(mock_request, test_customers):
    """Test getting customers with name filter."""
    # Arrange

    # Act
    response = await get_all_customers(request=mock_request, name="Customer 3")

    # Assert
    assert response.message == "Customers retrieved successfully"
    assert response.data is not None
    assert len(response.data) == 1
    assert response.data[0].customer_id == "test_customer_003"
    assert response.total == 1


@pytest.mark.asyncio
async def test_import_customers_from_csv_new_customers(mock_request):
    """Test importing new customers from CSV."""
    # Arrange
    csv_content = b"customer_id,name,desensitized_name\ncsv_001,CSV Customer 1,CSV ***\ncsv_002,CSV Customer 2,CSV ***"
    mock_file = UploadFile(filename="customers.csv", file=BytesIO(csv_content))

    # Act
    response = await import_customers_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 2 customers" in response.message
    assert "skipped 0 records" in response.message

    # Verify customers were inserted
    customer1 = await Customer.find_one(Customer.customer_id == "csv_001")
    customer2 = await Customer.find_one(Customer.customer_id == "csv_002")
    assert customer1 is not None
    assert customer1.name == "CSV Customer 1"
    assert customer2 is not None
    assert customer2.name == "CSV Customer 2"

    # Cleanup
    await Customer.find({"customer_id": {"$in": ["csv_001", "csv_002"]}}).delete()


@pytest.mark.asyncio
async def test_import_customers_from_csv_with_duplicates(test_customer: Customer, mock_request):
    """Test importing customers with duplicate IDs."""
    # Arrange
    # Use the existing test_customer's ID in CSV to simulate duplicate
    csv_content = (
        b"customer_id,name,desensitized_name\n"
        b"test_customer_001,Duplicate Customer,Dup ***\n"
        b"csv_003,New Customer,New ***"
    )
    mock_file = UploadFile(filename="customers.csv", file=BytesIO(csv_content))

    # Act
    response = await import_customers_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 1 customers" in response.message
    assert "skipped 1 records" in response.message

    # Verify only new customer was inserted
    customer = await Customer.find_one(Customer.customer_id == "csv_003")
    assert customer is not None
    assert customer.name == "New Customer"

    # Verify existing customer was not modified
    existing = await Customer.find_one(Customer.customer_id == "test_customer_001")
    assert existing is not None
    assert existing.name == "Test Customer"

    # Cleanup
    csv_customer = await Customer.find_one(Customer.customer_id == "csv_003")
    if csv_customer:
        await csv_customer.delete()


@pytest.mark.asyncio
async def test_import_customers_from_csv_with_invalid_rows(mock_request):
    """Test importing customers with invalid rows (missing required fields)."""
    # Arrange
    csv_content = (
        b"customer_id,name,desensitized_name\n"
        b"csv_004,Valid Customer,Valid ***\n"
        b",Missing ID,Missing ***\n"
        b"csv_005,,Missing Name"
    )
    mock_file = UploadFile(filename="customers.csv", file=BytesIO(csv_content))

    # Act
    response = await import_customers_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 1 customers" in response.message
    assert "skipped 2 records" in response.message

    # Verify only valid customer was inserted
    customer = await Customer.find_one(Customer.customer_id == "csv_004")
    assert customer is not None
    assert customer.name == "Valid Customer"

    # Verify invalid customers were not inserted
    invalid_customers = await Customer.find({"customer_id": {"$in": ["", "csv_005"]}}).to_list()
    assert len(invalid_customers) == 0

    # Cleanup
    await Customer.find_one(Customer.customer_id == "csv_004").delete()


@pytest.mark.asyncio
async def test_import_customers_from_csv_with_duplicates_within_csv(mock_request):
    """Test importing customers with duplicate IDs within the same CSV."""
    # Arrange
    csv_content = (
        b"customer_id,name,desensitized_name\n"
        b"csv_006,First Entry,First ***\n"
        b"csv_006,Duplicate Entry,Dup ***\n"
        b"csv_007,Unique Entry,Unique ***"
    )
    mock_file = UploadFile(filename="customers.csv", file=BytesIO(csv_content))

    # Act
    response = await import_customers_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 2 customers" in response.message
    assert "skipped 1 records" in response.message

    # Verify only first occurrence of duplicate was inserted
    customer = await Customer.find_one(Customer.customer_id == "csv_006")
    assert customer is not None
    assert customer.name == "First Entry"

    # Cleanup
    await Customer.find({"customer_id": {"$in": ["csv_006", "csv_007"]}}).delete()


@pytest.mark.asyncio
async def test_import_customers_from_csv_with_optional_desensitized_name(mock_request):
    """Test importing customers with missing optional desensitized_name field."""
    # Arrange
    csv_content = b"customer_id,name,desensitized_name\ncsv_008,Customer Without Desensitized,"
    mock_file = UploadFile(filename="customers.csv", file=BytesIO(csv_content))

    # Act
    response = await import_customers_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 1 customers" in response.message

    # Verify customer was inserted with empty desensitized_name
    customer = await Customer.find_one(Customer.customer_id == "csv_008")
    assert customer is not None
    assert customer.name == "Customer Without Desensitized"
    assert customer.desensitized_name == ""

    # Cleanup
    await Customer.find_one(Customer.customer_id == "csv_008").delete()


@pytest.mark.asyncio
async def test_import_customers_from_csv_empty_file(mock_request):
    """Test importing from empty CSV file."""
    # Arrange
    csv_content = b"customer_id,name,desensitized_name\n"
    mock_file = UploadFile(filename="customers.csv", file=BytesIO(csv_content))

    # Act
    response = await import_customers_from_csv(request=mock_request, file=mock_file)

    # Assert
    assert response.data is True
    assert "Successfully imported 0 customers" in response.message
    assert "skipped 0 records" in response.message


@pytest.mark.asyncio
async def test_delete_customer_by_id_success(test_customer: Customer, mock_request):
    """Test successfully deleting a customer by ID."""
    # Arrange
    customer_id = "test_customer_001"

    # Verify customer exists before deletion
    existing = await Customer.find_one(Customer.customer_id == customer_id)
    assert existing is not None

    # Act
    response = await delete_customer_by_id(request=mock_request, customer_id=customer_id)

    # Assert
    assert response.message == f"Customer with ID {customer_id} deleted successfully"
    assert response.data is True

    # Verify customer was deleted
    deleted_customer = await Customer.find_one(Customer.customer_id == customer_id)
    assert deleted_customer is None


@pytest.mark.asyncio
async def test_delete_customer_by_id_not_found(mock_request):
    """Test deleting a non-existent customer."""
    # Arrange
    customer_id = "non_existent_customer"

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_customer_by_id(request=mock_request, customer_id=customer_id)

    assert f"Customer with ID {customer_id} not found" in str(exc_info.value)
