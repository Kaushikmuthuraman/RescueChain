/**
 * IPFS Service
 * Abstraction layer for IPFS operations
 * Supports multiple IPFS implementations (Pinata, Infura, local node, etc.)
 */

const { AppError } = require('../../middleware/errorHandler');

/**
 * IPFS Service Interface
 * Abstract class for IPFS implementations
 */
class IPFSService {
    /**
     * Upload a file to IPFS
     * @param {Buffer} fileBuffer - File buffer
     * @param {string} fileName - Original file name
     * @returns {Promise<{cid: string}>} IPFS Content ID
     */
    async uploadFile(fileBuffer, fileName) {
        throw new Error('uploadFile must be implemented by subclass');
    }

    /**
     * Get file from IPFS by CID
     * @param {string} cid - IPFS Content ID
     * @returns {Promise<Buffer>} File buffer
     */
    async getFile(cid) {
        throw new Error('getFile must be implemented by subclass');
    }

    /**
     * Get IPFS gateway URL for a CID
     * @param {string} cid - IPFS Content ID
     * @returns {string} Gateway URL
     */
    getGatewayUrl(cid) {
        throw new Error('getGatewayUrl must be implemented by subclass');
    }
}

/**
 * Demo/Mock IPFS Service
 * For development/testing without actual IPFS infrastructure
 * In production, replace with actual IPFS implementation (Pinata, Infura, etc.)
 */
class MockIPFSService extends IPFSService {
    constructor() {
        super();
        this.storage = new Map(); // In-memory storage for demo
    }

    /**
     * Upload file to mock IPFS
     * Generates a mock CID based on file hash
     */
    async uploadFile(fileBuffer, fileName) {
        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            throw new AppError('Invalid file buffer', 400, 'INVALID_FILE');
        }

        // Generate mock CID (in production, use actual IPFS add)
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const cid = `Qm${hash.substring(0, 44)}`; // Mock CID format

        // Store file in memory (for demo purposes)
        this.storage.set(cid, fileBuffer);

        return {
            cid,
            size: fileBuffer.length
        };
    }

    /**
     * Get file from mock IPFS
     */
    async getFile(cid) {
        if (!this.storage.has(cid)) {
            throw new AppError('File not found in IPFS', 404, 'FILE_NOT_FOUND');
        }
        return this.storage.get(cid);
    }

    /**
     * Get IPFS gateway URL
     */
    getGatewayUrl(cid) {
        // Mock gateway URL
        const gatewayUrl = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs';
        return `${gatewayUrl}/${cid}`;
    }
}

/**
 * Create IPFS service instance based on environment
 * @returns {IPFSService} IPFS service instance
 */
function createIPFSService() {
    const provider = process.env.IPFS_PROVIDER || 'mock';

    switch (provider.toLowerCase()) {
        case 'mock':
        case 'demo':
            return new MockIPFSService();
        
        // Add other providers here:
        // case 'pinata':
        //     return new PinataIPFSService();
        // case 'infura':
        //     return new InfuraIPFSService();
        // case 'local':
        //     return new LocalIPFSService();
        
        default:
            console.warn(`Unknown IPFS provider: ${provider}. Using mock service.`);
            return new MockIPFSService();
    }
}

// Export singleton instance
const ipfsService = createIPFSService();

module.exports = {
    IPFSService,
    MockIPFSService,
    createIPFSService,
    ipfsService
};
