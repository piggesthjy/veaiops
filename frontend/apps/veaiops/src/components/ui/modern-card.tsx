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

import { Button } from '@arco-design/web-react';
import type React from 'react';

export interface ModernCardProps {
  /** 卡片标题 */
  title: string;
  /** 卡片描述 */
  description?: string;
  /** 背景图片路径 */
  backgroundImage?: string;
  /** 背景渐变颜色 */
  backgroundGradient?: string;
  /** 卡片高度 */
  height?: number;
  /** 统计数据 */
  statistics?: Array<{
    label: string;
    value: number | string;
    color?: string;
    icon?: React.ReactNode;
  }>;
  /** 按钮文本 */
  buttonText?: string;
  /** 按钮点击事件 */
  onButtonClick?: () => void;
  /** 卡片点击事件 */
  onClick?: () => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 现代化卡片组件
 * @description 提供统一的卡片样式，支持背景图片、渐变、统计数据和交互
 */
export const ModernCard: React.FC<ModernCardProps> = ({
  title,
  description,
  backgroundImage,
  backgroundGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  height = 300,
  statistics = [],
  buttonText = '立即体验',
  onButtonClick,
  onClick,
  style,
  className,
}) => {
  const handleCardClick = () => {
    onClick?.();
  };

  const handleButtonClick = (e: Event) => {
    e.stopPropagation();
    onButtonClick?.();
  };

  return (
    <div
      className={className}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #eaedf1',
        overflow: 'hidden',
        height: `${height}px`,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        ...style,
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* 顶部背景区域 */}
      <div
        style={{
          height: '120px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: backgroundImage
            ? `url(${backgroundImage}) center/cover no-repeat`
            : backgroundGradient,
        }}
      >
        {/* 背景图片遮罩 */}
        {backgroundImage && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
            }}
          />
        )}

        {/* 装饰性圆点图案 */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '60px',
            height: '60px',
            background:
              'radial-gradient(circle, rgba(255,255,255,0.3) 2px, transparent 2px)',
            backgroundSize: '12px 12px',
            opacity: 0.6,
          }}
        />

        {/* 标题区域 */}
        <div
          style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: '600',
            textAlign: 'center',
            zIndex: 1,
            textShadow: backgroundImage
              ? '0 2px 4px rgba(0, 0, 0, 0.5)'
              : 'none',
          }}
        >
          {title}
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '24px' }}>
        {/* 描述文字 */}
        {description && (
          <div
            style={{
              fontSize: '14px',
              color: '#737a87',
              lineHeight: '1.5',
              marginBottom: '20px',
              height: '42px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </div>
        )}

        {/* 统计数字区域 */}
        {statistics.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent:
                statistics.length === 1 ? 'center' : 'space-between',
              marginBottom: '20px',
              flexWrap: statistics.length > 2 ? 'wrap' : 'nowrap',
              gap: statistics.length > 2 ? '16px' : '0',
            }}
          >
            {statistics.map((stat, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  flex: (() => {
                    if (statistics.length === 1) {
                      return 'none';
                    }
                    if (statistics.length <= 2) {
                      return 1;
                    }
                    return '0 0 calc(50% - 8px)';
                  })(),
                  minWidth: statistics.length > 2 ? '120px' : 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: statistics.length > 2 ? '24px' : '28px',
                    fontWeight: 'bold',
                    color: stat.color || '#1890ff',
                    marginBottom: '4px',
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: statistics.length > 2 ? '11px' : '12px',
                    color: '#737a87',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1.3',
                  }}
                >
                  {stat.icon && (
                    <span
                      style={{
                        marginRight: '4px',
                        fontSize: statistics.length > 2 ? '10px' : '12px',
                      }}
                    >
                      {stat.icon}
                    </span>
                  )}
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部按钮 */}
        {(buttonText || onButtonClick) && (
          <Button
            type="text"
            onClick={handleButtonClick}
            style={{
              width: '100%',
              height: '36px',
              border: '1px solid #eaedf1',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1664ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModernCard;
