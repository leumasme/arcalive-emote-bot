import axios, { AxiosRequestConfig } from "axios";
import { parse } from "node-html-parser";
import { convertVideoToGif } from "./ffmpeg";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const delay = 4000;

const baseURL = "https://arca.live/";

const client = axios.create({
    baseURL,
    responseType: "text",
    timeout: 15000,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Referer": "https://arca.live/"
    },
    withCredentials: true,
})

async function get(url: string) {
    let attempt = 0;
    while (attempt++ < 3) {
        try {
            console.log("Getting " + url)
            var res = await client.get<string>(url);
            break
        } catch (e: any) {
            console.log("Failed to get", url, e.response?.data, e.message)
            await sleep(delay);
            continue
        }
    }
    if (attempt == 3) throw new Error("Failed to get " + url)
    if (!res!.data) console.log(res!)
    return parse(res!.data);
}

function isNonEmptyString(str: string | undefined): str is string {
    return typeof str == "string" && str != "";
}

function takeNRandomElements<T>(arr: T[], n: number) {
    if (arr.length <= n) return arr;
    const result = [];
    for (let i = 0; i < n; i++) {
        const index = Math.floor(Math.random() * arr.length);
        result.push(arr[index]);
        arr.splice(index, 1);
    }
    return result;
}

async function getPageCount() {
    const dom = await get("e/?p=9999999")

    const pageNums = dom.querySelectorAll(".page-link")
        .map(e => parseInt(e.innerText))
        .filter(e => !isNaN(e))

    // Get highest page number
    const maxPage = Math.max(...pageNums)
    return maxPage;
}

async function getRandomEmoteSetLinks(maxPage: number) {
    const pageNr = Math.floor(Math.random() * maxPage) + 1;
    let dom = await get(`e/?sort=rank&p=${pageNr}`)

    const links = dom.querySelectorAll(".emoticon-list > a")
        .map(e => e.getAttribute("href"))
        .filter(isNonEmptyString);

    if (links.length == 0) throw new Error("No emotes found on page " + pageNr);
    await sleep(delay);

    console.log("Selected page " + pageNr)
    const link = links[Math.floor(Math.random() * links.length)];

    dom = await get(link);

    console.log("Selected emote set " + link)
    const allEmotes = dom.querySelectorAll(".emoticons-wrapper img.emoticon, video.emoticon")
        .map(e => e.getAttribute("data-src") ?? e.getAttribute("src"))
        .filter(isNonEmptyString)
        .map(e => new URL(e, baseURL))

    const emotes = { static: [], animated: [] } as { static: URL[], animated: URL[] };
    for (const emote of allEmotes) {
        if (emote.pathname.endsWith(".mp4")) emotes.animated.push(emote);
        else emotes.static.push(emote);
    }

    return emotes;
}

async function loadEmote(url: URL): Promise<Buffer> {
    console.log("Loading emote from url...")
    const res = await client.get(url.toString(), { responseType: "arraybuffer" })

    if (!(res.data instanceof Buffer)) throw new Error("Expected Buffer, got " + res.data.constructor.name + " instead")

    let buffer = res.data;

    if (url.pathname.endsWith(".mp4")) {
        // Convert video to gif
        buffer = await convertVideoToGif(res.data)
    } else await sleep(200); // Short delay since this is just an image

    return buffer
}

export async function getEmotes(staticCount: number, animatedCount: number, targetSetCount = 10) {
    const pageCount = await getPageCount();
    console.log(`Found ${pageCount} pages of emotes`)
    await sleep(delay);
    const lastConsideredPage = Math.ceil(pageCount / 4);

    const staticPerSet = Math.ceil(staticCount / targetSetCount);
    const animatedPerSet = Math.ceil(animatedCount / targetSetCount);

    let staticEmotes: Buffer[] = [];
    let animatedEmotes: Buffer[] = [];
    while (staticEmotes.length < staticCount || animatedEmotes.length < animatedCount) {
        console.log("Selecting emote set...")
        const emotes = await getRandomEmoteSetLinks(lastConsideredPage);
        console.log(`Using emote set with ${emotes.static.length} static, ${emotes.animated.length} animated emotes`)

        emotes.static = takeNRandomElements(emotes.static, staticPerSet);
        emotes.animated = takeNRandomElements(emotes.animated, animatedPerSet);

        await sleep(delay);

        for (const emote of emotes.static) {
            if (staticEmotes.length >= staticCount) break;
            staticEmotes.push(await loadEmote(emote));
        }

        for (const emote of emotes.animated) {
            if (animatedEmotes.length >= animatedCount) break;
            animatedEmotes.push(await loadEmote(emote));
        }
        await sleep(delay);

        let missingStatic = staticCount - staticEmotes.length;
        let missingAnimated = animatedCount - animatedEmotes.length;
        console.log(`Exhausted emote set. Missing: ${missingStatic} static, ${missingAnimated} animated`)
    }

    return { staticEmotes, animatedEmotes };
}