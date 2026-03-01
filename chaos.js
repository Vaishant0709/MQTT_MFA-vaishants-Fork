import { exec } from 'child_process';
import path from 'path';

console.log('\x1b[31m==================================================\x1b[0m');
console.log('\x1b[31m🔥  CHAOS MONKEY STARTED - SIMULATING ATTACKS  🔥\x1b[0m');
console.log('\x1b[31m==================================================\x1b[0m');

const ATTACKS = [
    'attacks/tamper.js',
    'attacks/replay.js',
    'attacks/flood.js',
    'attacks/rogue.js',
    'attacks/brute.js'
];

function runRandomAttack() {
    // 1. Pick random attack
    const attackScript = ATTACKS[Math.floor(Math.random() * ATTACKS.length)];
    
    console.log(`\n\x1b[33m🎲 [CHAOS] Next Attack: ${attackScript}...\x1b[0m`);

    // 2. Execute it
    exec(`node ${attackScript}`, (error, stdout, stderr) => {
        if (stdout) console.log(stdout.trim());
        if (stderr) console.error(stderr.trim());
        
        // 3. Schedule next attack (Random time between 5s and 10s)
        const delay = 5000 + Math.random() * 5000;
        console.log(`\x1b[34m💤 [CHAOS] Cooling down for ${(delay/1000).toFixed(1)}s...\x1b[0m`);
        
        setTimeout(runRandomAttack, delay);
    });
}

// Start the loop
runRandomAttack();