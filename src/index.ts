import { EventEmitter, once } from "events";
import discord from "discord.js";
import shoukaku from "shoukaku";
import { LavalinkNode } from "./types/lavalink-node";

class AudioSession extends EventEmitter {
    guildID: discord.Snowflake;
    channelID: discord.Snowflake;
    textChannel: discord.GuildTextBasedChannel | discord.TextBasedChannel;
    queue: shoukaku.Track[];
    playing: boolean;
    currentTrack: shoukaku.Track | null;
    player: shoukaku.Player;
    loop: "none" | "single" | "queue";

    constructor(
        player: shoukaku.Player,
        guildID: discord.Snowflake,
        channelID: discord.Snowflake,
        textChannel: discord.GuildTextBasedChannel | discord.TextBasedChannel
    ) {
        super();

        this.guildID = guildID;
        this.channelID = channelID;
        this.textChannel = textChannel;
        this.queue = [];
        this.playing = false;
        this.currentTrack = null;
        this.player = player;
        this.loop = "none";
    }

    /**
     *
     * @param track The track to play
     * @returns Promised<void>
     */
    async play(track: shoukaku.Track): Promise<void> {
        if (!this.player) {
            throw new Error("No player available");
        }

        this.add(track);

        if (!this.playing) await this.playNext();
    }

    /**
     *
     * @returns Promise<void>
     */
    private async playNext(): Promise<void> {
        if (!this.player) {
            this.playing = false;
            throw new Error("No player available");
        }

        const next = this.queue.shift();

        if (!next) {
            this.playing = false;
            this.currentTrack = null;
            return;
        }

        this.playing = true;
        this.currentTrack = next;

        try {
            await this.player.playTrack({ track: this.currentTrack.encoded });

            this.player.once("end", async () => {
                switch (this.loop) {
                    case "none":
                        break;
                    case "single":
                        if (!this.currentTrack) return;
                        this.queue.unshift(this.currentTrack);
                        break;
                    case "queue":
                        if (!this.currentTrack) return;
                        this.queue.push(this.currentTrack);
                        break;
                }
            });

            await this.playNext();
        } catch (error) {
            console.error(error);
            this.currentTrack = null;
            await this.playNext(); // Move to the next track in case of error
        }
    }

    /**
     *
     * @param source The source to search from (e.g. ytsearch, scsearch, etc.)
     * @param query The query to search for
     * @returns Promise<shoukaku.Track[] | null>
     */
    async search(source: string = "scsearch", query: string): Promise<shoukaku.Track[] | null> {
        if (!this.player) {
            throw new Error("No player available");
        }

        const res = await this.player?.node.rest.resolve(`${source}: ${query}`);

        if (!res) {
            return null;
        }

        switch (res?.loadType) {
            case "empty": {
                return [];
            }
            case "track": {
                return [res.data];
            }
            case "search": {
                return res.data;
            }
            case "playlist": {
                return null;
            }
            case "error": {
                console.error(`An error occurred: ${res.data.message}`);
                return null;
            }
            default: {
                return null;
            }
        }
    }

    /**
     *
     * @param track The track to add to the queue
     * @returns void
     */
    add(track: shoukaku.Track): void {
        console.log("[Pushing track to queue]");
        this.queue.push(track);
        console.log(this.queue.map((t) => t.info.title));
        // console.log(this.queue.length);
    }

    skip() {
        if (this.player) {
            this.player.stopTrack();
        }
    }

    pause() {
        if (this.player) {
            this.player.setPaused(true);
        }
    }

    resume() {
        if (this.player) {
            this.player.setPaused(false);
        }
    }

    stop() {
        if (this.player) {
            this.player.stopTrack();
        }
    }

    toggleLoop() {
        switch (this.loop) {
            case "none":
                this.loop = "single";
                break;
            case "single":
                this.loop = "queue";
                break;
            case "queue":
                this.loop = "none";
                break;
        }
    }

    getQueue() {
        return this.queue;
    }
}

class Laurentina {
    client: discord.Client;
    shoukaku: shoukaku.Shoukaku;
    audioSessions: Map<string, AudioSession>;
    constructor(client: discord.Client, shoukaku: shoukaku.Shoukaku, lavalinkNodes: LavalinkNode[]) {
        this.client = client;
        this.shoukaku = shoukaku;
        this.audioSessions = new Map<string, AudioSession>();
    }

    async join(
        guildID: discord.Snowflake,
        voiceChannelID: discord.Snowflake,
        textChannel: discord.GuildTextBasedChannel | discord.TextBasedChannel
    ): Promise<AudioSession> {
        let player = this.shoukaku.players.get(guildID);

        if (!player) {
            player = await this.shoukaku.joinVoiceChannel({
                guildId: guildID,
                channelId: voiceChannelID,
                shardId: 0,
                deaf: true,
            });
        }

        let queue = this.getQueue(guildID);

        if (!queue) {
            queue = new AudioSession(player, guildID, voiceChannelID, textChannel);
            this.audioSessions.set(guildID, queue);
        }

        return queue;
    }

    getQueue(guildID: discord.Snowflake): AudioSession | undefined {
        return this.audioSessions.get(guildID);
    }

    async leave(guildID: discord.Snowflake) {
        const queue = this.audioSessions.get(guildID);

        if (queue) this.audioSessions.delete(guildID);

        await this.shoukaku.leaveVoiceChannel(guildID);
    }
}

export { Laurentina };
