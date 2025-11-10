import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  ScanCommand,
  PutCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import dynamo from "../db/dynamoClient.js";

const router = express.Router();
const TABLE_NAME = process.env.TABLE_NAME;

// ✅ Helper to get current IST date object
const getISTDate = () => {
  const nowUTC = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 hours
  return new Date(nowUTC.getTime() + istOffset);
};

// ✅ Format date to YYYY-MM-DD in IST
const formatISTDate = (date) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// ✅ Format time to HH:mm in IST
const formatISTTime = (date) => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

// ✅ Generate 30-minute time slots between 9:00 and 17:00
const generateTimeSlots = () => {
  const slots = [];
  const start = 9 * 60; // 9:00 AM
  const end = 17 * 60; // 5:00 PM
  for (let t = start; t < end; t += 30) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
};

// ✅ Get all appointments
router.get("/", async (req, res) => {
  try {
    const data = await dynamo.send(new ScanCommand({ TableName: TABLE_NAME }));
    const sorted = data.Items.sort(
      (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get available slots for the week (Mon–Fri) in IST
router.get("/available", async (req, res) => {
  try {
    const nowIST = getISTDate();

    const appointments = await dynamo.send(
      new ScanCommand({ TableName: TABLE_NAME })
    );
    const booked = appointments.Items.map((a) => a.dateTime);

    const available = [];
    let addedDays = 0;
    let dayOffset = 0;

    const currentMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();
    const startOfDayMinutes = 9 * 60;
    const endOfDayMinutes = 17 * 60 + 30;

    while (addedDays < 5) {
      const date = new Date(nowIST);
      date.setDate(nowIST.getDate() + dayOffset);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dayStr = formatISTDate(date);
        const allSlots = generateTimeSlots();
        let validSlots = allSlots;

        // ✅ If it's today (in IST)
        if (dayStr === formatISTDate(nowIST)) {
          if (currentMinutes < startOfDayMinutes) {
            validSlots = allSlots;
          } else if (currentMinutes >= endOfDayMinutes) {
            dayOffset++;
            continue; // skip today entirely
          } else {
            validSlots = allSlots.filter((time) => {
              const [h, m] = time.split(":").map(Number);
              const slotMinutes = h * 60 + m;
              return slotMinutes > currentMinutes;
            });
          }
        }

        const slots = validSlots.map((time) => ({
          date: dayStr,
          time,
          available: !booked.includes(`${dayStr}T${time}`),
        }));

        available.push({ day: dayStr, slots });
        addedDays++;
      }

      dayOffset++;
    }

    res.json(available);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Create appointment (IST safe)
router.post("/", async (req, res) => {
  try {
    const { date, time, name, email, phone, reason } = req.body;
    if (!name || !email || !date || !time)
      return res.status(400).json({ error: "Missing required fields" });

    const dateTime = `${date}T${time}`;
    const nowIST = getISTDate();
    const bookingDate = new Date(`${date}T${time}:00+05:30`); // explicitly IST

    // Prevent past bookings (IST-based)
    if (bookingDate < nowIST)
      return res.status(400).json({ error: "Cannot book past times" });

    // Prevent double booking
    const existing = await dynamo.send(new ScanCommand({ TableName: TABLE_NAME }));
    if (existing.Items.some((a) => a.dateTime === dateTime))
      return res.status(400).json({ error: "Slot already booked" });

    const appointment = {
      id: uuidv4(),
      dateTime,
      name,
      email,
      phone,
      reason,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: appointment }));
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete appointment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await dynamo.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
    res.json({ message: "Appointment canceled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
