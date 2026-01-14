/**
 * Base storage manager with generic CRUD operations
 * Provides common functionality for all storage managers
 */

export class BaseStorageManager<T extends { id: string }> {
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  /**
   * Get all items from localStorage
   */
  protected getAll(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading ${this.storageKey}:`, error);
      return [];
    }
  }

  /**
   * Save all items to localStorage
   */
  protected saveAll(items: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving ${this.storageKey}:`, error);
    }
  }

  /**
   * Get item by ID
   */
  getById(id: string): T | undefined {
    const items = this.getAll();
    return items.find(item => item.id === id);
  }

  /**
   * Create a new item
   */
  create(item: T): T {
    const items = this.getAll();
    items.push(item);
    this.saveAll(items);
    return item;
  }

  /**
   * Update an existing item
   */
  update(id: string, updates: Partial<T>): T | undefined {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      return undefined;
    }

    items[index] = { ...items[index], ...updates };
    this.saveAll(items);
    return items[index];
  }

  /**
   * Delete an item
   */
  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    
    if (filtered.length === items.length) {
      return false; // Item not found
    }

    this.saveAll(filtered);
    return true;
  }

  /**
   * Clear all items
   */
  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Get count of items
   */
  count(): number {
    return this.getAll().length;
  }

  /**
   * Check if item exists
   */
  exists(id: string): boolean {
    return this.getById(id) !== undefined;
  }
}
