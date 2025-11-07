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
 * 数据源品牌配置
 * @description 定义各数据源类型的品牌颜色和样式类
 */

import { DataSourceType } from '../../types';
import styles from './styles.module.less';

/** 品牌配置接口 */
export interface BrandConfig {
  /** 主容器样式类 */
  className: string;
  /** 渐变背景样式类 */
  gradientClass: string;
  /** 图标样式类 */
  iconClass: string;
  /** 品牌主色 */
  brandColor: string;
}

/** 数据源品牌配置映射 */
export const DATASOURCE_BRAND_CONFIGS: Record<DataSourceType, BrandConfig> = {
  [DataSourceType.VOLCENGINE]: {
    className: styles.volcengine,
    gradientClass: styles.volcengineGradient,
    iconClass: styles.volcengineIcon,
    // 火山引擎品牌色：蓝色科技感
    brandColor: '#1664FF',
  },
  [DataSourceType.ALIYUN]: {
    className: styles.aliyun,
    gradientClass: styles.aliyunGradient,
    iconClass: styles.aliyunIcon,
    // 阿里云品牌色：橙色活力感
    brandColor: '#FF6A00',
  },
  [DataSourceType.ZABBIX]: {
    className: styles.zabbix,
    gradientClass: styles.zabbixGradient,
    iconClass: styles.zabbixIcon,
    // Zabbix品牌色：红色专业感
    brandColor: '#D40000',
  },
};

/**
 * 获取数据源品牌配置
 * @param type 数据源类型
 * @returns 品牌配置对象
 */
export const getBrandConfig = (type: DataSourceType): BrandConfig => {
  return DATASOURCE_BRAND_CONFIGS[type];
};
