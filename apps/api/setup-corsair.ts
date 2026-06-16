import "dotenv/config";
import { setupCorsair } from "corsair";
import { corsair } from "./src/corsair/index";

async function main() {
  const result = await setupCorsair(corsair, {
    credentials: {
      gmail: {
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      googlecalendar: {
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  });
  console.log(result);
}

main().catch(console.error);
