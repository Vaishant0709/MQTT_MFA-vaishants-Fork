import { spawn } from 'child_process';
import path from 'path';

// 1. Get the Target ID from the command line
const targetDeviceId = process.argv[2];

if (!targetDeviceId) {
    console.error('\x1b[31m❌ Error: You must provide the Publisher Device ID.\x1b[0m');
    console.log('\x1b[33mUsage: node chaos-monkey.js <publisher-id>\x1b[0m');
    process.exit(1);
}

// 2. Define the available attacks
const attacks = [
    { 
        name: 'TAMPERING ATTACK (Integrity)', 
        file: 'attacker-tamper.js', 
        args: [] 
    },
    { 
        name: 'REPLAY ATTACK (Timing)', 
        file: 'attacker-replay.js', 
        args: [] 
    },
    { 
        name: 'BRUTE FORCE ATTACK (Auth)', 
        file: 'attacker-brute.js', 
        args: [targetDeviceId] 
    }
];

console.log(`\x1b[35m🤖 CHAOS MONKEY STARTED. Targeting: ${targetDeviceId}\x1b[0m`);
console.log('\x1b[35m---------------------------------------------------\x1b[0m');

// 3. Function to run a single random attack
function runRandomAttack() {
    // A. Wait for a random interval (between 3s and 5s)
    const delay = Math.floor(Math.random() * 3000) + 2000;
    
    console.log(`\n\x1b[30m[CHAOS] Sleeping for ${(delay/1000).toFixed(1)}s before next attack...\x1b[0m`);

    setTimeout(() => {
        // B. Pick a random attack
        const selectedAttack = attacks[Math.floor(Math.random() * attacks.length)];
        
        console.log(`\n\x1b[31m🔥 [CHAOS] LAUNCHING: ${selectedAttack.name}\x1b[0m`);
        
        // C. Execute the attack script
        // We use 'inherit' so you see the attack's output in this terminal
        const attackProcess = spawn('node', [selectedAttack.file, ...selectedAttack.args], {
            stdio: 'inherit',
            shell: true
        });

        // D. When attack finishes, schedule the next one
        attackProcess.on('close', (code) => {
            console.log(`\x1b[32m✅ [CHAOS] Attack finished (Exit code: ${code}).\x1b[0m`);
            // Recursive call to keep the loop going
            runRandomAttack();
        });

    }, delay);
}

// Start the loop
runRandomAttack();