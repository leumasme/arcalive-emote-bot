import { getEmotes } from "./arca";
import { cleanEmoteSlots, setEmotes } from "./discord";
import cron from "node-cron"


cron.schedule("0 0 0 * * *", async () => { // Run every day at midnight
    try {
        console.log("Running scheduled task");
        // Free up emote slots
        const slots = await cleanEmoteSlots();
    
        console.log("Deleted old emotes. Free slots:", slots)
    
        // Get arca emotes
        const emotes = await getEmotes(slots.staticFree, slots.animatedFree)
        // const emotes = await getEmotes(5, 5)
    
        await setEmotes([...emotes.staticEmotes, ...emotes.animatedEmotes])
        console.log("Completed!")
    } catch (e) {
        console.error(e)
    }
}, {
    // runOnInit: true, // Uncomment to run on startup
    timezone: "Europe/Berlin",
});