# arca.live emote bot

A discord bot to pull random emoji packs from arca.live every 24 hours.  

## What?

Every 24 hours, the bot will scrape https://arca.live/e/ for emojis and upload them to the configured discord server.  
It will only consider emoji packs from the top 25% sorted by sales, and choose emojis from at least 10 different packs.  
It will first delete any emojis from the discord that start with "arca_", then determine how many emojis it needs to fill all static and animated emote slots.  
I didn't bother to amke most things configurable since I made this bot for myself and it should be easy enough to just edit the parameters in the code.

## Why?

I had the need for daily random korean emotes. Some of them are actually good.

## How?

If, for whatever reason, you also want daily scrambled korean emotes, just
- create a discord bot application [here](https://discord.com/developers/applications)
- put the bot in the .env file
- put your servers id in the .env file
- start the bot using `npm start`  

It will then run every day at midnight (Timezone Europe/Berlin).

## Not working

Make sure the bot has permissions to create and manage emotes.  
Uploading emotes may take a long time. The upload emoji ratelimit will cause it to pause for a long time after uploading 50 emojis.  
Some animated emojis will simply be skipped because they were too large, leading to empty emoji slots.