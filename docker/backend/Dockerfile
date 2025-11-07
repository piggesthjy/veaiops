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

# ==============================================================================
# Stage 1: Builder
#
# This stage generates the requirements.txt file from project.toml
# ==============================================================================
FROM python:3.12 AS requirements-stage

# Set the working directory
WORKDIR /app

# Install uv, a fast Python package installer and resolver
RUN pip install uv

# Copy dependency definition files
COPY pyproject.toml uv.lock /app/

# Generate the requirements.txt file
RUN uv export --no-hashes --format requirements-txt --output-file requirements.txt

# ==============================================================================
# Stage 2: Runner
#
# This stage creates the final, lightweight production image. It copies the
# requirements.txt from the requirements stage and the application code.
# ==============================================================================
FROM python:3.12

# Set the working directory
WORKDIR /app

# Copy the requirements.txt from the requirements stage
COPY --from=requirements-stage /app/requirements.txt /app/requirements.txt

# Install the dependencies from the requirements.txt file
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copy the application source code
COPY ./veaiops/ /app/veaiops

# Define the command to run the application
# This starts the Uvicorn server, pointing to the FastAPI application instance.
CMD ["uvicorn", "veaiops.cmd.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
