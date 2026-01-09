# Exercise 1 - JavaScript

Technical interview exercise on JavaScript for UMI candidates

## Getting Started

Install dependencies:
```bash
npm install
```

Run the application:
```bash
npm start
```

---

# Rate-Limited API Client – Technical Interview Test

## Overview

This exercise simulates a **real-world problem** you will encounter when integrating with third‑party APIs (payments, emails, SaaS tools, scraping, etc.)

The goal is not to test your knowledge of obscure algorithms, but to understand:

* How you structure async code
* How you reason about time, queues, and promises
* How clean, safe, and maintainable your solution is
* How you handle edge cases and failure modes

You are asked to implement a **rate-limited API client**

## The Problem

You are given a function `fetchFn` that performs an asynchronous operation (e.g. an API call)

That external API enforces **rate limits**:

* Only a certain number of requests can be executed
* Within a fixed time window

Your task is to build a wrapper that **enforces this rate limit**

### Parameters

* `fetchFn`: an async function returning a Promise
* `maxRequests`: maximum number of executions allowed
* `perMilliseconds`: time window for the rate limit

### Return Value

* A new function `limitedFetch`
* `limitedFetch(...args)` returns a Promise
* The Promise resolves or rejects exactly like `fetchFn`

## Expected Behavior

* No more than `maxRequests` executions happen within any window of `perMilliseconds`
* Extra calls are **queued**, not dropped
* Calls are executed **in order**
* Errors from `fetchFn` must be propagated

## Expected Output

```bash
result 1
result 2
(2 second delay)
result 3
result 4
(2 second delay)
result 5
```

See [main.ts](main.ts) for the boilerplate code

## Constraints

* ❌ No external libraries
* ✅ Must work in Node.js
* ✅ Preserve call order
* ✅ Avoid memory leaks
* ✅ Clean, readable, production-ready code

---

## Evaluation Criteria

We will evaluate:

* Correctness of rate limiting
* Async and Promise handling
* Code structure and readability
* Edge‑case handling
* Overall engineering judgment

This is **not** about writing the shortest solution
It's about writing something you would confidently deploy in production

Happy coding! 🎉
