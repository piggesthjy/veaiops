# 自动 Scroll.Y 计算功能

## 功能概述

CustomTable 现在支持**自动计算** `scroll.y` 高度，无需手动配置即可启用表头固定和 sticky 功能。

## 核心优势

### 1. **零配置使用**

```tsx
<CustomTable baseColumns={columns} dataSource={dataSource} />
// ✅ 自动启用 sticky header
// ✅ 自动计算合适的 scroll.y
// ✅ 响应式适配视口变化
```

### 2. **智能计算**

使用 CSS `calc()` 表达式，由浏览器原生处理：

```css
/* 默认配置 */
max-height: max(300px, calc(100vh - 350px));

/* 有最大高度限制 */
max-height: clamp(300px, calc(100vh - 350px), 800px);
```

### 3. **完全可配置**

```tsx
<CustomTable
  autoScrollY={{
    enabled: true, // 是否启用，默认 true
    offset: 350, // 偏移量，默认 350px
    minHeight: 300, // 最小高度，默认 300px
    maxHeight: 800, // 最大高度，可选
  }}
/>
```

## 技术实现

### Hook: `useAutoScrollYWithCalc`

```typescript
const autoScrollConfig = useAutoScrollYWithCalc(
  {
    offset: 350,
    enabled: true,
    minHeight: 300,
    maxHeight: undefined,
  },
  userScroll // 用户自定义的 scroll 配置
);
```

### 计算逻辑

1. **优先级顺序**：
   - 用户明确设置的 `scroll.y` > 自动计算
   - 用户设置的 `scroll.x` 被保留

2. **边界处理**：

   ```typescript
   // 只有最小限制
   y: max(300px, calc(100vh - 350px))

   // 只有最大限制
   y: min(calc(100vh - 350px), 800px)

   // 同时有最小和最大
   y: clamp(300px, calc(100vh - 350px), 800px)
   ```

3. **性能优化**：
   - 使用 `useMemo` 缓存计算结果
   - CSS calc() 由浏览器优化，无需 JS 监听

## 配置参数详解

### `autoScrollY.offset`

表格上方所有固定元素的总高度：

```typescript
offset =
  导航栏高度(60) +
  标题高度(48) +
  过滤器高度(60) +
  Alert高度(0 - 48) +
  分页器高度(64) +
  间距(40) +
  额外预留(20 - 40);
```

**默认值**: `350px`
**推荐值**:

- 简单布局：300-350px
- 有导航栏：400-450px
- 复杂布局：450-500px

### `autoScrollY.minHeight`

防止表格在小屏幕上过小，无法正常使用。

**默认值**: `300px`
**推荐值**: 200-400px

### `autoScrollY.maxHeight`

防止表格在大屏幕上过大，浪费空间。

**默认值**: `undefined` (无限制)
**推荐值**: 800-1200px（可选）

## 使用场景

### 场景 1: 标准数据表格（默认）

```tsx
<CustomTable
  baseColumns={columns}
  dataSource={dataSource}
  // 不需要任何配置！
/>
```

### 场景 2: 有固定导航栏的页面

```tsx
<CustomTable
  baseColumns={columns}
  dataSource={dataSource}
  autoScrollY={{
    offset: 400, // 导航栏 60px + 默认 350px
  }}
  stickyConfig={{
    headerTopOffset: 60, // 表头避开导航栏
    filtersTopOffset: 60,
  }}
/>
```

### 场景 3: 移动端适配

```tsx
<CustomTable
  baseColumns={columns}
  dataSource={dataSource}
  autoScrollY={{
    offset: 250, // 移动端减少偏移
    minHeight: 200, // 更小的最小高度
    maxHeight: 600, // 限制最大高度
  }}
/>
```

### 场景 4: 全屏表格

```tsx
<CustomTable
  baseColumns={columns}
  dataSource={dataSource}
  autoScrollY={{
    offset: 150, // 最小偏移
    minHeight: 400,
  }}
/>
```

### 场景 5: 禁用自动计算（手动控制）

```tsx
<CustomTable
  baseColumns={columns}
  dataSource={dataSource}
  autoScrollY={{
    enabled: false,
  }}
  tableProps={{
    scroll: {
      x: 1600,
      y: 500, // 手动指定
    },
  }}
/>
```

## 与 Arco Table 的兼容性

### Arco Table 的 scroll.y 支持的值

| 类型      | 示例                          | 说明                       |
| --------- | ----------------------------- | -------------------------- |
| 数字      | `500`                         | 固定高度（像素）           |
| 字符串    | `'500px'`                     | 固定高度（像素）           |
| CSS calc  | `'calc(100vh - 300px)'`       | 动态计算                   |
| CSS max   | `'max(300px, 50vh)'`          | 取最大值                   |
| CSS min   | `'min(800px, 80vh)'`          | 取最小值                   |
| CSS clamp | `'clamp(300px, 50vh, 800px)'` | 限制范围                   |
| Boolean   | `true`                        | 仅启用固定表头，不限制高度 |

我们的自动计算默认使用 `calc()` + `max()`/`min()`/`clamp()`组合。

## 注意事项

### 1. **偏移量计算技巧**

使用浏览器开发者工具测量：

```javascript
// 在控制台执行
const nav = document.querySelector('.nav-bar')?.offsetHeight || 0;
const title = document.querySelector('.table-title')?.offsetHeight || 0;
const filters = document.querySelector('.table-filters')?.offsetHeight || 0;
const pagination = 64; // 分页器固定高度
const spacing = 40; // 间距

console.log('建议 offset:', nav + title + filters + pagination + spacing);
```

### 2. **响应式布局**

CSS calc() 会自动响应视口变化：

- 无需监听 window.resize
- 无需手动更新状态
- 性能更优

### 3. **向后兼容**

用户手动设置的 `scroll.y` 始终优先：

```tsx
<CustomTable
  tableProps={{
    scroll: { y: 600 }, // 会覆盖自动计算
  }}
/>
```

### 4. **浏览器兼容性**

- `calc()`: ✅ 所有现代浏览器
- `max()`/`min()`: ✅ Chrome 79+, Firefox 75+, Safari 11.1+
- `clamp()`: ✅ Chrome 79+, Firefox 75+, Safari 13.1+

对于旧浏览器，会降级为基础 `calc()` 表达式。

## 调试技巧

### 查看实际计算值

```tsx
import { useAutoScrollYWithCalc } from '@veaiops/components';

const MyComponent = () => {
  const scroll = useAutoScrollYWithCalc({ offset: 350 });

  console.log('计算的 scroll 配置:', scroll);
  // { x: 'max-content', y: 'max(300px, calc(100vh - 350px))' }

  return <CustomTable ... />;
};
```

### 临时禁用查看效果

```tsx
<CustomTable
  autoScrollY={{ enabled: false }}
  stickyConfig={{ enableHeaderSticky: false }}
/>
```

## 最佳实践

### ✅ 推荐做法

```tsx
// 1. 完全依赖默认配置（最简单）
<CustomTable baseColumns={columns} dataSource={dataSource} />

// 2. 只调整偏移量（最常见）
<CustomTable
  baseColumns={columns}
  dataSource={dataSource}
  autoScrollY={{ offset: 400 }}
/>

// 3. 完整配置（复杂场景）
<CustomTable
  baseColumns={columns}
  dataSource={dataSource}
  autoScrollY={{ offset: 400, minHeight: 400, maxHeight: 1000 }}
  stickyConfig={{ headerTopOffset: 60 }}
/>
```

### ❌ 不推荐做法

```tsx
// ❌ 同时设置 autoScrollY 和手动 scroll.y
<CustomTable
  autoScrollY={{ offset: 350 }}
  tableProps={{ scroll: { y: 500 } }} // 会覆盖自动计算
/>

// ✅ 应该选择其一
<CustomTable
  tableProps={{ scroll: { y: 500 } }} // 手动控制
/>
```

## 性能对比

| 方案       | resize 监听 | reflow  | repaint | 推荐场景         |
| ---------- | ----------- | ------- | ------- | ---------------- |
| CSS calc() | ❌ 不需要   | ❌ 最少 | ❌ 最少 | 所有场景（推荐） |
| JS 计算    | ✅ 需要     | ✅ 较多 | ✅ 较多 | 需要复杂逻辑时   |
| 固定值     | ❌ 不需要   | ❌ 无   | ❌ 无   | 已知固定高度时   |

**结论**: CSS calc() 方案性能最优，是默认首选。

## 故障排查

### 问题 1: Sticky 不生效

**原因**: 未启用固定表头模式
**解决**: 确保 `scroll.y` 有值（自动计算应该已设置）

```tsx
// 检查 scroll 配置
<CustomTable
  tableProps={props => {
    console.log('scroll config:', props);
    return { scroll: { x: 'max-content' } };
  }}
/>
```

### 问题 2: 表格高度不合适

**解决**: 调整 offset 参数

```tsx
<CustomTable
  autoScrollY={{ offset: 300 }} // 减小 offset，表格更高
/>
```

### 问题 3: 小屏幕表格太小

**解决**: 调整 minHeight

```tsx
<CustomTable
  autoScrollY={{ minHeight: 400 }} // 提高最小高度
/>
```

---

**更新日期**: 2025-10-29
**功能版本**: 2.0.0 (新增自动 scroll.y 计算)
