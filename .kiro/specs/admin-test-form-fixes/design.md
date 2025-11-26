# Design Document

## Overview

This design addresses three interconnected bugs in the Admin.jsx test management form:

1. **MCQ Answer Dropdown Sync Issue**: The answer dropdown renders before options are fully updated in react-hook-form state
2. **Dropdown Type Default Values**: Dropdown questions show hardcoded defaults instead of custom options
3. **Edit Mode Data Loss**: Options arrays are not properly restored when loading existing tests

The root causes are:

- React rendering timing issues with nested Controllers
- Missing options field in the edit mode data mapping
- Shared validation logic that doesn't account for timing differences

## Architecture

The fix involves three main areas in `src/Admin.jsx`:

1. **AnswerSection Component** - Modify the answer dropdown rendering logic
2. **Edit Mode Data Loading** - Update the `loadExisting` useEffect to preserve options
3. **Form State Management** - Ensure proper synchronization between options and answer fields

### Component Hierarchy

```
Admin
├── QuestionsSection
│   └── QuestionCard
│       ├── OptionsSection
│       │   └── OptionsEditor (useFieldArray for options)
│       └── AnswerSection
│           └── Controller (renders answer dropdown based on options)
```

## Components and Interfaces

### 1. AnswerSection Component Enhancement

**Current Issue**: The answer dropdown uses a nested Controller pattern:

```javascript
<Controller name="options" render={({ field: optsField }) => (
  <Controller name="answer" render={({ field: ansField }) => (
    <select>{options.map(...)}</select>
  )} />
)} />
```

This causes the inner Controller to render before the options array is updated in form state.

**Solution**: Use `watch` to observe options changes instead of nested Controllers:

```javascript
const AnswerSection = ({ control, register, setValue, partIndex, qIndex, errors }) => {
  const namePrefix = `parts.${partIndex}.questions.${qIndex}`;
  const questionType = watch(`${namePrefix}.type`);
  const options = watch(`${namePrefix}.options`) || [];

  if (questionType === 'mcq' || questionType === 'dropdown') {
    return (
      <div>
        <label>Correct Answer</label>
        <select {...register(`${namePrefix}.answer`)}>
          <option value="">Select correct option…</option>
          {options.map((opt, idx) => (
            <option key={`${opt}-${idx}`} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }
  // ... other types
};
```

**Benefits**:

- Direct subscription to options changes via `watch`
- Eliminates nested Controller timing issues
- Simpler code with standard `register` for the answer field

### 2. Edit Mode Data Restoration

**Current Issue**: The `loadExisting` function maps question data but doesn't preserve the `options` field:

```javascript
questions: (part.questions || []).map((q) => {
  if (q.type === 'matchinggroup') {
    return { ...q, answers };
  }
  // ... other types
  const ans = answersMap[q.id] || '';
  return { ...q, answer: ans }; // ❌ options field is lost
});
```

**Solution**: Explicitly preserve the options field for MCQ and dropdown types:

```javascript
questions: (part.questions || []).map((q) => {
  // Handle complex types first...

  if (q.type === 'mcq' || q.type === 'dropdown') {
    const ans = answersMap[q.id] || '';
    return {
      ...q,
      options: Array.isArray(q.options) ? q.options : [],
      answer: ans,
    };
  }

  if (q.type === 'info') return { ...q };

  // Default case for written, etc.
  const ans = answersMap[q.id] || '';
  return { ...q, answer: ans };
});
```

### 3. Form Initialization

**Current Behavior**: When adding a new question, it initializes with default options:

```javascript
append({ type: 'mcq', question: '', options: ['TRUE', 'FALSE', 'NOT GIVEN'] });
```

**Design Decision**: Keep this default for MCQ (common IELTS pattern) but ensure dropdown starts empty:

```javascript
// In the "+ Add Question" button handler
append({
  type: 'mcq',
  question: '',
  options: ['TRUE', 'FALSE', 'NOT GIVEN'],
  answer: '',
});
```

When user changes type to dropdown, the options remain but can be modified. This is acceptable since OptionsEditor allows full control.

## Data Models

### Question Form State (MCQ/Dropdown)

```typescript
{
  type: 'mcq' | 'dropdown',
  question: string,
  options: string[],  // Must be preserved in edit mode
  answer: string      // Must match one of options
}
```

### Stored Test Data

```typescript
{
  id: number,
  type: 'mcq' | 'dropdown',
  question: string,
  options: string[]   // Stored in Firestore test document
}
```

### Answer Key Data

```typescript
{
  [questionId: number]: string  // The correct answer
}
```

## Error Handling

### Validation Constraints

The existing yup schema already handles:

- Options array must have at least 2 items
- Answer must match one of the options
- Answer is required for MCQ/dropdown

**No changes needed** to validation logic - the fixes ensure data flows correctly to validators.

### Edge Cases

1. **Empty options during edit**: If stored test has no options, initialize to empty array
2. **Answer not in options**: Validation will catch this; user must update
3. **Type switching**: When switching from MCQ to dropdown or vice versa, options are preserved (acceptable behavior)

## Testing Strategy

### Manual Testing Checklist

1. **MCQ Options Sync**
   - Create new test
   - Add MCQ question
   - Add 4 options (A, B, C, D)
   - Verify answer dropdown shows all 4 options
   - Select option C as answer
   - Save and verify

2. **Dropdown Custom Options**
   - Create new test
   - Add question, change type to "dropdown"
   - Remove default options
   - Add custom options (Option 1, Option 2, Option 3)
   - Verify answer dropdown shows custom options (not TRUE/FALSE/NOT GIVEN)
   - Select Option 2 as answer
   - Save and verify

3. **Edit Mode Preservation**
   - Create test with MCQ question having options [A, B, C, D] and answer "C"
   - Save test
   - Navigate to "All Tests" and click "Edit" on the test
   - Verify options [A, B, C, D] appear in the form
   - Verify answer "C" is selected
   - Modify option B to "B-Modified"
   - Save and verify changes persist

4. **Cross-type Verification**
   - Test that other question types (written, matchinggroup, etc.) still work correctly
   - Verify edit mode works for all question types

### Regression Testing

- Ensure validation still works (empty options, mismatched answer)
- Verify audio upload still functions
- Test part addition/removal
- Verify test creation and update flows

## Implementation Notes

### Key Changes Summary

1. **AnswerSection**: Replace nested Controllers with `watch` + `register`
2. **loadExisting**: Add explicit options preservation for MCQ/dropdown
3. **No changes needed**: Validation, OptionsEditor, other question types

### Dependencies

- react-hook-form: `watch`, `register`, `Controller` (existing)
- No new dependencies required

### Performance Considerations

Using `watch` adds a subscription but only for the specific fields needed. This is more efficient than nested Controllers which create multiple render cycles.
