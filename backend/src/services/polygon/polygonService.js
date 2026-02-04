/**
 * Polygon Blockchain Service
 * Handles interaction with Polygon blockchain for audit logging
 * Stores only hashes on-chain, no personal data
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

/**
 * Polygon Network Configuration
 * Uses Polygon Mumbai testnet by default (can be changed to mainnet)
 */
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com';
const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY || '';
const POLYGON_CONTRACT_ADDRESS = process.env.POLYGON_CONTRACT_ADDRESS || '';

/**
 * Simple Audit Log Smart Contract ABI
 * Stores audit log hashes with event emission
 */
const AUDIT_LOG_ABI = [
    "function logHash(bytes32 hash, string memory eventType) public returns (bytes32)",
    "event AuditLog(bytes32 indexed hash, string indexed eventType, uint256 timestamp, address indexed logger)"
];

/**
 * Initialize Polygon provider and wallet
 */
function getProvider() {
    return new ethers.JsonRpcProvider(POLYGON_RPC_URL);
}

function getWallet() {
    if (!POLYGON_PRIVATE_KEY) {
        throw new Error('POLYGON_PRIVATE_KEY environment variable is required');
    }
    const provider = getProvider();
    return new ethers.Wallet(POLYGON_PRIVATE_KEY, provider);
}

/**
 * Get contract instance
 * If no contract address is provided, uses a simple transaction approach
 */
function getContract() {
    if (!POLYGON_CONTRACT_ADDRESS) {
        return null; // Use simple transaction approach
    }
    const wallet = getWallet();
    return new ethers.Contract(POLYGON_CONTRACT_ADDRESS, AUDIT_LOG_ABI, wallet);
}

/**
 * Create a hash from data
 * Removes any personal information before hashing
 * @param {Object} data - Data to hash (will be sanitized)
 * @returns {string} SHA-256 hash (hex string)
 */
function createHash(data) {
    // Remove personal information from data before hashing
    const sanitizedData = sanitizeData(data);
    
    // Convert to JSON string and hash
    const dataString = JSON.stringify(sanitizedData);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    return '0x' + hash;
}

/**
 * Sanitize data to remove personal information
 * Only keeps non-personal audit-relevant data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
function sanitizeData(data) {
    const sanitized = { ...data };
    
    // Remove personal information fields
    const personalFields = [
        'donorName', 'donor_name',
        'donorPhone', 'donor_phone',
        'donorEmail', 'donor_email',
        'phoneNumber', 'phone_number',
        'email',
        'name', // Keep only if it's organization name, not personal name
        'complaintText', 'complaint_text', // Keep complaint text for integrity, but could be removed if too personal
        'photoUrl', 'photo_url',
        'photoCid', 'photo_cid'
    ];
    
    personalFields.forEach(field => {
        if (sanitized[field] !== undefined) {
            delete sanitized[field];
        }
    });
    
    // For complaints, remove text content but keep structure
    if (sanitized.complaintText !== undefined) {
        // Optionally keep hash of complaint text instead
        // For now, we'll remove it entirely
        delete sanitized.complaintText;
    }
    if (sanitized.complaint_text !== undefined) {
        delete sanitized.complaint_text;
    }
    
    return sanitized;
}

/**
 * Store hash on Polygon blockchain
 * Uses contract if available, otherwise uses simple transaction
 * @param {string} hash - Hash to store (0x-prefixed hex string)
 * @param {string} eventType - Type of event (e.g., 'complaint_created', 'status_changed')
 * @returns {Promise<Object>} Transaction receipt with hash and block info
 */
async function storeHashOnChain(hash, eventType, options = {}) {
    const maxAttempts = typeof options.maxAttempts === 'number' && options.maxAttempts > 0
        ? options.maxAttempts
        : 3;
    const baseDelayMs = typeof options.baseDelayMs === 'number' && options.baseDelayMs > 0
        ? options.baseDelayMs
        : 500;

    // If no private key is configured, skip blockchain and return mock hash
    if (!POLYGON_PRIVATE_KEY) {
        console.warn('POLYGON_PRIVATE_KEY not configured. Skipping blockchain storage.');
        return {
            txHash: '0x' + crypto.randomBytes(32).toString('hex'),
            blockNumber: null,
            timestamp: new Date().toISOString(),
            status: 'skipped',
            attempts: 0
        };
    }

    const attemptStore = async () => {
        const contract = getContract();

        if (contract) {
            // Use smart contract if available
            const tx = await contract.logHash(hash, eventType);
            const receipt = await tx.wait();

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                timestamp: new Date().toISOString(),
                status: 'confirmed'
            };
        } else {
            // Use simple transaction approach
            // Send a minimal transaction with hash in data field
            const wallet = getWallet();

            // Create transaction data: hash + eventType (encoded)
            const abiCoder = ethers.AbiCoder.defaultAbiCoder();
            const data = abiCoder.encode(
                ['bytes32', 'string'],
                [hash, eventType]
            );

            const tx = await wallet.sendTransaction({
                to: wallet.address, // Send to self (cheapest option)
                data: data,
                gasLimit: 100000
            });

            const receipt = await tx.wait();

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                timestamp: new Date().toISOString(),
                status: 'confirmed'
            };
        }
    };

    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await attemptStore();
            return {
                ...result,
                attempts: attempt
            };
        } catch (error) {
            lastError = error;
            console.error(`Error storing hash on Polygon (attempt ${attempt}/${maxAttempts}):`, error.message);

            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // After exhausting retries, return failed status with visibility into attempts
    return {
        txHash: null,
        blockNumber: null,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: lastError ? lastError.message : 'Unknown error',
        attempts: maxAttempts
    };
}

/**
 * Main function to log audit event to blockchain
 * @param {Object} data - Audit data (will be sanitized and hashed)
 * @param {string} eventType - Type of event
 * @returns {Promise<Object>} Audit log result with blockchain info
 */
async function logAuditEvent(data, eventType) {
    // Create hash from sanitized data
    const hash = createHash(data);
    
    // Store hash on blockchain with retry metadata
    const blockchainResult = await storeHashOnChain(hash, eventType, {
        maxAttempts: 3,
        baseDelayMs: 500
    });
    
    return {
        hash,
        eventType,
        blockchainResult,
        dataHash: hash, // For database storage
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    logAuditEvent,
    createHash,
    sanitizeData,
    storeHashOnChain
};
