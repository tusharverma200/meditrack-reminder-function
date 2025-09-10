import { Client, Databases, Users, Messaging, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || "https://cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const users = new Users(client);
  const messaging = new Messaging(client);

  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID;

  try {
    // ✅ Step 1: Find medicines scheduled for the next 10 minutes
    const now = new Date();
    const in10 = new Date(now.getTime() + 10 * 60 * 1000);

    const medicines = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.greaterEqual("time", now.toISOString()),
      Query.lessEqual("time", in10.toISOString()),
    ]);

    if (medicines.total === 0) {
      log("No reminders found in this interval.");
      return res.json({ message: "No reminders to send." });
    }

    log(`Found ${medicines.total} medicines needing reminders.`);

    // ✅ Step 2: For each medicine, get the user & send email
    for (const med of medicines.documents) {
      try {
        const user = await users.get(med.$permissions[0].split(":")[1]); 
        // assumes Role.user($id) is set in permissions

        if (!user.email) continue;

        await messaging.createEmail(
          ID.unique(),
          {
            to: [user.email],
            subject: `💊 Reminder: ${med.name}`,
            text: `Hello, this is your reminder to take ${med.name} (${med.dose}) at ${new Date(med.time).toLocaleString()}.`,
          }
        );

        log(`Reminder sent to ${user.email} for ${med.name}`);
      } catch (err) {
        error(`Failed to send reminder for medicine ${med.name}: ${err.message}`);
      }
    }

    return res.json({ message: "Reminders processed." });
  } catch (err) {
    error("Error running reminder function: " + err.message);
    return res.json({ error: err.message }, 500);
  }
};
