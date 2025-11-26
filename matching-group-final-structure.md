# Matching Group Editor - Final Structure

## Overview

The Matching Group editor has been redesigned to match the structure shown in the reference image, with three distinct sections for better organization and clarity.

---

## New Structure

### 1. **Columns Section** (Options with Labels)

This section defines the answer options with their labels (A, B, C, D, E, etc.).

**Format**: `[Label] → [Description]`

**Example**:

```
A → the Chinese
B → the Indians
C → the British
D → the Arabs
E → the Americans
```

**Features**:

- Automatic letter labels (A, B, C, D, E, F, G, etc.)
- Text field for each column's description
- Add/Remove columns dynamically
- Labels auto-increment (A, B, C...)

---

### 2. **Rows Section** (Questions/Items)

This section contains the questions or items that need to be matched.

**Format**: `[Number] → [Question Text]`

**Example**:

```
1 → black powder
2 → rocket-propelled arrows for fighting
3 → rockets as war weapons
4 → the rocket launcher
```

**Features**:

- Automatic numbering (1, 2, 3, 4, etc.)
- Text field for each row's question
- Add/Remove rows dynamically
- Each row automatically gets a corresponding answer field

---

### 3. **Answers Section** (Column Selection for Each Row)

This section specifies which column (A, B, C, D, E) is the correct answer for each row.

**Format**: `Row [Number] → [Column Letter]`

**Example**:

```
Row 1: A
Row 2: B
Row 3: C
Row 4: D
```

**Features**:

- One answer field per row
- Text input for column letter
- Shows available column letters as a hint
- Automatically synced with rows (add/remove)

---

## Visual Layout

The interface is organized into three color-coded sections:

```
┌─────────────────────────────────────────────────────┐
│ Matching Group                                       │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Columns (Options)                [Gray BG]  │    │
│ │                                              │    │
│ │ A  [the Chinese            ] [Remove]       │    │
│ │ B  [the Indians            ] [Remove]       │    │
│ │ C  [the British            ] [Remove]       │    │
│ │ D  [the Arabs              ] [Remove]       │    │
│ │ E  [the Americans          ] [Remove]       │    │
│ │                                              │    │
│ │ [+ Add Column]                               │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Rows (Questions/Items)           [Gray BG]  │    │
│ │                                              │    │
│ │ 1  [black powder           ] [Remove]       │    │
│ │ 2  [rocket-propelled...    ] [Remove]       │    │
│ │ 3  [rockets as war weapons ] [Remove]       │    │
│ │ 4  [the rocket launcher    ] [Remove]       │    │
│ │                                              │    │
│ │ [+ Add Row]                                  │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Answers                          [Green BG] │    │
│ │                                              │    │
│ │ Row 1: [A] Available: A, B, C, D, E         │    │
│ │ Row 2: [B] Available: A, B, C, D, E         │    │
│ │ Row 3: [C] Available: A, B, C, D, E         │    │
│ │ Row 4: [D] Available: A, B, C, D, E         │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## How to Use

### Step 1: Add Columns

1. Click "+ Add Column" to add answer options
2. Each column gets an automatic letter (A, B, C, etc.)
3. Enter the description for each column (e.g., "the Chinese")
4. Add as many columns as needed

### Step 2: Add Rows

1. Click "+ Add Row" to add questions/items
2. Each row gets an automatic number (1, 2, 3, etc.)
3. Enter the question text (e.g., "black powder")
4. Add as many rows as needed

### Step 3: Specify Answers

1. For each row, enter the correct column letter
2. The interface shows available column letters as a hint
3. Example: If "black powder" matches "the Chinese", enter "A"

---

## Key Features

### ✅ Removed Display ID Field

The optional "Display ID" field has been completely removed for simplicity.

### ✅ Automatic Synchronization

- Rows and answers are automatically synced
- Adding a row automatically creates an answer field
- Removing a row automatically removes its answer field

### ✅ Clear Visual Organization

- Three distinct sections with different background colors
- Gray backgrounds for input sections (Columns, Rows)
- Green background for answers section
- Clear labels and numbering

### ✅ Helpful Hints

- Column letters shown automatically (A, B, C...)
- Row numbers shown automatically (1, 2, 3...)
- Available columns displayed next to each answer field

### ✅ Flexible Structure

- Add/remove columns dynamically
- Add/remove rows dynamically
- No limit on number of columns or rows

---

## Data Structure

The data is stored in the same format as before:

```javascript
{
  type: 'matchinggroup',
  columns: ['the Chinese', 'the Indians', 'the British', 'the Arabs', 'the Americans'],
  rows: ['black powder', 'rocket-propelled arrows for fighting', 'rockets as war weapons', 'the rocket launcher'],
  answers: ['A', 'B', 'C', 'D']
}
```

**Note**: The column labels (A, B, C, D, E) are generated automatically in the UI but the actual column descriptions are stored in the `columns` array. The answers reference these columns by their letter.

---

## Example Workflow

### Creating a Matching Question

**Scenario**: Create a question about inventions and their origins

1. **Add Columns**:
   - Click "+ Add Column" 5 times
   - Fill in:
     - A: the Chinese
     - B: the Indians
     - C: the British
     - D: the Arabs
     - E: the Americans

2. **Add Rows**:
   - Click "+ Add Row" 4 times
   - Fill in:
     - 1: black powder
     - 2: rocket-propelled arrows for fighting
     - 3: rockets as war weapons
     - 4: the rocket launcher

3. **Specify Answers**:
   - Row 1: A (black powder → the Chinese)
   - Row 2: A (rocket-propelled arrows → the Chinese)
   - Row 3: C (rockets as war weapons → the British)
   - Row 4: D (the rocket launcher → the Arabs)

4. **Save**: Click "Save Test"

---

## Benefits

1. **Matches Reference Image**: Structure exactly matches the visual layout shown in the reference
2. **Clear Separation**: Three distinct sections make it easy to understand
3. **Automatic Labels**: No need to manually type A, B, C - they're generated automatically
4. **Visual Hints**: Available columns shown next to each answer field
5. **Prevents Errors**: Clear structure reduces mistakes
6. **Easy to Edit**: Can modify columns, rows, and answers independently
7. **Scalable**: Works with any number of columns and rows

---

## Technical Implementation

### Column Labels

- Generated automatically using `String.fromCharCode(65 + index)`
- A = 65, B = 66, C = 67, etc.
- Stored in component state: `const [columnLabels, setColumnLabels] = React.useState(['A', 'B', 'C', 'D', 'E'])`

### Automatic Synchronization

- `addRowWithAnswer()` adds both row and answer field
- `removeRowWithAnswer(idx)` removes both row and answer field
- Ensures rows and answers always match

### Visual Styling

- Columns section: `background: '#fafafa'` (light gray)
- Rows section: `background: '#fafafa'` (light gray)
- Answers section: `background: '#f0fff4'` (light green)
- Borders and padding for clear separation

---

## Backward Compatibility

The data structure remains the same, ensuring:

- ✅ Existing tests load correctly
- ✅ Saved tests work as before
- ✅ No migration needed
- ✅ Only the editing interface changed

---

## Testing Checklist

### ✅ Create New Matching Group

1. Add 5 columns with descriptions
2. Add 4 rows with questions
3. Specify answers for each row
4. Save and verify

### ✅ Edit Existing Matching Group

1. Load existing test
2. Verify columns, rows, and answers load correctly
3. Modify a column description
4. Add a new row
5. Update answers
6. Save and verify

### ✅ Dynamic Operations

1. Add column → verify letter increments
2. Remove column → verify remaining letters stay correct
3. Add row → verify answer field appears
4. Remove row → verify answer field disappears
5. Verify no orphaned data

### ✅ Validation

1. Try saving without columns → verify error
2. Try saving without rows → verify error
3. Try saving with mismatched answers → verify validation
4. Verify all fields required

---

## Summary

The new Matching Group editor provides a clear, intuitive interface that matches the reference image structure. With automatic labeling, visual organization, and helpful hints, it makes creating matching questions straightforward and error-free.
