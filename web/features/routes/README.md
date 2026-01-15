# Route Mutations

Các mutation hooks cho route operations với React Query invalidation tự động.

## Hooks có sẵn

### `useCreateRoute()`
Tạo route mới.

```tsx
import { useCreateRoute } from '@/features/routes/hooks/use-route-mutations';

const createRoute = useCreateRoute();

// Sử dụng
createRoute.mutate({ name: "Hà Nội - Sài Gòn" }, {
    onSuccess: () => {
        // Tự động invalidate queries ['routes']
        console.log('Route created!');
    }
});
```

### `useUpdateRoute()`
Cập nhật route.

```tsx
import { useUpdateRoute } from '@/features/routes/hooks/use-route-mutations';

const updateRoute = useUpdateRoute();

// Sử dụng
updateRoute.mutate({ 
    id: "route-id", 
    data: { name: "Hà Nội - Đà Nẵng" } 
});
```

### `useDeleteRoute()`
Xóa route.

```tsx
import { useDeleteRoute } from '@/features/routes/hooks/use-route-mutations';

const deleteRoute = useDeleteRoute();

// Sử dụng
deleteRoute.mutate("route-id");
```

### `useUpdateRouteStatus()`
Cập nhật trạng thái route.

```tsx
import { useUpdateRouteStatus } from '@/features/routes/hooks/use-route-mutations';

const updateStatus = useUpdateRouteStatus();

// Sử dụng
updateStatus.mutate({ 
    id: "route-id", 
    status: "active" 
});
```

### `useReorderStations()`
Sắp xếp lại thứ tự các trạm trong route.

```tsx
import { useReorderStations } from '@/features/routes/hooks/use-route-mutations';

const reorderStations = useReorderStations();

// Sử dụng
reorderStations.mutate({ 
    routeId: "route-id",
    stations: [
        { stationId: "station-1", distanceFromStart: 0 },
        { stationId: "station-2", distanceFromStart: 10.5 },
        { stationId: "station-3", distanceFromStart: 25.3 }
    ]
});
```

## Invalidation Strategy

Tất cả mutation hooks đều tự động invalidate queries với key `['routes']`.

**Cách hoạt động với pagination:**

```tsx
// Query key structure:
['routes', { page: 1, limit: 10, search: "...", sort: "...", order: "..." }]

// Khi invalidate với { queryKey: ['routes'] }:
// → Invalidate TẤT CẢ queries bắt đầu với 'routes'
// → Bao gồm tất cả các trang, filters, sorting
```

**Ví dụ:**

```tsx
// Có 3 queries đang active:
['routes', { page: 1, limit: 10 }]
['routes', { page: 2, limit: 10 }]
['routes', { page: 1, limit: 10, search: "Hà Nội" }]

// Sau khi createRoute.mutate():
// → Cả 3 queries đều được invalidate và refetch
// → Đảm bảo data luôn đồng bộ
```

## Loading States

Sử dụng `isPending` để hiển thị loading state:

```tsx
const createRoute = useCreateRoute();

<Button disabled={createRoute.isPending}>
    {createRoute.isPending ? "Đang lưu..." : "Lưu"}
</Button>
```

## Error Handling

Mutations tự động hiển thị toast error, nhưng bạn có thể xử lý thêm:

```tsx
createRoute.mutate(data, {
    onError: (error) => {
        // Custom error handling
        console.error(error);
    }
});
```

## Best Practices

1. **KHÔNG cần manual invalidation:**
   ```tsx
   // ❌ KHÔNG CẦN:
   createRoute.mutate(data, {
       onSuccess: () => {
           queryClient.invalidateQueries({ queryKey: ['routes'] });
       }
   });
   
   // ✅ ĐÃ TỰ ĐỘNG:
   createRoute.mutate(data);
   ```

2. **Sử dụng callbacks cho UI logic:**
   ```tsx
   createRoute.mutate(data, {
       onSuccess: () => {
           setOpen(false);
           form.reset();
       }
   });
   ```

3. **Optimistic updates (nâng cao):**
   ```tsx
   // Nếu cần update UI ngay lập tức trước khi API response
   const updateRoute = useUpdateRoute();
   
   updateRoute.mutate({ id, data }, {
       onMutate: async (variables) => {
           // Cancel outgoing refetches
           await queryClient.cancelQueries({ queryKey: ['routes'] });
           
           // Snapshot previous value
           const previous = queryClient.getQueryData(['routes']);
           
           // Optimistically update
           queryClient.setQueryData(['routes'], (old) => {
               // Update logic
           });
           
           return { previous };
       },
       onError: (err, variables, context) => {
           // Rollback on error
           queryClient.setQueryData(['routes'], context.previous);
       }
   });
   ```
