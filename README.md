# Laurentina

[![Build](https://img.shields.io/github/actions/workflow/status/TEGRAXD/laurentina/tests.yml)](https://github.com/TEGRAXD/laurentina)
[![Version](https://img.shields.io/badge/version-1.0.4-blue)](https://www.npmjs.com/package/laurentina)
[![Github Stars](https://img.shields.io/github/stars/TEGRAXD/Laurentina?style=flat-square)](https://github.com/TEGRAXD/laurentina)
[![License](https://img.shields.io/github/license/TEGRAXD/laurentina)](https://github.com/TEGRAXD/laurentina?tab=readme-ov-file#license)

Laurentina is Audio Controller and Queue Wrapper for Shoukaku and Discord.js to Manage Music Playback.

![](static/laurentina.png)
> © Arknights

## Features
### Audio controller and Queue Wrapper
- Play
- Search
- Add to queue
- Skip
- Pause
- Resume
- Stop
- Loop
- Get Queue
- Clear Queue

## Download
Get the latest package from [NPM](https://www.npmjs.com/package/laurentina).

## Version
1.0.4

## Usage
- Binding Laurentina
```js
import { Client, Message } from "discord.js";
import { Shoukaku, Connectors } from "shoukaku";
import { Laurentina } from "laurentina";

const nodes = [
    {
        "name": "Node 1",
        "url": "localhost:2333",
        "auth": "the_unchained",
    }
];

const client = new Client({
    intents: [
        // ...
    ]
});

const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes);
const laurentina = new Laurentina(client, shoukaku, nodes);

// Bind shoukaku and laurentina to client
client.shoukaku = shoukaku;
client.laurentina = laurentina;

client.login("token");
```

- Play a song
```js
let controller = client.laurentina.getController("guildID");

if (!controller) {
    controller = await client.laurentina.join(
        "guildID",
        "voiceChannelID", // Voice channel where the user connected
        "textChannelID", // Text channel where the command sent
    ),
}

const result = await controller.search("scsearch", "Gojimaji-P - おちゃめ機能");

if (!result?.length) return;

const track = result.shift();

await controller.play(track);
```

- Add to Queue (Auto)
```js
let controller = client.laurentina.getController("guildID");

if (!controller) return;

const result = await controller.search("ytsearch", "Kobo Kanaeru - Entah");

if (!result?.length) return;

const track_one = result.shift();
const track_two = result.shift();

controller.play(track_one);

// Calling `play` multiple time will automatically add it to queue
controller.play(track_two);
```

- Add to Queue (Manual)
```js
let controller = client.laurentina.getController("guildID");

if (!controller) return;

const result = await controller.search("ytseach", "Roshidere - Kawaikute gomen");

if (!result?.length) return;

const track = result.shift();

controller.add(track);
```

- Skip
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

await controller.skip();
```

- Pause
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

controller.pause();
```

- Resume
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

controller.resume();
```

- Stop
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

controller.stop();
```

- Loop
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

const loopMode = controller.toggleLoop();
```

- Shuffle
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

const shuffleMode = controller.toggleShuffle();
```

- Get Queue
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

const queue = controller.getQueue();
```

- Clear Queue
```js
const controller = client.laurentina.getController("guildID");

if (!controller) return;

controller.clearQueue();
```

## Contributor
```
TEGRAXD - Tegar B. Suganda
```

## License
```
MIT License

Copyright (c) 2024 TEGRAXD

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```