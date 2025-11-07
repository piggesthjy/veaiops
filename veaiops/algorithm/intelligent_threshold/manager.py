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

"""Global ThresholdRecommender instance manager.

This module provides a singleton pattern for managing ThresholdRecommender instances
across FastAPI workers to ensure proper resource management and concurrency control.
"""

from typing import Optional

from veaiops.algorithm.intelligent_threshold.threshold_recommender import ThresholdRecommender
from veaiops.utils.log import logger


class ThresholdRecommenderManager:
    """Singleton manager for ThresholdRecommender instances."""

    _instance: Optional["ThresholdRecommenderManager"] = None
    _threshold_recommender: Optional[ThresholdRecommender] = None

    def __new__(cls) -> "ThresholdRecommenderManager":
        """Create or return the singleton instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def get_threshold_recommender(self) -> ThresholdRecommender:
        """Get or create the global ThresholdRecommender instance.

        Returns:
            ThresholdRecommender: The global threshold recommender instance.
        """
        if self._threshold_recommender is None:
            logger.info("Creating global ThresholdRecommender instance")
            self._threshold_recommender = ThresholdRecommender()
        return self._threshold_recommender

    def reset(self) -> None:
        """Reset the global instance (mainly for testing purposes)."""
        logger.debug("Resetting global ThresholdRecommender instance")
        self._threshold_recommender = None


# Global instance
_manager = ThresholdRecommenderManager()


def get_global_threshold_recommender() -> ThresholdRecommender:
    """Get the global ThresholdRecommender instance.

    Returns:
        ThresholdRecommender: The global threshold recommender instance.
    """
    return _manager.get_threshold_recommender()


def reset_global_threshold_recommender() -> None:
    """Reset the global ThresholdRecommender instance (for testing)."""
    _manager.reset()
