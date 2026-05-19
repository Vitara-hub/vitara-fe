# Frontend Logic & Security Audit Findings

## 1) [Critical] Async race + duplicated sync triggers in `useAutoSync`
**Location:** `src/hooks/useAutoSync.ts:8-55`

`handleOnline` is re-created every time `activityHistory` changes and is bound directly as an `online` listener. This causes duplicated sync passes and overlapping writes to the same log entries when connectivity flaps or the store updates during sync. It also calls `handleOnline()` without `void`/catch, leaving floating promise risk.

### Refactor
```ts
useEffect(() => {
  let isSyncing = false;

  const handleOnline = () => {
    if (isSyncing) return;
    isSyncing = true;

    void (async () => {
      const pendingLogs = useStore.getState().activityHistory.filter(
        (log) => log.syncStatus === 'pending'
      );

      for (const log of pendingLogs) {
        if (log.type !== 'journal') continue;
        try {
          const response = await vitaraApi.predictJournal({ text: log.summary });
          useStore.setState((state) => ({
            activityHistory: state.activityHistory.map((item) =>
              item.id === log.id
                ? {
                    ...item,
                    syncStatus: 'synced',
                    emotion: response.emotion,
                    stressLevel: response.stress_level,
                    summary: item.summary.replace(' (Menunggu Sync)', ''),
                  }
                : item
            ),
            isServerDown: false,
          }));
        } catch {
          useStore.getState().setServerDown(true);
          useStore.getState().setVeeState('waiting');
        }
      }

      if (!useStore.getState().isServerDown) {
        useStore.getState().setVeeState('fresh');
      }
    })().finally(() => {
      isSyncing = false;
    });
  };

  window.addEventListener('online', handleOnline);
  if (navigator.onLine) handleOnline();
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

## 2) [High] Promise-returning event handler on `<button onClick={handleSave}>`
**Location:** `src/components/logbook/JournalTab.tsx:100`

`handleSave` is async and directly passed to `onClick`. React ignores the promise; rejection paths can become unhandled and UI state can desynchronize.

### Refactor
```tsx
<button
  onClick={() => {
    void handleSave();
  }}
  disabled={isAnalyzing}
>
  {isAnalyzing ? 'Memproses...' : 'Lepaskan Beban'}
</button>
```

## 3) [High] Stale state read in async flow (mealTime race)
**Location:** `src/components/logbook/NutritionTab.tsx:37-57`

`mealTime` is captured before `await vitaraApi.predictFood(formData)`. If user changes meal chip during request, tags are written with stale value.

### Refactor
```ts
const mealTimeRef = useRef(mealTime);
useEffect(() => {
  mealTimeRef.current = mealTime;
}, [mealTime]);

const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  // ...
  const apiResult = await vitaraApi.predictFood(formData);
  const currentMeal = mealTimeRef.current;

  setResult({
    name: apiResult.foods.length > 0 ? apiResult.foods.join(', ') : 'Makanan Tidak Dikenali',
    tags: ['Makanan AI Terdeteksi', currentMeal],
    calories: apiResult.estimated_calories,
    macros: {
      protein: Math.round(apiResult.estimated_calories * 0.05),
      carbs: Math.round(apiResult.estimated_calories * 0.12),
      fat: Math.round(apiResult.estimated_calories * 0.03),
    },
  });
};
```

## 4) [Medium] Dead state / unnecessary re-render source
**Location:** `src/hooks/useAutoSync.ts:6,55`

`updateMetric` is destructured but never used; included in deps, so it can trigger effect recreation pointlessly.

### Refactor
```ts
const { activityHistory } = useStore();

useEffect(() => {
  // sync logic
}, [activityHistory]);
```

## 5) [Medium] Expensive DOM query every animation frame
**Location:** `src/hooks/useVeePhysics.ts:132`

`querySelector('.absolute.-bottom-1.h-3')` runs inside `requestAnimationFrame`, causing repetitive DOM tree scanning (~60fps). This is a performance anti-pattern.

### Refactor
```ts
const shadowRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  shadowRef.current = veeRef.current?.querySelector<HTMLDivElement>('.absolute.-bottom-1.h-3') ?? null;
}, []);

// in updatePhysics
const shadowEl = shadowRef.current;
if (shadowEl) {
  shadowEl.style.transform = `scaleX(${sScale})`;
  shadowEl.style.opacity = sOpac.toString();
}
```

## 6) [Low] Unstable list keys for recommendations
**Location:** `src/components/chat/MessageList.tsx:34-36`

`key={idx}` can cause wrong node reuse if backend recommendation list changes order/content, producing subtle UI mismatch.

### Refactor
```tsx
{msg.recommendations.map((rec) => (
  <div key={`${msg.id}-${rec}`} className="text-[11px] font-bold ...">
    ✨ {rec}
  </div>
))}
```

## Security-specific note
No direct `dangerouslySetInnerHTML` usage was found in the inspected scope, and rendered message content is plain JSX text (escaped by React), so no direct DOM-XSS sink is present in these files.
