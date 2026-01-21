# Exercise 2 - n8n

Technical interview exercise on n8n for UMI candidates

## Getting Started – Install n8n Locally

Install n8n globally:

```bash
npm install -g n8n
```

Start n8n:

```bash
npx n8n
```

n8n will be available at:

```
http://localhost:5678
```

## Overview

This technical exercise simulates a real-world problem you could encounter at UMI

The goal is **not** to deliver a production-ready system, but to evaluate how you:

* reason about automation workflows
* structure and process data
* document and explain technical decisions

We care more about **clarity and trade-offs** than completeness

## Expected Outcome

At the end of this exercise, you should provide:

* one or more **n8n workflows**
* exported as **JSON**
* saved in the repository under:

  ```
  src/workflow1.json
  src/workflow2.json
  ...
  ```
* written instructions explaining:

  * how the workflows are organized
  * how to install and run the database
  * how the data is structured

You do **not** need to deploy anything
We will review the workflow logic, the JSON export, and your explanations during the interview debrief

---

## Interview Exercise – UMI Marketing Automation

### Context

You just joined **UMI** as an automation engineer

The **marketing team** is launching a new internal product used to manage and enrich technical articles written by users
These articles will later be reused for:

* newsletters
* marketing campaigns
* AI-powered content features

Your task is to design the **first automation workflows** for this product

### Product Story

* UMI has **users** who can create and update **articles**
* Users are generated from the **Random User API** (`randomuser.me`)

* Each user has:
  * a name
  * a password

* Users can:
  * create articles
  * update their own articles
  * mark articles as favorites

All articles are created and managed internally by users

### Step 1 – Users Creation & Authentication Workflow

Design workflows that:

* fetch users from `randomuser.me`
* extract relevant fields
* prepare user data for storage
* avoid creating duplicate users
* implement a login endpoint that authenticates users based on their credentials (email and password)
* validate user credentials securely
* return an authentication token or session identifier upon successful login
* handle authentication failures appropriately

**⚠️ Security Considerations:**

When implementing authentication, be mindful of security best practices. Consider how you'll protect against common vulnerabilities and ensure sensitive data is handled appropriately. Document your security decisions and explain any trade-offs you make.


### Step 2 – Articles Management Workflow

Design a workflow that simulates:

* article creation by users
* article updates
* association between users and articles

Articles should contain:

* a title
* a body/content
* metadata you find relevant

### Step 3 – Favorites Logic

Design a simple workflow or logic that allows:

* a user to mark an article as favorite
* retrieval of a user's favorite articles

### Step 4 – Database & Data Modeling

You may use **any database** you want

We expect:

* a clear explanation of how data is structured
* how users, articles, and favorites relate
* how updates are handled
* how duplicates are avoided

You do **not** need to provide full SQL schemas unless you want to
Clear instructions and reasoning are enough

---

## Expected Output

### Testing Workflows with curl

Once your workflows are set up and running in n8n, you can test them using the following curl commands:

#### Step 1 – Users Creation & Authentication Workflow

Trigger the users creation workflow:

```bash
curl -X POST http://localhost:5678/webhook-test/users/create
```

Authenticate a user:

```bash
curl -X POST http://localhost:5678/webhook-test/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "userpassword123"
  }'
```

Expected response on success:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-123",
}
```

Expected response on failure:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### Step 2 – Articles Management Workflow

Create a new article:

```bash
curl -X POST http://localhost:5678/webhook-test/articles/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "title": "My First Article",
    "body": "This is the content of my article."
    ...
  }'
```

Update an existing article:

```bash
curl -X PUT http://localhost:5678/webhook-test/articles/update \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-456",
    "userId": "user-123",
    "title": "Updated Article Title",
    "body": "Updated content here."
    ...
  }'
```

#### Step 3 – Favorites Logic

Mark an article as favorite:

```bash
curl -X POST http://localhost:5678/webhook-test/favorites/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "articleId": "article-456"
  }'
```

Retrieve a user's favorite articles:

```bash
curl -X GET "http://localhost:5678/webhook-test/favorites/user-123"
```

---

## Documentation

Provide a short explanation covering:

* how the workflows are organized
* key technical decisions
* assumptions and trade-offs
* limitations of your approach
* what you would improve in a real production setup

## Evaluation Criteria

During the interview debrief, we will focus on:

* workflow clarity and logic
* understanding of automation concepts
* data modeling and relationships
* security awareness and implementation
* ability to explain and defend decisions
* LLMs knowledge and how you would use them in the exercise

## Final Note

There is no single "correct" solution

This exercise is a **discussion starter**
If something is debatable, **make a choice and explain it**

**Note:** You are free to bring the exercise further if you want
