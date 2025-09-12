import { Client, Databases, Messaging } from "node-appwrite";

export default async function main(context) {
  const { res, log, error } = context;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const messaging = new Messaging(client);

  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_COLLECTION_ID;

  try {
    const medicines = await databases.listDocuments(databaseId, collectionId);

    const now = new Date();
    const FIVE_MIN = 5 * 60 * 1000;

    let sentCount = 0;

    for (const med of medicines.documents) {
      const { name, dose, time, userEmail, user_id } = med;

      if (!userEmail || !user_id || !time) continue;

      const medDate = new Date(time);
      if (isNaN(medDate)) continue;

      const diff = medDate - now;

      // only if within next 5 min
      if (diff >= 0 && diff <= FIVE_MIN) {
        const formattedDate = medDate.toLocaleString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });

        const emailContent = `
Hello 👋,

This is your scheduled medicine reminder. Please take your medicine on time.

💊 Medicine: ${name}
💉 Dose: ${dose || "Not specified"}
🕒 Scheduled Time: ${formattedDate}

Please make sure to take it on time and stay healthy.

Regards,  
💚 Your Medicine Reminder Service
        `.trim();

        const message = await messaging.createEmail(
          `med-reminder-${Date.now()}`,
          "💊 Medicine Reminder",
          emailContent,
          [],
          [user_id], // Appwrite user ID
          [],
          [],
          [],
          [],
          false,
          false
        );

        log(`Sent reminder to ${userEmail}:`, message.$id);
        sentCount++;
      }
    }

    return res.json({ success: true, sent: sentCount });
  } catch (err) {
    error("Reminder error:", err);
    return res.json({ success: false, error: err.message });
  }
}
