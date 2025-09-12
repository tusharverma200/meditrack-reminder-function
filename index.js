import { Client, Databases, Query, Messaging } from "node-appwrite";

export default async function main(context) {
  const { req, res, log, error } = context;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_API_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const messaging = new Messaging(client);

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID;

  try {
    // 1️⃣ Fetch all medicines from DB
    const medicines = await databases.listDocuments(
      databaseId,
      collectionId
    );

    // 2️⃣ Loop through medicines and send reminders
    for (const med of medicines.documents) {
      const userEmail = med.userEmail;
      const medName = med.name;
      const medTime = med.time;

      log(`Checking medicine: ${medName}, ${medTime}, ${userEmail}`);

      if (!userEmail) continue;

      await messaging.createEmail({
        subject: "💊 Medicine Reminder",
        content: `Hello! This is a reminder to take your medicine: ${medName} at ${medTime}.`,
        recipients: [userEmail],
      });
    }

    return res.json({ success: true, sent: medicines.documents.length });
  } catch (err) {
    error("Reminder error:", err);
    return res.json({ success: false, error: err.message });
  }
}
