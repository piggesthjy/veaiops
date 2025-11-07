// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * 产品选择步骤组件
 * @description 用于选择火山引擎产品
 * @author AI Assistant
 * @date 2025-01-16
 */

import { Alert, Empty, Input, Radio, Typography } from '@arco-design/web-react';
import { IconSearch, IconThunderbolt } from '@arco-design/web-react/icon';
import { logger } from '@veaiops/utils';
import React, { useEffect, useMemo } from 'react';
import { SelectableItem } from '../../../components/selectable-item';
import styles from '../../../datasource-wizard.module.less';
import type { VolcengineProduct } from '../../../types';

const { Text } = Typography;

export interface ProductSelectionStepProps {
  products: VolcengineProduct[];
  selectedProduct: VolcengineProduct | null;
  loading: boolean;
  onProductsFetch: () => void;
  onProductSelect: (product: VolcengineProduct | null) => void;
}

export const ProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  products,
  selectedProduct,
  loading,
  onProductsFetch,
  onProductSelect,
}) => {
  const [searchText, setSearchText] = React.useState('');

  // 组件挂载时获取产品列表
  useEffect(() => {
    if (products.length === 0 && !loading) {
      onProductsFetch();
    }
  }, [products.length, loading, onProductsFetch]);

  // 首次加载时，如果没有选中项且有可用产品，自动选中第一个
  // 注意：只有在没有搜索文本时才自动选中，避免搜索时触发自动选中导致循环
  useEffect(() => {
    const hasNoSearch = !searchText.trim();
    if (!selectedProduct && products.length > 0 && !loading && hasNoSearch) {
      logger.info({
        message: '首次加载，自动选中第一个产品',
        data: {
          product: products[0],
          totalCount: products.length,
          searchText: searchText || undefined,
        },
        source: 'ProductSelectionStep',
        component: 'useEffect-auto-select-first',
      });
      onProductSelect(products[0]);
    }
  }, [products.length, loading, selectedProduct, searchText, onProductSelect]);

  // 过滤产品（前端过滤）
  const filteredProducts = useMemo(() => {
    const trimmedSearch = (searchText || '').trim();
    if (!trimmedSearch) {
      return products;
    }

    const searchLower = trimmedSearch.toLowerCase();
    return products.filter(
      (product) =>
        product.description.toLowerCase().includes(searchLower) ||
        product.namespace.toLowerCase().includes(searchLower),
    );
  }, [products, searchText]);

  // 验证选中项的有效性：如果有搜索输入，且选中的项不在搜索结果中，清空选中状态
  useEffect(() => {
    if (!selectedProduct || loading) {
      return;
    }

    const trimmedSearch = (searchText || '').trim();
    // 只有在有搜索文本时才验证，避免无搜索时误清空
    if (!trimmedSearch) {
      return;
    }

    const searchLower = trimmedSearch.toLowerCase();
    const isSelectedInFiltered =
      filteredProducts.some((p) => p.namespace === selectedProduct.namespace) &&
      (selectedProduct.description.toLowerCase().includes(searchLower) ||
        selectedProduct.namespace.toLowerCase().includes(searchLower));

    if (!isSelectedInFiltered) {
      logger.info({
        message: '搜索时选中项不匹配搜索条件，清空选中状态',
        data: {
          searchText: trimmedSearch,
          selectedProduct: selectedProduct.description,
          selectedNamespace: selectedProduct.namespace,
          filteredCount: filteredProducts.length,
        },
        source: 'ProductSelectionStep',
        component: 'useEffect-validate-selection',
      });

      // setSelectedProduct 支持 null，可以直接清空
      onProductSelect(null);
    }
  }, [selectedProduct, filteredProducts, searchText, loading, onProductSelect]);

  // 将已选中的项放到第一位，方便编辑时快速查看
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aSelected = selectedProduct?.namespace === a.namespace;
    const bSelected = selectedProduct?.namespace === b.namespace;
    if (aSelected && !bSelected) {
      return -1;
    }
    if (!aSelected && bSelected) {
      return 1;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>选择产品</div>
        <div className={styles.stepDescription}>
          正在获取火山引擎可用产品...
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.stepContent}>
        <div className={styles.stepTitle}>选择产品</div>
        <div className={styles.stepDescription}>选择要监控的火山引擎产品</div>

        <Empty icon={<IconThunderbolt />} description="暂无可用的产品" />
      </div>
    );
  }

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>选择产品</div>
      <div className={styles.stepDescription}>
        选择要监控的火山引擎产品，产品定义了监控的服务类型
      </div>

      {/* 搜索框 */}
      <div className={styles.searchContainer}>
        <Input
          prefix={<IconSearch />}
          placeholder="搜索产品名称或命名空间..."
          value={searchText}
          onChange={setSearchText}
          allowClear
        />
      </div>

      <div className={styles.selectionList}>
        <Radio.Group
          className="w-full"
          value={selectedProduct?.namespace}
          onChange={(value) => {
            const product = products.find((p) => p.namespace === value);
            if (product) {
              onProductSelect(product);
            }
          }}
        >
          {sortedProducts.map((product) => (
            <SelectableItem
              key={product.namespace}
              selected={selectedProduct?.namespace === product.namespace}
              radioValue={product.namespace}
              onClick={() => onProductSelect(product)}
              icon={<IconThunderbolt />}
              title={product.description}
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  命名空间: {product.namespace}
                </Text>
              }
            />
          ))}
        </Radio.Group>
      </div>

      {sortedProducts.length === 0 && searchText && (
        <Empty
          icon={<IconSearch />}
          description={`未找到包含 "${searchText}" 的产品`}
        />
      )}

      {selectedProduct && (
        <Alert
          className={'mt-2'}
          type="success"
          content={`已选择产品: ${selectedProduct.description}`}
          showIcon
          closable={false}
        />
      )}
    </div>
  );
};

export default ProductSelectionStep;
