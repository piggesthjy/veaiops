# 数据源详情抽屉模块

用于在智能阈值任务配置列表中查看关联数据源的详细信息。

## 📁 文件结构

```
datasource-detail/
├── index.ts                    # 统一导出
├── types.ts                    # TypeScript 类型定义
├── utils.tsx                   # 工具函数（getTypeConfig）
├── drawer.tsx                  # 主抽屉组件
├── header.tsx                  # 顶部卡片（带背景图）
├── basic-info.tsx              # 基础信息卡片
├── connection-config.tsx       # 连接配置卡片
├── volcengine-config.tsx       # 火山引擎配置卡片
├── aliyun-config.tsx           # 阿里云配置卡片
├── zabbix-config.tsx           # Zabbix 配置卡片
└── time-info.tsx               # 时间信息卡片
```

## 🎯 功能特性

- ✅ **美观的 UI 设计**：背景图 + 渐变顶部卡片
- ✅ **多数据源支持**：火山引擎、阿里云、Zabbix
- ✅ **动态配置展示**：根据数据源类型展示对应配置
- ✅ **自动翻译**：数据源类型自动翻译为中文
- ✅ **敏感信息保护**：Access Key 等信息自动遮蔽
- ✅ **代码拆分**：关注点分离，易于维护

## 🔧 使用方式

```typescript
import { DatasourceDetailDrawer } from '@/modules/threshold/features/task-config/ui/components/drawers';

<DatasourceDetailDrawer
  visible={visible}
  datasource={datasource}
  loading={loading}
  onClose={handleClose}
/>
```

## 📦 导入路径

```typescript
// 从 drawers 统一导出
import { DatasourceDetailDrawer } from './components/drawers';

// 或从 components 导出（已配置）
import { DatasourceDetailDrawer } from './components';
```

## 🎨 UI 层次结构

1. **Header**：数据源类型卡片（带背景图）
2. **BasicInfo**：数据源基础信息
3. **ConnectionConfig**：连接配置信息
4. **[Type]Config**：特定类型的配置（动态展示）
   - VolcengineConfig：火山引擎配置 + 实例列表
   - AliyunConfig：阿里云配置 + 维度列表
   - ZabbixConfig：Zabbix 配置 + 目标列表
5. **TimeInfo**：创建/更新时间

## 📝 注意事项

- `utils.tsx` 包含 JSX 语法，必须使用 `.tsx` 扩展名
- 所有配置卡片继承自 `ConfigSectionProps` 接口
- 使用 `DATA_SOURCE_LABELS` 从 `@veaiops/constants` 进行类型翻译
- 使用 `DataSourceType` 枚举值替代字符串字面量（类型安全）
- StampTime 组件内部已有空值判断，无需额外处理

## 🔑 枚举使用规范

```typescript
import { DataSourceType } from '@veaiops/api-client';

// ✅ 正确：使用枚举值
switch (type) {
  case DataSourceType.VOLCENGINE:
  case DataSourceType.ALIYUN:
  case DataSourceType.ZABBIX:
}

// ❌ 错误：使用字符串字面量
switch (type) {
  case 'volcengine':
  case 'aliyun':
  case 'zabbix':
}
```
