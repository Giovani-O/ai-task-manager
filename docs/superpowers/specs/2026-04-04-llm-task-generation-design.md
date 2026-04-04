# Send Message LLM Integration Design

**Date:** 2026-04-04  
**Status:** Approved

## Overview

Integrate Vercel AI SDK with Google GenAI provider into the API to generate Task objects from user messages. The LLM acts as a "Senior Project Manager" to interpret user requests and return structured task data.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Route         │ ──> │   LLM Service    │ ──> │   Google Gemini │
│ send-message.ts │     │   (services/llm) │     │   gemini-2.5-flash│
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Implementation

### 1. Install Dependencies

```bash
pnpm add ai @ai-sdk/google
```

### 2. Create LLM Service

**File:** `api/src/services/llm.ts`

- Initialize Google provider with `env.GEMINI_API_KEY` and model `gemini-2.5-flash`
- Export function `generateTask(userMessage: string): Promise<GenerateTaskResponse>`
- Use Vercel AI's `generateObject` for structured output
- System prompt: "You are a Senior Project Manager. Given a user request, break it down into a structured task with title, description, steps, estimated time, implementation suggestions, acceptance criteria, and suggested tests."
- Output schema matches Task shape + reply field

### 3. Update Route

**File:** `api/src/routes/send-message.ts`

- Import LLM service
- Replace hardcoded Task with call to `generateTask(message)`
- Update response schema to include `{ task: Task, reply: string }`

### 4. Response Schema

```typescript
{
  data: {
    task: Task,
    reply: string
  }
}
```

## Error Handling

- If LLM call fails, return 500 with appropriate error message
- Validate LLM response against schema

## Testing

- Add unit test for `generateTask` function
- Add integration test for `/send-message` endpoint
- **Update existing test** `api/src/tests/routes/send-message.test.ts` to reflect new response structure (`{ data: { task: Task, reply: string } }` instead of flat Task object)