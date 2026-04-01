import crypto from 'crypto';

/**
 * Hashes an array of hashes together recursively to compute the Merkle Root.
 * Molds the basic properties typical of a blockchain ledger event tree.
 */
export function buildMerkleTree(eventHashes: string[]): string {
    if (eventHashes.length === 0) return crypto.createHash('sha256').update('EMPTY_TREE').digest('hex');
    
    let currentLevel = [...eventHashes];
    
    while (currentLevel.length > 1) {
        const nextLevel: string[] = [];
        
        for (let i = 0; i < currentLevel.length; i += 2) {
            const left = currentLevel[i];
            const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // duplicate if odd
            
            const combined = crypto.createHash('sha256').update(left + right).digest('hex');
            nextLevel.push(combined);
        }
        
        currentLevel = nextLevel;
    }
    
    return currentLevel[0];
}
