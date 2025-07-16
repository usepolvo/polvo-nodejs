import { promises as fs } from 'node:fs';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import { TokenStorage } from '../types.js';

export class FileStorage implements TokenStorage {
    private filePath: string;
    private encryptionKey?: Buffer;

    constructor(filePath: string, enableEncryption: boolean = true) {
        // Expand ~ to home directory
        this.filePath = filePath.startsWith('~')
            ? filePath.replace('~', homedir())
            : filePath;

        if (enableEncryption) {
            this.encryptionKey = this._getOrCreateEncryptionKey();
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            await this._ensureDirectoryExists();
            const data = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(data);

            if (!parsed[key]) {
                return null;
            }

            if (this.encryptionKey) {
                return this._decrypt(parsed[key]);
            }

            return parsed[key];
        } catch (error) {
            if ((error as any)?.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        await this._ensureDirectoryExists();

        let existingData = {};
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            existingData = JSON.parse(data);
        } catch (error) {
            if ((error as any)?.code !== 'ENOENT') {
                throw error;
            }
        }

        const valueToStore = this.encryptionKey ? this._encrypt(value) : value;

        const updatedData: Record<string, any> = {
            ...existingData,
            [key]: valueToStore,
        };

        // Handle TTL if specified
        if (ttl) {
            updatedData[`${key}_expires`] = Date.now() + (ttl * 1000);
        }

        await fs.writeFile(this.filePath, JSON.stringify(updatedData, null, 2), {
            mode: 0o600, // Read/write for owner only
        });
    }

    async delete(key: string): Promise<void> {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(data);

            delete parsed[key];
            delete parsed[`${key}_expires`];

            await fs.writeFile(this.filePath, JSON.stringify(parsed, null, 2), {
                mode: 0o600,
            });
        } catch (error) {
            if ((error as any)?.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    private async _ensureDirectoryExists(): Promise<void> {
        const dir = dirname(this.filePath);
        try {
            await fs.mkdir(dir, { recursive: true, mode: 0o700 });
        } catch (error) {
            if ((error as any)?.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    private _getOrCreateEncryptionKey(): Buffer {
        // Use a deterministic key based on machine and file path
        // In production, you might want to use a more secure key derivation
        const identifier = `polvo-${this.filePath}-${process.platform}`;
        return createHash('sha256').update(identifier).digest();
    }

    private _encrypt(text: string): string {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }

        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    private _decrypt(encryptedText: string): string {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not available');
        }

        const [ivHex, encrypted] = encryptedText.split(':');
        if (!ivHex || !encrypted) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(ivHex, 'hex');
        const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
} 