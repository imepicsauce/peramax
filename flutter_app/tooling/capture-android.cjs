const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const [device, name = 'android-home'] = process.argv.slice(2);
if (!device || !/^[a-zA-Z0-9_-]+$/.test(name)) {
  throw new Error('Usage: node capture-android.cjs DEVICE_ID screenshot-name');
}
const output = path.join(__dirname, 'screenshots', name + '.png');
fs.mkdirSync(path.dirname(output), { recursive: true });
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
  (process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Android', 'Sdk')
    : path.join(os.homedir(), 'Android', 'Sdk'));
const capture = execFileSync(
  path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb'),
  ['-s', device, 'exec-out', 'screencap', '-p'],
  { maxBuffer: 20 * 1024 * 1024 },
);
fs.writeFileSync(output, capture);
console.log(output);
