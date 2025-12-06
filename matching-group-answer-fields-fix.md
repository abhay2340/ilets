# Matching Group - Answer Fields Fix

## Issue

The answers section was only showing one answer field instead of showing an answer field for every row that was added.

## Root Cause

The answers section was using `answerFields.map()` which only iterates over fields that have been explicitly added to the answers array. When creating a new question, the answers array starts empty, so no answer fields were displayed even though rows existed.

## Solution

Changed the answers section to map over `rowFields` instead of `answerFields`. This ensures that an answer field is displayed for every row, regardless of whether the answer has been filled in yet.

### Before

```javascript
<div style={{ display: 'grid', gap: 8 }}>
  {answerFields.map((ans, idx) => (
    <div key={ans.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ minWidth: 100, color: '#666', fontWeight: 500 }}>Row {idx + 1}:</span>
      <input
        placeholder={`Enter column letter (e.g., ${columnLabels[0] || 'A'})`}
        {...register(`${namePrefix}.answers.${idx}`)}
        style={{ flex: 1, padding: 8, maxWidth: 200 }}
      />
      <span style={{ fontSize: 12, color: '#999' }}>
        Available: {columnLabels.slice(0, columnFields.length).join(', ')}
      </span>
    </div>
  ))}
</div>
```

### After

```javascript
{
  rowFields.length === 0 ? (
    <div style={{ color: '#999', fontStyle: 'italic', padding: 8 }}>
      Add rows above to specify answers
    </div>
  ) : (
    <div style={{ display: 'grid', gap: 8 }}>
      {rowFields.map((row, idx) => (
        <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ minWidth: 100, color: '#666', fontWeight: 500 }}>Row {idx + 1}:</span>
          <input
            placeholder={`Enter column letter (e.g., ${columnLabels[0] || 'A'})`}
            {...register(`${namePrefix}.answers.${idx}`)}
            style={{ flex: 1, padding: 8, maxWidth: 200 }}
          />
          <span style={{ fontSize: 12, color: '#999' }}>
            Available: {columnLabels.slice(0, columnFields.length).join(', ')}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Benefits

### ✅ Automatic Display

- Answer fields now appear automatically for every row
- No need to manually add answer fields
- Visual feedback when no rows exist

### ✅ Perfect Synchronization

- Number of answer fields always matches number of rows
- Adding a row immediately shows its answer field
- Removing a row immediately removes its answer field

### ✅ Better UX

- Clear indication when no rows exist ("Add rows above to specify answers")
- All answer fields visible at once
- Easy to see which rows need answers

## How It Works Now

### Creating a New Matching Group Question

1. **Add Columns**:

   ```
   A → the Chinese
   B → the Indians
   C → the British
   D → the Arabs
   E → the Americans
   ```

2. **Add Rows**:

   ```
   1 → black powder
   2 → rocket-propelled arrows for fighting
   3 → rockets as war weapons
   4 → the rocket launcher
   ```

3. **Answer Fields Automatically Appear**:

   ```
   Row 1: [____] Available: A, B, C, D, E
   Row 2: [____] Available: A, B, C, D, E
   Row 3: [____] Available: A, B, C, D, E
   Row 4: [____] Available: A, B, C, D, E
   ```

4. **Fill in Answers**:
   ```
   Row 1: [A] Available: A, B, C, D, E
   Row 2: [A] Available: A, B, C, D, E
   Row 3: [C] Available: A, B, C, D, E
   Row 4: [D] Available: A, B, C, D, E
   ```

## Technical Details

### Key Change

Instead of mapping over `answerFields` (which tracks the answers array), we now map over `rowFields` (which tracks the rows array). This ensures the UI always shows an input for every row.

### Data Synchronization

The `addRowWithAnswer()` and `removeRowWithAnswer()` functions still maintain synchronization between rows and answers arrays:

```javascript
const addRowWithAnswer = () => {
  appendRow(''); // Add empty row
  appendAnswer(''); // Add empty answer
};

const removeRowWithAnswer = (idx) => {
  removeRow(idx); // Remove row at index
  removeAnswer(idx); // Remove answer at same index
};
```

### Form Registration

Each answer field is still properly registered with react-hook-form:

```javascript
{...register(`${namePrefix}.answers.${idx}`)}
```

This ensures:

- Values are tracked in form state
- Validation works correctly
- Data is saved properly

## Testing

### ✅ Test Case 1: Add Multiple Rows

1. Add 5 columns (A, B, C, D, E)
2. Add 4 rows
3. **Expected**: 4 answer fields appear immediately
4. **Result**: ✅ All 4 answer fields visible

### ✅ Test Case 2: Add Row Dynamically

1. Start with 2 rows and 2 answer fields
2. Click "+ Add Row"
3. **Expected**: 3rd answer field appears immediately
4. **Result**: ✅ 3rd answer field appears

### ✅ Test Case 3: Remove Row

1. Start with 4 rows and 4 answer fields
2. Remove row 2
3. **Expected**: Only 3 answer fields remain
4. **Result**: ✅ Correct synchronization

### ✅ Test Case 4: No Rows

1. Create new matching group question
2. Don't add any rows yet
3. **Expected**: Message "Add rows above to specify answers"
4. **Result**: ✅ Helpful message displayed

### ✅ Test Case 5: Fill Answers

1. Add 4 rows
2. Fill in answers: A, B, C, D
3. Save and reload
4. **Expected**: All answers preserved
5. **Result**: ✅ Data persists correctly

## Summary

The fix ensures that answer fields are always visible for every row in a matching group question. This provides a better user experience and makes it clear that each row needs an answer. The synchronization between rows and answers is maintained through the existing `addRowWithAnswer()` and `removeRowWithAnswer()` functions.

## Visual Result

**Before**: Only 1 answer field visible (or none if answers array was empty)

**After**:

```
Answers (Which column for each row?)
┌─────────────────────────────────────────────┐
│ Row 1: [A] Available: A, B, C, D, E         │
│ Row 2: [B] Available: A, B, C, D, E         │
│ Row 3: [C] Available: A, B, C, D, E         │
│ Row 4: [D] Available: A, B, C, D, E         │
└─────────────────────────────────────────────┘
```

All answer fields are now visible and properly synchronized with the rows!
