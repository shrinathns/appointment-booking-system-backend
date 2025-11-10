import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import serverless from "serverless-http";
import appointmentsRouter from "./routes/appointments.js";

dotenv.config();

const app = express();

// Allow all origins for development
app.use(cors({ origin: "*" }));

// Parse incoming JSON
app.use(express.json());

// Register API routes
app.use("/api/appointments", appointmentsRouter);

// Root route
app.get("/", (req, res) => {
  res.send("Appointment Booking API is running...");
});

// AWS Lambda handler
export const handler = serverless(app);

// Local environment listener
if (process.env.NODE_ENV !== "lambda") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally at http://localhost:${PORT}`);
  });
}
