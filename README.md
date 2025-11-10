# 🩺 Appointment Booking API

A lightweight **serverless backend** built with **Node.js, Express, and AWS DynamoDB**, designed for **appointment scheduling** with time zone awareness for **Indian Standard Time (IST)**.  
It provides RESTful APIs for managing appointment slots, viewing available times, and handling bookings or cancellations.

---

## 🚀 Features

- 📅 **View available slots** (auto-calculated for the next 5 working days, Monday–Friday)
- 🕒 **IST-based scheduling logic** (auto-syncs with current time in India)
- ⚡ **Serverless-ready** — deployable on AWS Lambda
- 💾 **AWS DynamoDB** as the primary NoSQL database
- 🔄 **Automatic prevention** of double booking or past-time appointments
- 🌐 **Express.js REST API** with CORS support

---

## 🏗️ Project Structure

```
backend/
├── db/
│   └── dynamoClient.js       # DynamoDB client configuration
├── routes/
│   └── appointments.js       # Appointment routes (CRUD + slot management)
├── server.js                 # Main Express/Lambda server entry point
├── .env                      # Environment variables (ignored in git)
└── package.json
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory and define the following:

```bash
# AWS configuration
AWS_REGION=ap-south-1

# DynamoDB table name
TABLE_NAME=appointments

# Server configuration
PORT=5000
NODE_ENV=development
```

> 📝 **Note:**  
> Credentials are automatically loaded from `~/.aws/credentials`.  
> Ensure your AWS CLI or environment is configured with proper IAM permissions for DynamoDB.

---

## 🪣 AWS DynamoDB Setup

Before running the project, create a **DynamoDB table** with the following settings:

| Field Name | Type   | Key Type |
|-------------|--------|----------|
| id          | String | Primary Key |

**Table Name:** `appointments`

Region can be customized using the `.env` variable `AWS_REGION`.

---

## 💻 Local Development Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/appointment-booking.git
cd appointment-booking
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment

Create `.env` file as mentioned above.

### 4️⃣ Run the server locally

```bash
npm start
```

Your API will be running at:  
👉 `http://localhost:5000`

---

## 🧩 API Endpoints

### 🟢 **GET** `/api/appointments`
Fetch all booked appointments.

### 🟢 **GET** `/api/appointments/available`
Fetch available time slots (Mon–Fri, 9 AM – 5 PM IST).

### 🟡 **POST** `/api/appointments`
Create a new appointment.

**Body Example:**
```json
{
  "date": "2025-11-11",
  "time": "09:30",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "reason": "Consultation"
}
```

### 🔴 **DELETE** `/api/appointments/:id`
Cancel an appointment by ID.

---

## 🌍 Serverless Deployment (AWS Lambda)

The project is **Lambda-ready** using the `serverless-http` package.

### Handler
Exported from `server.js`:
```js
export const handler = serverless(app);
```

### Deployment Steps (Example)
1. Zip your project or use AWS SAM / Serverless Framework.
2. Deploy to AWS Lambda.
3. Configure API Gateway to trigger the Lambda function.

---

## 🧠 Technical Highlights

- Uses **AWS SDK v3** (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`)
- Manages time zone accuracy with **Asia/Kolkata**
- Generates **30-minute** slots dynamically between **9:00 AM – 5:00 PM**
- Automatically **skips weekends**
- Intelligent logic to **skip passed time slots** if the current time is beyond working hours

---

## 🧰 Scripts

| Command | Description |
|----------|--------------|
| `npm start` | Run locally with Nodemon |
| `npm test` | Placeholder for test command |

---

## 👨‍💻 Author

**Developed by:** [Your Name]  
**Tech Stack:** Node.js · Express · AWS SDK v3 · DynamoDB · Serverless HTTP

---

## 📜 License

This project is licensed under the **ISC License**.

---

### 🩵 Example Output (Available Slots)
```json
[
  {
    "day": "2025-11-11",
    "slots": [
      { "date": "2025-11-11", "time": "09:00", "available": true },
      { "date": "2025-11-11", "time": "09:30", "available": false }
    ]
  }
]
```
