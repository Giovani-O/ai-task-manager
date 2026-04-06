# Chat-Based Task Refinement Design

## Overview

Enable users to iteratively refine AI-generated tasks through a conversational interface. Users stay on the `/new-task` page to refine a single task, with message history persisted in the database. Tasks are only saved to the `tasks` table when the user explicitly clicks "Save Task".

## API Endpoints

### Create Chat
```
POST /chats
  Request: { title?: string }
  Response: { chatId: string, createdAt: string }
```

### Send Message (Refine Task)
```
POST /chats/:id/messages
  Request: {
    message: string (1-10000 chars),
    task?: TaskInitialData
  }
  Response: { task: Task, reply: string }
```

`TaskInitialData` contains: `title`, `description`, `steps`, `estimatedTime`, `implementationSuggestion`, `acceptanceCriteria`, `suggestedTests`

### Delete Chat
```
DELETE /chats/:id
  Response: { success: boolean }
```

## Data Flow

1. Client creates chat via `POST /chats`, receives `chatId`
2. Client sends message via `POST /chats/:id/messages` with optional `task` data
3. API loads existing history from `chats.description`, parses JSON
4. API constructs full message array including:
   - Previous user/assistant messages (from history)
   - Previous task data (if provided) as context
   - Current user message
5. API calls LLM with full context
6. API appends user message + assistant response to history
7. API saves updated history to `chats.description`
8. API returns `{ task, reply }` to client
9. Repeat steps 2-8 for subsequent refinements

## Storage Format

`chats.description` stores a JSON string array:

```json
[
  { "role": "user", "content": "Create a login form" },
  { "role": "assistant", "content": "Here's your task...", "task": { "title": "...", ... } },
  { "role": "user", "content": "Make email required" },
  { "role": "assistant", "content": "Updated task...", "task": { ... } }
]
```

Assistant messages include the full `task` object so the LLM sees the latest task state in history.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Chat not found | 404 `{ error: "Chat not found" }` |
| Invalid message (empty/long) | 400 `{ error: "Message must be 1-10000 chars" }` |
| LLM failure | 500 `{ error: "LLM generation failed: <reason>" }` |
| DB write failure | 500 `{ error: "Failed to save chat" }` |

## Client Behavior

- Each visit to `/new-task` creates a new chat via `POST /chats`
- All messages on that page go to `POST /chats/:id/messages`
- Task refinement happens in-place using message history
- Leaving `/new-task` abandons the chat (task not saved unless user clicks "Save Task")

## Out of Scope

- Task saving endpoint (handled separately)
- Task listing/editing (existing routes)
- Tests (project in active development)
