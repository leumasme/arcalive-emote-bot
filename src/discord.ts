import { Client, GuildPremiumTier } from "discord.js"
import { config } from "dotenv";
config();

const bot = new Client({
    intents: ["Guilds", "GuildEmojisAndStickers"],
});

bot.on("ready", () => {
    console.log(`Logged in as ${bot.user?.tag}`);
})

if (!process.env.DISCORD_TOKEN) throw new Error("No discord token provided! Add `DISCORD_TOKEN` to .env file.");

bot.login(process.env.DISCORD_TOKEN);

async function waitReady() {
    while (!bot.isReady()) {
        console.log("Waiting for bot to be ready...");
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

async function getServer() {
    const server = bot.guilds.cache.get(process.env.DISCORD_SERVER_ID!);
    if (!server) throw new Error("Discord server not found! Is `DISCORD_SERVER_ID` set in .env file, and is the bot in the server?");
    return server;
}

const emojiSlotCounts = {
    [GuildPremiumTier.None]: 50,
    [GuildPremiumTier.Tier1]: 100,
    [GuildPremiumTier.Tier2]: 150,
    [GuildPremiumTier.Tier3]: 250,
}

/** @description Delete previous arca emotes and return free emote slot count */
export async function cleanEmoteSlots() {
    await waitReady();
    const server = await getServer();

    const slots = emojiSlotCounts[server.premiumTier];

    const emojis = server.emojis.cache

    let animatedCount = 0;
    let staticCount = 0;

    let proms = [];

    for (let [, emote] of emojis) {
        if (emote.name?.startsWith("arca_")) proms.push(emote.delete("Arca emote cleanup"));
        emote.animated ? animatedCount++ : staticCount++;
    }

    await Promise.all(proms);

    return { animatedFree: slots - animatedCount, staticFree: slots - staticCount };
}

export async function setEmotes(emojiAttachments: (Buffer | string)[]) {
    await waitReady();
    const server = await getServer();

    for (let attachment of emojiAttachments) {
        await server.emojis.create({
            attachment,
            name: `arca_${Math.random().toString(36).substring(7)}`, // TODO: more readable names
        })
    }
}

export { bot };