# Express example

This example shows how to use [Express.js](https://expressjs.com/) as a server for bull-board.

# Usage

```
npm install
npm run start
```

Open: `http://localhost:3001` for the dashboard

How to populate the queue:

```bash
# Stop Bill User Job
for i in {1..100}; curl -X POST http://localhost:3000/stopBillUser -H "Content-Type: application/json" -d '{"policyId":1}'

# Send Email Job
for i in {1..100}; curl -X POST http://localhost:3000/sendEmail -H "Content-Type: application/json" -d '{"policyId":1}'
```