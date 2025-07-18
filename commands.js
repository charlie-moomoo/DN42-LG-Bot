const { exec } = require('child_process');
const whois = require('whois');

function sanitizeArgs(args) {
  const safePattern = /^[a-zA-Z0-9._: "\/-]+$/;
  return args.split("").filter(arg => safePattern.test(arg)).join("");
}

function execCommand(oCmd) {
  const cmd = sanitizeArgs(oCmd);
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return stdout?resolve(stdout):reject(stderr || err.message);
      resolve(stdout || stderr);
    });
  });
}

module.exports = {
  ping: (target) => execCommand(`ping -i 0.01 -c 4 -W 1 ${target}`),
  tcping: (host, port) => execCommand(`tcping -c 4 ${host} ${port}`),
  trace: (target) => execCommand(`traceroute -w 0.5 -N 100 ${target}`),
  route: (target) => execCommand(`sudo vtysh -c "show ${target.includes(":")?"ipv6":"ip"} route ${target}"`),
  path: (target) => execCommand(`sudo vtysh -c "show ${target.includes(":")?"ipv6":"ip"} bgp ${target}"`),
  whois: (query) => new Promise((resolve, reject) => {
    whois.lookup(query, { server: "whois.lantian.dn42" }, (err, data) => {
      if (err) return reject(err.message);
      resolve(data);
    });
  }),
  dig: (domain, type = 'A') => execCommand(`dig ${domain} ${type}`)
};

if (require.main === module) {
  const express = require('express');
  const app = express();
  const port = 65534;

  app.use(express.json());

  app.post('/api/run', async (req, res) => {
    const { command, args } = req.body;
    try {
      if (module.exports[command]) {
        const output = await module.exports[command](...args);
        res.type('text/plain').send(output);
      } else {
        res.status(400).send('Invalid command');
      }
    } catch (e) {
      res.status(500).send(e.toString());
    }
  });

  app.listen(port, () => console.log(`Runner API listening on port ${port}`));
}
