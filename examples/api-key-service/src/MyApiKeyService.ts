// biome-ignore-all lint: Need to fix this
// TODO: fix this file
// @ts-nocheck
import { createApiKeyService } from "zudoku/plugins/api-keys";

const now = new Date();
const thirtyDaysFromNow = new Date(now);
thirtyDaysFromNow.setDate(now.getDate() + 30);

const ninetyDaysFromNow = new Date(now);
ninetyDaysFromNow.setDate(now.getDate() + 90);

/**
 * Sample API keys for demonstration purposes.
 * In a real implementation, these would typically come from a database.
 */
const EXAMPLE_KEYS = [
  {
    id: "prod-key-1",
    description: "Production API Key",
    key: "prod-key-xyz-123",
    createdOn: now.toISOString(),
    expiresOn: ninetyDaysFromNow.toISOString(),
  },
  {
    id: "test-key-1",
    description: "Testing Environment Key",
    key: "test-key-abc-456",
    createdOn: now.toISOString(),
    expiresOn: thirtyDaysFromNow.toISOString(),
  },
  {
    id: "dev-key-1",
    description: "Development Key (No Expiration)",
    key: "dev-key-def-789",
    createdOn: now.toISOString(),
  },
];

/**
 * Example implementation of an API Key Service that stores keys in memory.
 * This implementation demonstrates the basic functionality required for managing API keys:
 * - Listing all keys
 * - Creating new keys
 * - Deleting keys
 * - Rolling (regenerating) keys
 * - Updating key descriptions
 *
 * Note: This is a simple in-memory implementation for demonstration purposes.
 * In a real environment, you would typically:
 * - Store keys in a secure database
 * - Implement proper encryption for the key values
 * - Add validation for key operations
 * - Implement rate limiting and usage tracking
 * - Add audit logging for key operations
 */
let keys = [...EXAMPLE_KEYS];
export const MyApiKeyService = createApiKeyService({
  enabled: true,

  /*
   * Retrieves all API keys.
   * In a real implementation, this would typically:
   * - Filter expired keys
   * - Apply pagination
   * - Add sorting options
   * - Filter based on user permissions
   */
  getKeys: async (context) => {
    return keys;
  },

  /**
   * Creates a new API key.
   * Demonstrates:
   * - Generating secure random IDs and key values
   * - Handling optional expiration dates
   * - Setting creation timestamps
   */
  createKey: async ({ apiKey }) => {
    const newKey = {
      id: crypto.randomUUID(),
      description: apiKey.description,
      key: `key-${crypto.randomUUID()}`,
      createdOn: new Date().toISOString(),
      expiresOn: apiKey.expiresOn,
    } as const;
    keys.push(newKey);
  },

  /**
   * Deletes an API key by ID.
   * In a real implementation, you might want to:
   * - Add soft delete functionality
   * - Archive deleted keys
   * - Add validation for protected keys
   */
  deleteKey: async (id, _context) => {
    keys = keys.filter((key) => key.id !== id);
  },

  /**
   * Rolls (regenerates) an API key while maintaining its metadata.
   * This is useful when a key might have been compromised.
   * The key ID stays the same but gets a new value.
   */
  rollKey: async (id, _context) => {
    const key = keys.find((k) => k.id === id);
    if (key) {
      key.key = `key-${crypto.randomUUID()}`;
    }
  },

  /**
   * Updates the description of an API key.
   * Demonstrates:
   * - Finding and updating specific keys
   * - Maintaining update timestamps
   */
  updateKeyDescription: async (apiKey, context) => {
    const key = keys.find((k) => k.id === apiKey.id);
    if (key) {
      key.description = apiKey.description;
    }
  },
});
