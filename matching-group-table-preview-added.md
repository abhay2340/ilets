# Matching Group - Table Heading Preview Section Added

## New Feature

### Table Heading Preview Section

A new preview section has been added between the Rows and Answers sections that shows exactly how the options table will appear in the test.

---

## Complete Structure

```
Options (Gray Background)
├─ Table Heading (optional)
│  └─ [First invented or used by]
└─ Column Options
   ├─ A → [the Chinese]
   ├─ B → [the Indians]
   ├─ C → [the British]
   ├─ D → [the Arabs]
   └─ E → [the Americans]

Rows (Questions/Items)
├─ 1 → [black powder]
├─ 2 → [rocket-propelled arrows]
├─ 3 → [rockets as war weapons]
└─ 4 → [the rocket launcher]

Table Heading Preview ⭐ NEW
├─ First invented or used by
└─ ┌─────┬───────────────────┐
   │  A  │  the Chinese      │
   │  B  │  the Indians      │
   │  C  │  the British      │
   │  D  │  the Arabs        │
   │  E  │  the Americans    │
   └─────┴───────────────────┘

Answers
├─ Row 1: [A]
├─ Row 2: [A]
├─ Row 3: [C]
└─ Row 4: [D]
```

---

## Preview Section Details

### Visual Appearance

- **Background**: Light orange/peach (`#fff9f0`)
- **Border**: Standard gray border
- **Location**: Between Rows and Answers sections

### What It Shows

1. **Table Heading** (if entered)
   - Displays the heading text in a prominent box
   - Shows exactly how it will appear in the test

2. **Options Table**
   - Shows column letters (A, B, C, D, E...)
   - Shows column descriptions
   - Formatted as a clean table with borders
   - Updates in real-time as you type

### Real-Time Updates

The preview updates automatically as you:

- Type the table heading
- Add/remove columns
- Edit column descriptions

---

## Visual Layout

### Admin Form

```
┌─────────────────────────────────────────────────────┐
│ Matching Group                                       │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Options                          [Gray BG]  │    │
│ │                                              │    │
│ │ Table Heading (optional)                     │    │
│ │ [First invented or used by]                 │    │
│ │                                              │    │
│ │ Column Options                               │    │
│ │ A  [the Chinese            ] [Remove]       │    │
│ │ B  [the Indians            ] [Remove]       │    │
│ │ C  [the British            ] [Remove]       │    │
│ │ D  [the Arabs              ] [Remove]       │    │
│ │ E  [the Americans          ] [Remove]       │    │
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
│ │ [+ Add Row]                                  │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Table Heading Preview        [Orange BG] ⭐ │    │
│ │                                              │    │
│ │ This is how the options table will appear   │    │
│ │ in the test                                  │    │
│ │                                              │    │
│ │ ┌─────────────────────────────────────┐    │    │
│ │ │ First invented or used by           │    │    │
│ │ └─────────────────────────────────────┘    │    │
│ │                                              │    │
│ │ ┌─────┬───────────────────────────────┐    │    │
│ │ │  A  │  the Chinese                  │    │    │
│ │ ├─────┼───────────────────────────────┤    │    │
│ │ │  B  │  the Indians                  │    │    │
│ │ ├─────┼───────────────────────────────┤    │    │
│ │ │  C  │  the British                  │    │    │
│ │ ├─────┼───────────────────────────────┤    │    │
│ │ │  D  │  the Arabs                    │    │    │
│ │ ├─────┼───────────────────────────────┤    │    │
│ │ │  E  │  the Americans                │    │    │
│ │ └─────┴───────────────────────────────┘    │    │
│ └─────────────────────────────────────────────┘    │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Answers                          [Green BG] │    │
│ │                                              │    │
│ │ Row 1: [A] Available: A, B, C, D, E         │    │
│ │ Row 2: [A] Available: A, B, C, D, E         │    │
│ │ Row 3: [C] Available: A, B, C, D, E         │    │
│ │ Row 4: [D] Available: A, B, C, D, E         │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Benefits

### ✅ Visual Feedback

See exactly how the options table will look in the test before saving

### ✅ Real-Time Preview

Updates automatically as you type - no need to save and reload

### ✅ Error Prevention

Catch formatting issues or typos before students see them

### ✅ Professional Appearance

Ensures the table looks clean and organized

### ✅ Better UX

Clear separation between input fields and preview

---

## Implementation Details

### Conditional Rendering

The preview section only appears if:

- A table heading has been entered, OR
- At least one column has been added

```javascript
{
  (watch(`${namePrefix}.displayId`) || columnFields.length > 0) && (
    <div>{/* Preview content */}</div>
  );
}
```

### Real-Time Watching

Uses `watch()` to observe changes:

```javascript
watch(`${namePrefix}.displayId`); // Table heading
watch(`${namePrefix}.columns.${idx}`); // Each column description
```

### Table Structure

```javascript
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <tbody>
    {columnFields.map((col, idx) => (
      <tr key={col.id}>
        <td>{columnLabels[idx]}</td>
        <td>{watch(`${namePrefix}.columns.${idx}`) || '(empty)'}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## Example Workflow

### Step 1: Enter Table Heading

```
Table Heading: First invented or used by
```

**Preview shows**: Heading in a box

### Step 2: Add First Column

```
A → the Chinese
```

**Preview shows**:

```
First invented or used by
┌─────┬───────────────┐
│  A  │  the Chinese  │
└─────┴───────────────┘
```

### Step 3: Add More Columns

```
A → the Chinese
B → the Indians
C → the British
```

**Preview shows**:

```
First invented or used by
┌─────┬───────────────┐
│  A  │  the Chinese  │
│  B  │  the Indians  │
│  C  │  the British  │
└─────┴───────────────┘
```

### Step 4: Edit Column Description

Change "the Chinese" to "Chinese inventors"

**Preview updates immediately**:

```
First invented or used by
┌─────┬────────────────────┐
│  A  │  Chinese inventors │
│  B  │  the Indians       │
│  C  │  the British       │
└─────┴────────────────────┘
```

---

## Styling Details

### Preview Section

- Background: `#fff9f0` (light orange/peach)
- Border: `1px solid #e0e0e0`
- Border radius: `8px`
- Padding: `12px`

### Table Heading Display

- Background: `#fff` (white)
- Border: `1px solid #e0e0e0`
- Font weight: `600` (semi-bold)
- Font size: `15px`
- Padding: `8px`

### Options Table

- Background: `#fff` (white)
- Border: `1px solid #ddd`
- Cell padding: `8px 12px`
- Column letter cell: Gray background (`#f9f9f9`)
- Column letter: Bold, centered, 60px width

---

## Testing

### ✅ Test Case 1: Empty State

1. Create new matching group
2. **Expected**: No preview section visible
3. Add table heading
4. **Expected**: Preview appears with heading only

### ✅ Test Case 2: Add Columns

1. Add table heading
2. Add 3 columns
3. **Expected**: Preview shows heading + 3-row table
4. Add 2 more columns
5. **Expected**: Preview updates to show 5 rows

### ✅ Test Case 3: Real-Time Updates

1. Type in table heading field
2. **Expected**: Preview updates as you type
3. Type in column description
4. **Expected**: Table updates as you type

### ✅ Test Case 4: Remove Columns

1. Have 5 columns in preview
2. Remove column C
3. **Expected**: Preview updates to show 4 rows
4. Column letters remain correct (A, B, D, E)

### ✅ Test Case 5: Empty Column

1. Add column but leave description empty
2. **Expected**: Preview shows "(empty)" placeholder
3. Fill in description
4. **Expected**: Preview updates with actual text

---

## Summary

The new **Table Heading Preview** section provides real-time visual feedback showing exactly how the options table will appear in the test. It displays:

1. The table heading (if entered)
2. A formatted table with column letters and descriptions
3. Real-time updates as you type

This helps ensure the options table looks professional and correct before students see it, improving the overall quality of matching group questions.

The preview section appears between the Rows and Answers sections with a distinctive orange/peach background, making it easy to identify as a preview rather than an input section.
