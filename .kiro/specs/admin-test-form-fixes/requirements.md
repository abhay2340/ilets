# Requirements Document

## Introduction

This feature addresses critical bugs in the admin test management interface that prevent proper creation and editing of test questions. The issues affect the MCQ and dropdown question types, where options are not properly synchronized with answer selections, and the edit functionality where existing test data fails to load correctly into the form.

## Glossary

- **Admin Panel**: The administrative interface for creating and managing IELTS tests
- **MCQ**: Multiple Choice Question type with custom options
- **Dropdown**: Question type where users select from a dropdown menu
- **Question Form**: The react-hook-form based interface for adding/editing questions
- **Options Array**: The list of possible answers for MCQ and dropdown questions
- **Answer Field**: The field where the correct answer is selected from available options
- **Edit Mode**: When loading an existing test for modification

## Requirements

### Requirement 1

**User Story:** As an admin, I want to see all available options in the answer dropdown when creating MCQ questions, so that I can select the correct answer from the complete list.

#### Acceptance Criteria

1. WHEN THE Admin Panel adds an option to an MCQ question, THE Question Form SHALL display that option in the answer dropdown immediately
2. WHEN THE Admin Panel has N options defined for an MCQ question, THE Question Form SHALL display exactly N options in the answer dropdown (plus the placeholder)
3. WHILE THE Admin Panel is editing MCQ options, THE Question Form SHALL maintain synchronization between the options list and answer dropdown choices
4. THE Question Form SHALL render the answer dropdown after the options array has been updated in the form state

### Requirement 2

**User Story:** As an admin, I want to see my custom options in the dropdown question type's answer field, so that I can select the correct answer from my defined options instead of default values.

#### Acceptance Criteria

1. WHEN THE Admin Panel adds options to a dropdown question type, THE Question Form SHALL display those custom options in the answer selection dropdown
2. THE Question Form SHALL NOT display hardcoded default values (TRUE/FALSE/NOT GIVEN) when custom options have been defined for dropdown questions
3. WHEN THE Admin Panel switches a question type to dropdown, THE Question Form SHALL initialize with an empty options array
4. THE Question Form SHALL use the same options-to-answer synchronization logic for both MCQ and dropdown question types

### Requirement 3

**User Story:** As an admin, I want to see all existing question data when editing a test, so that I can modify specific fields without losing the original configuration.

#### Acceptance Criteria

1. WHEN THE Admin Panel loads a test in edit mode, THE Question Form SHALL populate all question fields including type, question text, options, and answers
2. WHEN THE Admin Panel loads an MCQ or dropdown question in edit mode, THE Question Form SHALL restore the options array from the stored test data
3. WHEN THE Admin Panel loads an MCQ or dropdown question in edit mode, THE Question Form SHALL restore the answer field from the answer key document
4. THE Question Form SHALL preserve the options array structure when mapping stored test data to form state during edit mode initialization
5. THE Question Form SHALL handle all question types (mcq, dropdown, written, matchinggroup, etc.) correctly during edit mode data population
