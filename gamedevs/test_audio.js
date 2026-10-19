// Test script to verify Web Audio API procedural nature music
import { spawn } from 'node:child_process';

const testHtml = `
<!DOCTYPE html>
<html>
<head><title>Nature Audio Test</title></head>
<body>
<button id="btn">Play</button>
<script>
try {
  const AC = new (window.AudioContext || window.webkitAudioContext)();
  console.log('AudioContext initialized:', AC.state);
} catch (e) {
  console.error('AudioContext error:', e);
}
</script>
</body>
</html>
`;

import fs from 'node:fs';
fs.writeFileSync('c:/Users/krisn/Desktop/websss/gamedevs/test_audio.html', testHtml);
console.log('Test HTML created.');
