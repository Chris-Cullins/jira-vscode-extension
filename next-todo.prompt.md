# Next TODO Feature Implementation

## Instructions for AI Agent

Please follow these steps to implement the next feature from the TODO list:

### Step 1: Read the TODO List
- Read the `TODO.md` file in the root of this project
- Identify the **first uncompleted feature** (marked with `- [ ]`) from the top of the list
- This is the feature you will implement

### Step 2: Review Feature Specifications
- Read the detailed specifications for the identified feature in `FEATURES.md`
- Review any related context in `CLAUDE.md` (the agent guidelines)
- Understand the acceptance criteria and implementation details

### Step 3: Implement the Feature
- Use the TodoWrite tool to create a task list for the feature implementation
- Follow the implementation details provided in `FEATURES.md`
- Write clean, well-documented code following the project's TypeScript conventions
- Ensure all acceptance criteria are met
- Test that TypeScript compiles without errors (`npm run compile`)
- Mark tasks as completed as you progress

### Step 4: Update Documentation
- Mark the feature as complete in `TODO.md` by changing `- [ ]` to `- [x]`
- Update `README.md` if the feature adds user-facing functionality
- Add any relevant comments or documentation to the code

### Step 5: Commit and Push
- Stage all changes with `git add .`
- Create a descriptive commit message that:
  - Identifies the feature number and name
  - Summarizes what was implemented
  - Lists the acceptance criteria that were met
  - Includes the standard footer:
    ```
    🤖 Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude <noreply@anthropic.com>
    ```
- Push to GitHub: `git push`

### Step 6: Summary
- Provide a brief summary of what was implemented
- Confirm the feature is complete and pushed to GitHub
- Note what the next feature will be

## Example Workflow

```bash
# 1. Read TODO.md and identify next feature
# 2. Read FEATURES.md for implementation details
# 3. Implement the feature
npm run compile  # Verify it compiles

# 4. Update TODO.md to mark as complete
# 5. Commit and push
git add .
git commit -m "Feature X.X: Feature Name

[Implementation summary]

Acceptance Criteria:
✅ Criterion 1
✅ Criterion 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

## Important Guidelines

- **Follow CLAUDE.md guidelines**: Especially regarding Jira API v2, authentication, and VS Code best practices
- **Use TodoWrite tool**: Track your progress through the implementation
- **Test thoroughly**: Ensure TypeScript compiles and the extension can run (F5)
- **Commit atomically**: Each feature should be a single, complete commit
- **Be thorough**: Meet all acceptance criteria before marking as complete

## Ready to Start?

Begin by reading `TODO.md` and implementing the next uncompleted feature!
