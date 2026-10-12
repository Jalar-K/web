# Starlight

## Files
- `index.html`: her page
- `answer.html`: the page you open to answer the quiz she writes for you
- `admin.html`: your dashboard
- `server/`: the Vercel API

## Edit the "Do you know me?" questions
Open `index.html` and search for `DO YOU KNOW ME`. It's near the top of the `<script>`.

```js
{ q:"What time do I actually fall asleep?", a:["Before 10","Around midnight","2am","Nobody knows"], c:2 },
```
- `q` is the question
- `a` holds the four choices
- `c` is the correct choice, counted from 0: first = 0, second = 1, third = 2, fourth = 3

You can add or delete whole lines. The question count and the score adjust on their own.

## One-time setup for "Now quiz me"
1. In Supabase, open **SQL Editor** and run `server/sql/her_quiz.sql`, then run `server/sql/her_quiz_names.sql`.
2. Redeploy the server on Vercel. Pushing to git does this for you.

How it works: she writes questions and taps **Save** to get a link, then shares it. Anyone who opens the link types a name first. That name is locked to their phone and can't be changed, and nobody else can use it. On her side, **Now quiz me** lists each person with their own score, their answers and their earlier tries. Your dashboard also shows the scores with names under **Her quiz for you**.

## Her messages
"Say something back" now sends straight to your dashboard under **Messages**. It no longer opens WhatsApp.

## Preview another time of day
Add `?hour=8` (any hour from 0 to 23) to the address to check how the page looks at that time.
