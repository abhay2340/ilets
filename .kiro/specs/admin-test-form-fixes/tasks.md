# Implementation Plan

- [x] 1. Fix AnswerSection component to properly sync options with answer dropdown
  - Replace nested Controller pattern with `watch` hook to observe options changes
  - Use standard `register` for the answer field instead of nested Controller
  - Ensure answer dropdown renders with current options array for both MCQ and dropdown types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.4_

- [x] 2. Fix edit mode data loading to preserve options array
  - Update the `loadExisting` useEffect function in Admin component
  - Add explicit options field preservation for MCQ and dropdown question types
  - Ensure options array is properly mapped from Firestore test document to form state
  - Verify answer field is correctly populated from answer key document
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Verify and test all fixes
  - Test MCQ question creation with 4+ options and verify all appear in answer dropdown
  - Test dropdown question with custom options (not default TRUE/FALSE/NOT GIVEN)
  - Test edit mode for existing tests with MCQ and dropdown questions
  - Verify options and answers are preserved correctly
  - Test that other question types (written, matchinggroup, etc.) still work correctly
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_
