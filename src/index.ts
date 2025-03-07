import { EventEmitter } from "events";
import * as discord from "discord.js";
import shoukaku from "shoukaku";
import { LavalinkNode } from "./types/lavalink_node";

enum PlaybackState {
    PLAYING = "playing",
    PAUSED = "paused",
    STOPPED = "stopped",
}

enum LoopMode {
    NONE = "none",
    SINGLE = "single",
    QUEUE = "queue",
}

enum ShuffleMode {
    OFF = "off",
    ON = "on",
}

class AudioController extends EventEmitter {
    private shoukaku: shoukaku.Shoukaku;
    player: shoukaku.Player;
    guildID: discord.Snowflake;
    channelID: discord.Snowflake;
    textChannel: discord.Snowflake;
    private queue: shoukaku.Track[];
    state: PlaybackState;
    currentTrack: shoukaku.Track | null;
    loop: LoopMode;
    shuffle: ShuffleMode;
    private timeout: NodeJS.Timeout | null;

    constructor(
        shoukaku: shoukaku.Shoukaku,
        player: shoukaku.Player,
        guildID: discord.Snowflake,
        channelID: discord.Snowflake,
        textChannelID: discord.Snowflake
    ) {
        super();

        this.shoukaku = shoukaku;
        this.player = player;
        this.guildID = guildID;
        this.channelID = channelID;
        this.textChannel = textChannelID;
        this.queue = [];
        this.state = PlaybackState.STOPPED;
        this.currentTrack = null;
        this.loop = LoopMode.NONE;
        this.shuffle = ShuffleMode.OFF;
        this.timeout = null;

        this.startTimer();
    }

    /**
     * Play a track or add a track to the queue
     * @param track The track to play
     * @returns Promised<void>
     */
    async play(
        track: shoukaku.Track,
        playCallback?: (track: shoukaku.Track) => Promise<void>,
        addToQueueCallback?: (track: shoukaku.Track) => Promise<void>
    ): Promise<void> {
        if (!this.player) {
            throw new Error("No player available");
        }

        this.add(track, addToQueueCallback);

        if (this.state === PlaybackState.STOPPED) {
            await this.playNext(playCallback);
        }
    }

    /**
     * Play the next track in the queue
     * @returns Promise<void>
     */
    private async playNext(callback?: (track: shoukaku.Track) => Promise<void>): Promise<void> {
        if (!this.player) {
            this.state = PlaybackState.STOPPED;
            throw new Error("No player available");
        }

        let next = null;

        if (this.shuffle === ShuffleMode.ON) {
            next = this.queue.splice(Math.floor(Math.random() * this.queue.length), 1).shift();
        } else {
            next = this.queue.shift();
        }

        if (!next) {
            this.state = PlaybackState.STOPPED;
            this.currentTrack = null;
            this.startTimer();
            return;
        }

        this.state = PlaybackState.PLAYING;
        this.currentTrack = next;

        this.clearTimer();

        try {
            await this.player.playTrack({ track: { encoded: this.currentTrack.encoded } })

            if (callback) await callback(this.currentTrack);

            this.player.once("end", async () => {
                switch (this.loop) {
                    case LoopMode.NONE:
                        break;
                    case LoopMode.SINGLE:
                        if (!this.currentTrack) return;
                        this.queue.unshift(this.currentTrack);
                        break;
                    case LoopMode.QUEUE:
                        if (!this.currentTrack) return;
                        this.queue.push(this.currentTrack);
                        break;
                }

                await this.playNext(callback);
            });
        } catch (error) {
            console.error(error);
            this.state = PlaybackState.STOPPED;
            this.currentTrack = null;
            await this.playNext();
        }
    }

    /**
     * Search for a track
     * @param source The source to search from (e.g. ytsearch, scsearch, etc.)
     * @param query The query to search for
     * @returns Promise<shoukaku.Track[] | null>
     */
    async search(source: string = "scsearch", query: string, limit: number = 10): Promise<shoukaku.Track[] | null> {
        if (limit > 19) throw new Error("Limit cannot be more than 19");

        if (!this.player) {
            throw new Error("No player available");
        }

        if (query.trim().length === 0) {
            return null;
        }

        const res = await this.player.node.rest.resolve(`${source}: ${query}`);

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
                return res.data.slice(0, limit);
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
     * Add a track to the queue
     * @param track The track to add to the queue
     * @returns void
     */
    add(track: shoukaku.Track, callback?: (track: shoukaku.Track) => Promise<void>): void {
        this.queue.push(track);

        if (callback) callback(track);
    }

    /**
     * Skip the current track
     * @returns void
     */
    async skip(callback?: (track: shoukaku.Track) => Promise<void>): Promise<void> {
        if (this.player) {
            this.state = PlaybackState.STOPPED;
            this.player.stopTrack();

            if (callback && this.currentTrack) await callback(this.currentTrack);

            this.currentTrack = null;

            await this.playNext();
        }
    }

    /**
     * Pause the current track
     * @returns void
     */
    pause() {
        if (this.state == PlaybackState.PLAYING && this.player) {
            this.state = PlaybackState.PAUSED;
            this.player.setPaused(true);
        }
    }

    /**
     * Resume the current track
     * @returns void
     */
    resume() {
        if (this.state == PlaybackState.PAUSED && this.player) {
            this.state = PlaybackState.PLAYING;
            this.player.setPaused(false);
        }
    }

    /**
     * Stop the player
     * @returns void
     */
    stop() {
        if (this.player) {
            this.loop = LoopMode.NONE;
            this.shuffle = ShuffleMode.OFF;
            this.state = PlaybackState.STOPPED;
            this.player.stopTrack();
            this.queue = [];
        }
    }

    /**
     * Set the loop mode
     * @param mode The loop mode to set
     * @returns LoopMode
     */
    setLoop(mode: LoopMode): LoopMode {
        this.loop = mode;
        return this.loop;
    }

    /**
     * Toggle the loop mode
     * @returns void
     */
    toggleLoop(): LoopMode {
        switch (this.loop) {
            case LoopMode.NONE:
                this.loop = LoopMode.SINGLE;
                break;
            case LoopMode.SINGLE:
                this.loop = LoopMode.QUEUE;
                break;
            case LoopMode.QUEUE:
                this.loop = LoopMode.NONE;
                break;
        }

        return this.loop;
    }

    /**
     * Set the shuffle mode
     * @param mode The shuffle mode to set
     * @returns ShuffleMode
     */
    setShuffle(mode: ShuffleMode): ShuffleMode {
        this.shuffle = mode;
        return this.shuffle;
    }

    /**
     * Toggle the shuffle mode
     * @returns void
     */
    toggleShuffle(): ShuffleMode {
        switch (this.shuffle) {
            case ShuffleMode.OFF:
                this.shuffle = ShuffleMode.ON;
                break;
            case ShuffleMode.ON:
                this.shuffle = ShuffleMode.OFF;
                break;
        }

        return this.shuffle;
    }

    /**
     * Get the current queue
     * @returns shoukaku.Track[]
     */
    getQueue() {
        return this.queue;
    }

    /**
     * Clear the queue
     * @returns void
     */
    clearQueue() {
        this.queue = [];
    }

    /**
     * start the timer to leave the voice channel after 5 minutes of inactivity
     * @returns void
     */
    private startTimer() {
        if (this.timeout) return;

        this.timeout = setTimeout(() => this.leaveChannel(), 5 * 60 * 1000);
    }

    /**
     * Clear the timer
     * @returns void
     */
    private clearTimer() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }

    /**
     * Leave the voice channel
     * @returns void
     */
    private async leaveChannel() {
        this.clearTimer();
        await this.shoukaku.leaveVoiceChannel(this.guildID);
    }
}

class Laurentina {
    shoukaku: shoukaku.Shoukaku;
    private audioController: Map<string, AudioController>;
    constructor(shoukaku: shoukaku.Shoukaku, lavalinkNodes: LavalinkNode[]) {
        this.shoukaku = shoukaku;
        this.audioController = new Map<string, AudioController>();
    }

    async join(
        guildID?: discord.Snowflake,
        voiceChannelID?: discord.Snowflake,
        textChannelID?: discord.Snowflake,
        deaf?: boolean
    ): Promise<AudioController> {
        if (!guildID) throw new Error("Guild ID is required");
        if (!voiceChannelID) throw new Error("Voice Channel ID is required");
        if (!textChannelID) throw new Error("Text Channel ID is required");

        let player = this.shoukaku.players.get(guildID);

        if (!player) {
            player = await this.shoukaku.joinVoiceChannel({
                guildId: guildID,
                channelId: voiceChannelID,
                shardId: 0,
                deaf: deaf ?? false,
            });
        }

        let controller = this.getController(guildID);

        if (!controller) {
            controller = new AudioController(this.shoukaku, player, guildID, voiceChannelID, textChannelID);
            this.audioController.set(guildID, controller);
        }

        return controller;
    }

    getController(guildID: discord.Snowflake): AudioController | undefined {
        return this.audioController.get(guildID);
    }

    removeController(guildID: discord.Snowflake): boolean {
        return this.audioController.delete(guildID);
    }

    async leave(guildID: discord.Snowflake) {
        const queue = this.getController(guildID);

        if (queue) this.removeController(guildID);

        await this.shoukaku.leaveVoiceChannel(guildID);
    }
}

export * from "./types/track";

export { Laurentina, AudioController, PlaybackState, LoopMode, ShuffleMode };
