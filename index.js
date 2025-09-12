import { Client, Databases, Query, Messaging } from "node-appwrite";

export default async function main(req, res) {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  // Set up Databases and Messaging using env variables
  const databases = new Databases(client);
  const messaging = new Messaging(client);

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID;
 
  try {
    // 1️⃣ Fetch today’s medicines from DB
    const today = new Date();
    const todayDate = today.toISOString().split("T")[0]; // yyyy-mm-dd

    const medicines = await databases.listDocuments(
      databaseId,
      collectionId,
      [Query.equal("date", todayDate)]
    );

    // 2️⃣ Loop through medicines and send reminders
    for (const med of medicines.documents) {
      const userEmail = med.userEmail;
      const medName = med.medicine;
      const medTime = med.time;
      console.log("Checking medicine:", med.medicine, med.time, med.userEmail);

      await messaging.createEmail({
        // If messagingId is needed, add it here
        // messagingId,
        subject: "💊 Medicine Reminder",
        content: `Hello! This is a reminder to take your medicine: ${medName} at ${medTime}.`,
        recipients: [userEmail],
      });
    }

    res.json({ success: true, sent: medicines.documents.length });
  } catch (err) {
    console.error("Reminder error:", err);
    res.json({ success: false, error: err.message });
  }
}