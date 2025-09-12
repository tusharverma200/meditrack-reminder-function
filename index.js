import { Client, Databases, Messaging } from "node-appwrite";

export default async function main(req, res) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const messaging = new Messaging(client);

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID;

  try {
    // 1️⃣ Get all medicines
    const { documents } = await databases.listDocuments(databaseId, collectionId);

    const today = new Date();
    const todayDate = today.toDateString(); // e.g. "Fri Sep 12 2025"

    let sentCount = 0;

    for (const med of documents) {
      if (!med.userEmail) continue; // skip if email missing

      const medTime = new Date(med.time); // convert from string
      if (medTime.toDateString() === todayDate) {
        console.log("📨 Sending reminder to:", med.userEmail, med.name, med.time);

        await messaging.createEmail({
          subject: "💊 Medicine Reminder",
          content: `Hello! This is a reminder to take your medicine: ${med.name} at ${med.time}.`,
          recipients: [med.userEmail],
        });

        sentCount++;
      }
    }

    return res.json({ success: true, sent: sentCount });
  } catch (err) {
    console.error("Reminder error:", err);
    return res.json({ success: false, error: err.message });
  }
}
