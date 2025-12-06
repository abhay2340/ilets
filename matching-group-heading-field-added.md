# Matching Group - Options Table Heading Field Added

## Changes Made

### Added Options Table Heading Field

A new field has been added to the Matching Group editor to allow specifying a heading that appears above the options table in the test.

## New Field Details

### Field Name

**Options Table Heading**

### Purpose

This field allows you to add a descriptive heading that appears above the options table when students take the test. This provides context for what the column options represent.

### Example Usage

Based on the reference image, the heading could be:

- "First invented or used by"
- "Categories"
- "Types"
- "Classifications"
- Any other descriptive text

### Visual Location

The field appears at the top of the Matching Group editor, before the Columns section, with a yellow/cream background to distinguish it.

## Updated Structure

### Admin Form Layout

```
┌─────────────────────────────────────────────────────┐
│ Matching Group                                       │
│                                                      │
│ ┌─────────────────────────────────────────────┐    │
│ │ Options Table Heading        [Yellow BG]    │    │
│ │                                              │    │
│ │ [First invented or used by]                 │    │
│ │                                              │    │
│ │ This heading will appear above the options   │    │
│ │ table in the test                            │    │
│ └─────────────────────────────────────────────┘    │
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
│ │ Row 2: [A] Available: A, B, C, D, E         │    │
│ │ Row 3: [C] Available: A, B, C, D, E         │    │
│ │ Row 4: [D] Available: A, B, C, D, E         │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## How It Appears in the Test

When students take the test, they will see:

```
Display ID For demo. This is a matching group

                                A    B    C
4. Abhay                        ○    ○    ○
5. Abhishek                     ○    ○    ○
6. Aghori                       ○    ○    ○
7. Auto                         ○    ○    ○

Options
┌─────────────────────────────────────┐
│ First invented or used by           │  ← This is the heading
├─────┬───────────────────────────────┤
│  A  │  Abhay                        │
│  B  │  Bhay                         │
│  C  │  Chsasd                       │
└─────┴───────────────────────────────┘
```

## Implementation Details

### Field Registration

```javascript
<input
  placeholder="e.g., First invented or used by"
  {...register(`${namePrefix}.displayId`)}
  style={{ width: '100%', padding: 8 }}
/>
```

### Data Storage

The heading is stored in the `displayId` field of the matching group question:

```javascript
{
  type: 'matchinggroup',
  displayId: 'First invented or used by',  // ← The heading
  columns: ['the Chinese', 'the Indians', 'the British', 'the Arabs', 'the Americans'],
  rows: ['black powder', 'rocket-propelled arrows', 'rockets as war weapons', 'the rocket launcher'],
  answers: ['A', 'A', 'C', 'D']
}
```

### Visual Styling

- Background: `#fff9e6` (light yellow/cream)
- Border: `1px solid #e0e0e0`
- Border radius: `8px`
- Padding: `12px`

## Benefits

### ✅ Better Context

Students understand what the column options represent

### ✅ Professional Appearance

The options table has a clear, descriptive heading

### ✅ Flexibility

Can be customized for different types of matching questions

### ✅ Matches Reference Image

The structure now matches the example shown in the reference image

## Example Scenarios

### Scenario 1: Historical Inventions

```
Heading: "First invented or used by"
Columns: A (the Chinese), B (the Indians), C (the British), D (the Arabs), E (the Americans)
Rows: black powder, rocket-propelled arrows, rockets as war weapons, the rocket launcher
```

### Scenario 2: Animal Classifications

```
Heading: "Animal Type"
Columns: A (Mammal), B (Bird), C (Reptile), D (Fish), E (Amphibian)
Rows: dolphin, eagle, snake, salmon, frog
```

### Scenario 3: Literary Genres

```
Heading: "Genre"
Columns: A (Fiction), B (Non-fiction), C (Poetry), D (Drama)
Rows: novel, biography, sonnet, play
```

## Testing

### ✅ Test Case 1: Add Heading

1. Create matching group question
2. Enter heading: "First invented or used by"
3. Add columns and rows
4. Save
5. **Expected**: Heading saved and displayed in test

### ✅ Test Case 2: Edit Heading

1. Load existing matching group
2. Modify heading
3. Save
4. **Expected**: Updated heading displayed

### ✅ Test Case 3: Empty Heading

1. Create matching group without heading
2. Save
3. **Expected**: Question works without heading (optional field)

### ✅ Test Case 4: Long Heading

1. Enter long heading text
2. Save
3. **Expected**: Heading displays properly, wraps if needed

## Summary

The Options Table Heading field has been added to provide context for the column options in matching group questions. This field appears at the top of the Matching Group editor with a distinctive yellow background and allows you to specify descriptive text that will appear above the options table when students take the test.

The field is stored in the `displayId` property and is optional - if left empty, the question will still work correctly without a heading.
