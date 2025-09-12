import { Client, Databases, Query } from "node-appwrite";
import nodemailer from "nodemailer";

export default async function main(req, res) {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Fetch documents with today's date
    const result = await databases.listDocuments({
      databaseId: process.env.APPWRITE_DATABASE_ID,
      collectionId: process.env.APPWRITE_COLLECTION_ID,
      queries: [Query.equal("date", today)],
    });

    const docs = result.documents;

    if (!docs || docs.length === 0) {
      console.log("No reminders for today");
      return res.json({ success: true, message: "No reminders today" });
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true if using port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email to each user
    for (const doc of docs) {
      await transporter.sendMail({
        from: `"Medicine Reminder" <${process.env.SMTP_USER}>`,
        to: doc.email, // ensure your collection has `email` field
        subject: "Your Medicine Reminder",
        text: `Hello ${doc.name},\n\nThis is your reminder to take your medicine: ${doc.medicine}.`,
      });
    }

    return res.json({ success: true, sent: docs.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
