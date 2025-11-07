# 死循环问题修复验证 (最终版本)

## 问题描述
在监控指标选择步骤中，出现了获取指标的死循环问题，导致大量的网络请求不断发送。

## 根本原因分析
1. **actions 对象重新创建**: 在 `use-datasource-wizard.ts` 中，`actions` 对象在每次渲染时都会重新创建
2. **useEffect 依赖问题**: 在 `metric-selection-step.tsx` 中，`useEffect` 的依赖数组包含了 `actions` 对象
3. **循环触发**: actions 重新创建 → useEffect 触发 → 发起请求 → 状态更新 → 组件重新渲染 → actions 重新创建
4. **缺乏请求去重**: 即使修复了依赖问题，仍可能因为其他原因触发重复请求

## 修复方案 (多层防护)

### 1. 使用 useMemo 缓存 actions 对象
```typescript
// 修复前 (use-datasource-wizard.ts)
const actions: WizardActions = {
  setCurrentStep,
  setDataSourceType,
  // ... 其他方法
};

// 修复后
const actions: WizardActions = useMemo(() => ({
  setCurrentStep,
  setDataSourceType,
  // ... 其他方法
}), [
  setCurrentStep,
  setDataSourceType,
  // ... 所有依赖的函数
]);
```

### 2. 移除 actions 依赖 (最关键修复)
```typescript
// 修复前 (metric-selection-step.tsx)
}, [
  dataSourceType,
  connect?.name,
  selectedTemplate?.templateid,
  zabbixMetrics.length,
  aliyunMetrics.length,
  volcengineMetrics.length,
  loading,
  actions, // 整个 actions 对象 - 导致死循环
]);

// 修复后 - 完全移除 actions 依赖
}, [
  dataSourceType,
  connect?.name,
  selectedTemplate?.templateid,
  zabbixMetrics.length,
  aliyunMetrics.length,
  volcengineMetrics.length,
  loading,
  // 不再依赖 actions 对象
]);
```

### 3. 添加请求去重机制 (防护层)
```typescript
// 使用 useRef 跟踪请求状态
const requestTracker = useRef<{
  zabbix: string | null;
  aliyun: string | null;
  volcengine: boolean;
}>({
  zabbix: null,
  aliyun: null,
  volcengine: false,
});

// 在发起请求前检查是否已经发起过相同请求
if (dataSourceType === 'zabbix' && connect?.name && selectedTemplate?.templateid) {
  const requestKey = `${connect.name}-${selectedTemplate.templateid}`;

  if (requestTracker.current.zabbix !== requestKey) {
    requestTracker.current.zabbix = requestKey;
    actions.fetchZabbixMetrics(connect.name, selectedTemplate.templateid);
  } else {
    console.warn('[MetricSelectionStep] 跳过重复的 Zabbix 请求:', { requestKey });
  }
}
```

### 4. 自动重置请求跟踪器
```typescript
// 当数据源类型或连接改变时，重置请求跟踪器
useEffect(() => {
  requestTracker.current = {
    zabbix: null,
    aliyun: null,
    volcengine: false,
  };
}, [dataSourceType, connect?.name]);
```

## 验证步骤

1. **打开浏览器开发者工具**
   - 切换到 Network 面板
   - 清空现有请求记录

2. **操作数据源向导**
   - 选择 Zabbix 数据源类型
   - 选择一个连接
   - 选择一个模板
   - 进入监控指标选择步骤

3. **观察网络请求**
   - 应该只有一次获取指标的请求
   - 不应该出现重复的请求循环

## 预期结果

- ✅ 网络面板中只显示一次指标获取请求
- ✅ 页面加载正常，无卡顿现象
- ✅ 指标列表正确显示
- ✅ 单选功能正常工作

## 如果问题仍然存在

检查以下几点：

1. **确认 useCallback 依赖**
   ```typescript
   // 确保所有 useCallback 都有正确的依赖数组
   const fetchZabbixMetrics = useCallback(async (connectName: string, templateId: string) => {
     // ...
   }, []); // 空依赖数组，因为函数内部不依赖外部变量
   ```

2. **检查状态更新逻辑**
   ```typescript
   // 避免在请求过程中意外触发新的请求
   if (loading) return; // 添加 loading 检查
   ```

3. **添加调试日志**
   ```typescript
   useEffect(() => {
     console.log('[DEBUG] useEffect triggered:', {
       dataSourceType,
       connectName: connect?.name,
       templateId: selectedTemplate?.templateid,
       metricsLength: zabbixMetrics.length,
       loading
     });
     // ... 请求逻辑
   }, [/* 依赖数组 */]);
   ```

## 性能优化建议

1. **请求去重**: 添加请求去重逻辑，避免相同参数的重复请求
2. **缓存机制**: 对已获取的指标数据进行缓存
3. **防抖处理**: 对用户快速操作进行防抖处理

## 相关文件

- `frontend/apps/veaiops/src/components/datasource-wizard/hooks/use-datasource-wizard.ts`
- `frontend/apps/veaiops/src/components/datasource-wizard/steps/metric-selection-step.tsx`
