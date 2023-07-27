import { cleanEmoteSlots } from "./discord";
import cron from "node-cron"


cron.schedule("0 0 0 * * *", async () => { // Run every day at midnight
    console.log("Running scheduled task");
    // Free up emote slots
    const slots = await cleanEmoteSlots();

    console.log(`Deleted old emotes. Free slots: ${slots}`)

    // Get arca emotes


}, {
    timezone: "Europe/Berlin"
});