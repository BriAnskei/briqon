# Next Steps – Making the AI‑Driven Schedule Rock‑Solid

## 1️⃣ Verify the UI‑to‑Service contract
- **Convert start / end times to `HH:MM` strings** before calling `AIService.generateScheduleJSON`.
  ```tsx
  import { formatTime } from '@/features/schedule/utils/wizardHelpers';

  const start = formatTime(form.startTime);
  const end   = formatTime(form.endTime);
  ```
- Update the `handleNext` call accordingly:
  ```tsx
  await AIService!.generateScheduleJSON(
    generatedPrompt,
    start,
    end,
    form.appointments,
    form.scheduleType,
  );
  ```

## 2️⃣ Add proper error handling
```tsx
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleNext = async () => {
  // … hide drafts as before
  if (isLastStep()) {
    const generatedPrompt = WizardPromptBuilder.build(form);
    setLoading(true);
    try {
      await AIService!.generateScheduleJSON(
        generatedPrompt,
        start,
        end,
        form.appointments,
        form.scheduleType,
      );
      // navigation to the results screen or state update here
    } catch (e) {
      console.error(e);
      setError('Failed to generate schedule – please try again.');
    } finally {
      setLoading(false);
    }
  }
};
```
- Show the `error` string in the UI (e.g., a toast or an inline banner).
- Use the `loading` flag to disable the “Next” button while the model runs.

## 3️⃣ Write a unit test for the **meal‑fallback** helper
File: `src/service/__tests__/ScheduleEngine.mealFallback.test.ts`

```ts
import { ScheduleEngine } from '../ScheduleEngine';
import { FixedAppointment, FlexibleTask } from '../ScheduleEngine';

test('injects missing meals for personal schedule', () => {
  const fixed: FixedAppointment[] = [
    { activity: 'Meeting', start_time: '09:00', end_time: '10:00' },
  ];
  const tasks: FlexibleTask[] = []; // model returned no activities

  const result = ScheduleEngine.compileSchedule(
    '08:00',
    '20:00',
    fixed,
    tasks,
    'personal',          // <-- crucial
  );

  const meals = result.filter(i =>
    /Breakfast|Lunch|Dinner/.test(i.activity),
  );
  expect(meals).toHaveLength(3);
});
```
Run it with `npm test` (or `yarn test`). It should pass now that we added `ensureMealsPresence`.

## 4️⃣ Add a test for **Zod validation**
File: `src/service/__tests__/AIService.validation.test.ts`

```ts
import { PlanResponseSchema } from '../../service/ai.service';

test('rejects malformed JSON from the model', () => {
  const badJson = '{"activities":[{"activity":"Read","duration":30}]}'; // missing required field name
  expect(() => PlanResponseSchema.parse(JSON.parse(badJson))).toThrow();
});
```
> You don’t need the full LLM to run this – it just verifies the schema works.

## 5️⃣ Run a **manual end‑to‑end check**
1. Open the wizard in the app.
2. Fill in a **personal** schedule (e.g., 08:00‑18:00, a few appointments, break preference “balanced”).
3. Click “Finish” (the button that triggers `handleNext`).
4. Verify the resulting schedule UI now contains:
   - Breakfast (≈ 07:30)
   - Lunch (≈ 12:30)
   - Dinner (≈ 19:00) *(or the nearest possible slot based on your appointments)*
   - Your generated flexible activities.
5. Repeat the same flow with **event** schedule – meals should **not** appear.

## 6️⃣ Documentation & cleanup
- Add the new `NEXT_STEPS.md` to the repo’s `README` “How to continue development” section.
- Commit the UI changes, tests, and the docs file together:
  ```bash
  git add src/service/ai.service.ts src/service/ScheduleEngine.ts \
           features/schedule/utils/WizardPromptBuilder.ts \
           src/service/__tests__/ScheduleEngine.mealFallback.test.ts \
           src/service/__tests__/AIService.validation.test.ts \
           NEXT_STEPS.md
  git commit -m "Add explicit meal handling, Zod validation, engine fallback, and next‑step guide"
  ```

## 7️⃣ (Optional) CI integration
If you have a GitHub Actions workflow, extend it to run the new test files:

```yaml
- name: Run unit tests
  run: npm test
```
That way every future change will be guarded against accidentally breaking the meals‑injection or schema validation.

---

### 🎉 TL;DR
- **Convert** the start/end `Date`s to `HH:MM` strings before the service call. 
- **Wrap** the async call in `try / catch` and surface any validation or generation errors.
- **Add** the two unit tests shown above (meal fallback & Zod schema).
- **Run** a quick manual test for both personal & event schedules to confirm meals appear only when they should.
- **Document** everything in `NEXT_STEPS.md` and commit.

Once you make those three small adjustments, the flow you wrote in `handleNext` will be **fully correct, type‑safe, and resilient**. Let me know if you hit any snags while adding the conversion or the tests, and I can help you troubleshoot!