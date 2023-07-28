import ffmpeg from "fluent-ffmpeg"
import { Readable, Duplex, Writable } from "stream"

export function convertVideoToGif(data: Buffer): Promise<Buffer> {
    console.log("Converting video to GIF...")
    const chunks: Buffer[] = [];
    const output = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
        }
    });
    const cmd = ffmpeg()
        .input(Readable.from(data))
        .fps(25)
        .videoFilters([
            'fps=25',
            "scale='min(128\,iw):-1':flags=lanczos",
            'split[s0][s1]',
            '[s0]palettegen[p]',
            '[s1][p]paletteuse'
        ])
        .format("gif")
        .output(output)

    return new Promise((resolve, reject) => {
        cmd.on("end", () => {
            console.log("Video to GIF conversion completed!")
            resolve(Buffer.concat(chunks))
        })
        cmd.on("error", reject)
        cmd.run()
    });
}