# Plan: Improve Units UX - Move to Verify Answer Screen

## Summary
Remove the upfront "preferred units" input and instead let users change units on the Verify Answer screen after the LLM provides an answer.

## Files to Modify
- `src/screens/GameScreen.tsx` - Main UI changes
- `src/services/gemini.ts` - Add unit conversion function

---

## Implementation Steps

### 1. Add `convertUnits` function to gemini.ts

Add new interface and function:
```typescript
export interface UnitConversionResult {
  success: boolean;
  answer?: number;
  units?: string;
  errorMessage?: string;
}

export const convertUnits = async (
  question: string,
  currentAnswer: number,
  currentUnits: string,
  targetUnits: string
): Promise<UnitConversionResult>
```

The function will call Gemini to convert the answer to the requested units.

### 2. Remove `preferredUnits` from `validateQuestion`

- Remove `preferredUnits` parameter from function signature (line 22)
- Remove `unitsInstruction` variable and its usage in the prompt (lines 36-38, 42)

### 3. Update GameScreen.tsx state management

**Remove:**
- `preferredUnits` state variable (line 43)

**Add new state variables after line 51:**
```typescript
const [isChangingUnits, setIsChangingUnits] = useState(false);
const [newUnitsInput, setNewUnitsInput] = useState('');
const [isConvertingUnits, setIsConvertingUnits] = useState(false);
```

### 4. Update handler functions in GameScreen.tsx

**Update `handleValidateQuestion` (line 113):**
- Remove `preferredUnits` from the `validateQuestion()` call

**Update `handleRejectAnswer` (line 148):**
- Remove `preferredUnits` reference, use only `validatedUnits`

**Add new handlers after line 149:**
```typescript
const handleChangeUnits = () => { /* show input */ }
const handleConvertUnits = async () => { /* call LLM */ }
const handleCancelChangeUnits = () => { /* hide input */ }
```

**Update `handleResetQuestion`:**
- Add cleanup for new state variables

### 5. Update QuestionEntryView component

**Remove from props and UI:**
- `preferredUnits` prop
- `setPreferredUnits` prop
- Units input field (lines 483-490)

**Add to props:**
- `isChangingUnits`, `newUnitsInput`, `setNewUnitsInput`, `isConvertingUnits`
- `onChangeUnits`, `onConvertUnits`, `onCancelChangeUnits`

**Modify verify answer screen (lines 428-462):**
- Add "Change Units" link below the answer display
- Add conditional render for unit conversion input mode

### 6. Add styles

Add to StyleSheet:
- `changeUnitsLink` - subtle underlined link style
- `changeUnitsText` - secondary color, small font
- `currentAnswerPreview` - shows current answer during conversion

---

## New User Flow

1. User enters question (no units input)
2. Taps "Find Answer"
3. LLM returns answer with auto-detected units
4. Verify Answer screen shows answer + units
5. **New:** Subtle "Change Units" link below answer
6. If tapped: Text input appears for new units
7. LLM converts answer to new units
8. Updated answer shown, user confirms

## Fallback
"Enter My Own" button remains as escape hatch for manual entry.
