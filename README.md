# DN42 Looking Glass Telegram Bot
## Usage
1. Fill in your bot token in `.env` as the variable `TOKEN`.
2. Replace `@cowgl_dn42_bot|@cowgl` in `index.js` to `@[Your bot username`.
3. (Optional) Run `commands.js` on your other nodes and open port 65534.
4. Modify the `SERVERS` variable in `index.js`. Example:
```js
const SERVERS = {
  txg: { name: "TXG 🇹🇼", id: "txg" },
  tyo: { name: "TYO 🇯🇵", id: "tyo", url: "http://tyo.node.cowgl.xyz:65534/api/run" },
  lax: { name: "LAX 🇺🇸", id: "lax", url: "http://lax.node.cowgl.xyz:65534/api/run" },
  ams: { name: "AMS 🇳🇱", id: "ams", url: "http://ams.node.cowgl.xyz:65534/api/run" },
  tfu: { name: "TFU 🇨🇳", id: "tfu", url: "https://tfu-lg-proxy.charliemoomoo.workers.dev/api/run" }
}
```
Leave `url` empty if the node you are hosting the bot on.

5. `npm i`.
6. Run `index.js`.
