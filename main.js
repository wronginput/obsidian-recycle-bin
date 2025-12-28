/**
 * ============================================================================
 * RECYCLE BIN - Obsidian Plugin
 * ============================================================================
 * 
 * A visual recycle bin for your Obsidian vault. Preview, restore, or
 * permanently delete trashed files with ease.
 * 
 * FEATURES:
 * - View all files in .trash folder with metadata
 * - Preview files without restoring them
 * - Restore files to original location
 * - Permanently delete files
 * - Auto-purge old files after X days
 * - Search and sort functionality
 * - Batch operations
 * 
 * ACKNOWLEDGEMENTS:
 * Inspired by Trash Explorer by Per Mortensen
 * (https://github.com/proog/obsidian-trash-explorer)
 * 
 * Thank you to Per Mortensen for the original concept and inspiration.
 * This is a from-scratch rewrite with additional features.
 * 
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

'use strict';

// Import Obsidian API
const obsidian = require('obsidian');

// ============================================================================
// CONSTANTS
// ============================================================================

const TRASH_FOLDER = '.trash';
const VIEW_TYPE = 'recycle-bin-view';
const PREVIEW_VIEW_TYPE = 'recycle-bin-preview';
const PLUGIN_ID = 'recycle-bin';

// Default settings
const DEFAULT_SETTINGS = {
    autoPurgeEnabled: false,
    autoPurgeDays: 90,
    showConfirmations: true,
    showMetadata: true,
    showDeleteButton: false, // Hide per-item delete button by default
    sortBy: 'date', // 'name', 'date', 'size'
    sortOrder: 'desc' // 'asc', 'desc'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the basename of a path (filename without directory)
 * @param {string} path - Full file path
 * @returns {string} - Filename only
 */
function basename(path) {
    const match = path.match(/([^/]+)\/?$/);
    return match ? match[1] : path;
}

/**
 * Get the directory portion of a path
 * @param {string} path - Full file path
 * @returns {string} - Directory path
 */
function dirname(path) {
    const match = path.match(/^(.+)\/.+/);
    return match ? match[1] : '.';
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

/**
 * Format date in a readable format
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} - Formatted date string
 */
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}

/**
 * Calculate days since a timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {number} - Number of days
 */
function daysSince(timestamp) {
    if (!timestamp) return 0;
    return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// TRASHED ITEM CLASSES
// ============================================================================

/**
 * Represents a trashed file
 */
class TrashedFile {
    /**
     * @param {object} vault - Obsidian vault
     * @param {string} path - Path within .trash
     * @param {object} stat - File stats (size, mtime, etc.)
     * @param {TrashedFolder|null} parent - Parent folder
     */
    constructor(vault, path, stat, parent) {
        this.vault = vault;
        this.path = path;
        this.parent = parent;
        this.kind = 'file';
        this.name = basename(path);
        this.size = stat?.size || 0;
        this.mtime = stat?.mtime || null;
        this.extension = this.name.includes('.') ? this.name.split('.').pop() : '';
    }

    /**
     * Get the original path (before it was trashed)
     * @returns {string}
     */
    get originalPath() {
        return this.path.replace(`${TRASH_FOLDER}/`, '');
    }

    /**
     * Restore this file to its original location
     * @returns {Promise<boolean>} - True if successful
     */
    async restore() {
        const restorePath = this.originalPath;

        // Check if destination already exists
        if (await this.vault.adapter.exists(restorePath)) {
            return false;
        }

        // Create parent directories if needed
        const parentDir = dirname(restorePath);
        if (parentDir !== '.' && !await this.vault.adapter.exists(parentDir)) {
            await this.vault.adapter.mkdir(parentDir);
        }

        // Move the file
        await this.vault.adapter.rename(this.path, restorePath);

        // Remove from parent's children
        if (this.parent) {
            this.parent.removeChild(this);
        }

        return true;
    }

    /**
     * Permanently delete this file
     */
    async delete() {
        await this.vault.adapter.remove(this.path);
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    /**
     * Read the contents of this file
     * @returns {Promise<string>}
     */
    async read() {
        try {
            return await this.vault.adapter.read(this.path);
        } catch (e) {
            return `[Unable to read file: ${e.message}]`;
        }
    }
}

/**
 * Represents a trashed folder
 */
class TrashedFolder {
    /**
     * @param {object} vault - Obsidian vault
     * @param {string} path - Path within .trash
     * @param {object} stat - Folder stats
     * @param {TrashedFolder|null} parent - Parent folder
     */
    constructor(vault, path, stat, parent) {
        this.vault = vault;
        this.path = path;
        this.parent = parent;
        this.kind = 'folder';
        this.name = basename(path);
        this.mtime = stat?.mtime || null;
        this.children = [];
    }

    /**
     * Get the original path (before it was trashed)
     * @returns {string}
     */
    get originalPath() {
        return this.path.replace(`${TRASH_FOLDER}/`, '');
    }

    /**
     * Calculate total size of folder contents
     * @returns {number}
     */
    get size() {
        return this.children.reduce((sum, child) => sum + child.size, 0);
    }

    /**
     * Restore this folder and all contents
     * @returns {Promise<boolean>}
     */
    async restore() {
        const restorePath = this.originalPath;

        if (await this.vault.adapter.exists(restorePath)) {
            return false;
        }

        await this.vault.adapter.rename(this.path, restorePath);

        if (this.parent) {
            this.parent.removeChild(this);
        }

        return true;
    }

    /**
     * Permanently delete this folder and all contents
     */
    async delete() {
        await this.vault.adapter.rmdir(this.path, true);
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }

    /**
     * Remove a child from this folder
     * @param {TrashedFile|TrashedFolder} child
     */
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }
}

// ============================================================================
// TRASH MANAGER
// ============================================================================

/**
 * Manages the trash folder and its contents
 */
class TrashManager {
    /**
     * @param {object} vault - Obsidian vault
     */
    constructor(vault) {
        this.vault = vault;
        this.root = new TrashedFolder(vault, TRASH_FOLDER, null, null);
        this.collator = new Intl.Collator(undefined, { sensitivity: 'base' });
    }

    /**
     * Get all items in the trash
     * @returns {Array}
     */
    get items() {
        return this.root.children;
    }

    /**
     * Check if trash is empty
     * @returns {boolean}
     */
    get isEmpty() {
        return this.root.children.length === 0;
    }

    /**
     * Get total count of items (recursive)
     * @returns {number}
     */
    get totalCount() {
        return this.countItems(this.root.children);
    }

    /**
     * Get total size of trash
     * @returns {number}
     */
    get totalSize() {
        return this.root.size;
    }

    /**
     * Count items recursively
     * @param {Array} items
     * @returns {number}
     */
    countItems(items) {
        let count = 0;
        for (const item of items) {
            count++;
            if (item.kind === 'folder') {
                count += this.countItems(item.children);
            }
        }
        return count;
    }

    /**
     * Refresh the trash contents from disk
     */
    async refresh() {
        if (await this.vault.adapter.exists(TRASH_FOLDER)) {
            const listing = await this.vault.adapter.list(TRASH_FOLDER);
            this.root.children = await this.buildItems(listing, this.root);
        } else {
            this.root.children = [];
        }
    }

    /**
     * Build item tree from file listing
     * @param {object} listing - Folder listing from adapter
     * @param {TrashedFolder} parent - Parent folder
     * @returns {Promise<Array>}
     */
    async buildItems(listing, parent) {
        const items = [];
        const compareName = (a, b) => this.collator.compare(a, b);

        // Process folders first
        for (const folderPath of listing.folders.sort(compareName)) {
            const stat = await this.vault.adapter.stat(folderPath);
            const folder = new TrashedFolder(this.vault, folderPath, stat, parent);

            const childListing = await this.vault.adapter.list(folderPath);
            folder.children = await this.buildItems(childListing, folder);

            items.push(folder);
        }

        // Then files
        for (const filePath of listing.files.sort(compareName)) {
            const stat = await this.vault.adapter.stat(filePath);
            const file = new TrashedFile(this.vault, filePath, stat, parent);
            items.push(file);
        }

        return items;
    }

    /**
     * Empty the entire trash
     */
    async empty() {
        if (await this.vault.adapter.exists(TRASH_FOLDER)) {
            await this.vault.adapter.rmdir(TRASH_FOLDER, true);
        }
        this.root.children = [];
    }

    /**
     * Purge items older than specified days
     * @param {number} days - Age threshold in days
     * @returns {Promise<number>} - Number of items purged
     */
    async purgeOlderThan(days) {
        let purgedCount = 0;
        const itemsToPurge = this.findItemsOlderThan(this.root.children, days);

        for (const item of itemsToPurge) {
            await item.delete();
            purgedCount++;
        }

        return purgedCount;
    }

    /**
     * Find items older than specified days
     * @param {Array} items
     * @param {number} days
     * @returns {Array}
     */
    findItemsOlderThan(items, days) {
        const result = [];

        for (const item of items) {
            if (daysSince(item.mtime) >= days) {
                result.push(item);
            } else if (item.kind === 'folder') {
                result.push(...this.findItemsOlderThan(item.children, days));
            }
        }

        return result;
    }

    /**
     * Get flat list of all items (for search/sort)
     * @returns {Array}
     */
    getFlatList() {
        return this.flattenItems(this.root.children);
    }

    /**
     * Flatten item tree into array
     * @param {Array} items
     * @returns {Array}
     */
    flattenItems(items) {
        const result = [];
        for (const item of items) {
            result.push(item);
            if (item.kind === 'folder') {
                result.push(...this.flattenItems(item.children));
            }
        }
        return result;
    }
}

// ============================================================================
// FILE PREVIEW VIEW (Main Tab)
// ============================================================================

/**
 * View for previewing trashed file contents in the main editor area.
 * Opens like a normal note but is read-only with restore/delete actions.
 */
class FilePreviewView extends obsidian.ItemView {
    /**
     * @param {object} leaf - Workspace leaf
     * @param {RecycleBinPlugin} plugin - Plugin instance
     */
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.file = null;
        this.navigation = true;
    }

    getViewType() {
        return PREVIEW_VIEW_TYPE;
    }

    getDisplayText() {
        return this.file ? `🗑️ ${this.file.name}` : 'Trashed File Preview';
    }

    getIcon() {
        return 'trash-2';
    }

    /**
     * Set the file to preview and render
     * @param {TrashedFile} file
     */
    async setFile(file) {
        this.file = file;
        this.leaf.updateHeader();
        await this.render();
    }

    async onOpen() {
        // Will be rendered when setFile is called
    }

    async onClose() {
        this.contentEl.empty();
    }

    /**
     * Render the preview content
     */
    async render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('recycle-bin-preview-view');

        if (!this.file) {
            container.createEl('p', { text: 'No file selected' });
            return;
        }

        // Info banner
        const banner = container.createDiv({ cls: 'recycle-bin-preview-banner' });
        banner.innerHTML = `
            <div class="recycle-bin-preview-banner-icon">🗑️</div>
            <div class="recycle-bin-preview-banner-text">
                <strong>This file is in the Recycle Bin</strong><br>
                <span>Original: ${this.file.originalPath} • ${formatFileSize(this.file.size)} • Deleted ${formatDate(this.file.mtime)}</span>
            </div>
        `;

        // Action buttons in banner
        const actions = banner.createDiv({ cls: 'recycle-bin-preview-banner-actions' });

        const restoreBtn = actions.createEl('button', { text: '↩ Restore', cls: 'recycle-bin-btn restore' });
        restoreBtn.onclick = async () => {
            if (await this.file.restore()) {
                new obsidian.Notice(`Restored "${this.file.name}"`);
                // Open the restored file
                const restoredFile = this.app.vault.getAbstractFileByPath(this.file.originalPath);
                if (restoredFile) {
                    await this.leaf.openFile(restoredFile);
                } else {
                    this.leaf.detach();
                }
                // Refresh recycle bin views
                await this.plugin.refreshViews();
            } else {
                new obsidian.Notice(`Cannot restore: file already exists at original location`, 5000);
            }
        };

        const deleteBtn = actions.createEl('button', { text: '✕ Delete Forever', cls: 'recycle-bin-btn danger' });
        deleteBtn.onclick = async () => {
            if (this.plugin.settings.showConfirmations) {
                new ConfirmModal(
                    this.app,
                    'Delete permanently',
                    `Are you sure you want to permanently delete "${this.file.name}"? This cannot be undone.`,
                    'Delete',
                    async () => {
                        await this.file.delete();
                        new obsidian.Notice(`Deleted "${this.file.name}"`);
                        this.leaf.detach();
                        await this.plugin.refreshViews();
                    }
                ).open();
            } else {
                await this.file.delete();
                new obsidian.Notice(`Deleted "${this.file.name}"`);
                this.leaf.detach();
                await this.plugin.refreshViews();
            }
        };

        // Content area
        const content = container.createDiv({ cls: 'recycle-bin-preview-content-area' });

        // Check file type and render accordingly
        const ext = this.file.extension.toLowerCase();
        const textExtensions = ['md', 'txt', 'json', 'js', 'css', 'html', 'xml', 'yaml', 'yml', 'csv', 'ts', 'jsx', 'tsx'];

        if (textExtensions.includes(ext)) {
            const fileContent = await this.file.read();

            if (ext === 'md') {
                // Render markdown
                const markdownEl = content.createDiv({ cls: 'markdown-preview-view markdown-rendered' });
                await obsidian.MarkdownRenderer.render(
                    this.app,
                    fileContent,
                    markdownEl,
                    this.file.originalPath,
                    this
                );
            } else {
                // Show as code block
                const codeBlock = content.createEl('pre', { cls: 'recycle-bin-code-block' });
                const code = codeBlock.createEl('code');
                code.textContent = fileContent;
            }
        } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
            // Image preview
            try {
                const arrayBuffer = await this.app.vault.adapter.readBinary(this.file.path);
                const blob = new Blob([arrayBuffer]);
                const url = URL.createObjectURL(blob);
                const img = content.createEl('img', {
                    cls: 'recycle-bin-image-preview',
                    attr: { src: url, alt: this.file.name }
                });
                // Clean up blob URL when view closes
                this.register(() => URL.revokeObjectURL(url));
            } catch (e) {
                content.createEl('p', { text: `Unable to load image: ${e.message}` });
            }
        } else {
            // Unsupported format
            content.createDiv({ cls: 'recycle-bin-unsupported' }).innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                <p>Preview not available for <strong>.${ext}</strong> files</p>
                <p style="color: var(--text-muted);">Restore the file to view it normally</p>
            `;
        }
    }
}

// ============================================================================
// CONFIRM MODAL
// ============================================================================

/**
 * Generic confirmation modal
 */
class ConfirmModal extends obsidian.Modal {
    /**
     * @param {object} app - Obsidian app
     * @param {string} title - Modal title
     * @param {string} message - Confirmation message
     * @param {string} confirmText - Button text
     * @param {Function} onConfirm - Callback on confirm
     */
    constructor(app, title, message, confirmText, onConfirm) {
        super(app);
        this.titleText = title;
        this.message = message;
        this.confirmText = confirmText;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl, titleEl } = this;

        titleEl.setText(this.titleText);
        contentEl.createEl('p', { text: this.message });

        const buttons = contentEl.createDiv({ cls: 'recycle-bin-actions' });

        const confirmBtn = buttons.createEl('button', {
            text: this.confirmText,
            cls: 'recycle-bin-btn danger'
        });
        confirmBtn.onclick = () => {
            this.onConfirm();
            this.close();
        };

        const cancelBtn = buttons.createEl('button', {
            text: 'Cancel',
            cls: 'recycle-bin-btn'
        });
        cancelBtn.onclick = () => this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}

// ============================================================================
// RECYCLE BIN VIEW
// ============================================================================

/**
 * Main sidebar view for the recycle bin
 */
class RecycleBinView extends obsidian.ItemView {
    /**
     * @param {object} leaf - Workspace leaf
     * @param {RecycleBinPlugin} plugin - Plugin instance
     */
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.trashManager = plugin.trashManager;
        this.searchQuery = '';
        this.selectedItems = new Set();
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return 'Recycle Bin';
    }

    getIcon() {
        return 'trash-2';
    }

    async onOpen() {
        await this.render();
    }

    async onClose() {
        this.containerEl.empty();
    }

    /**
     * Refresh the view
     */
    async refresh() {
        await this.trashManager.refresh();
        await this.render();
    }

    /**
     * Render the entire view
     */
    async render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('recycle-bin-container');

        // Toolbar
        this.renderToolbar(container);

        // File list
        this.renderFileList(container);

        // Stats bar
        this.renderStats(container);
    }

    /**
     * Render the toolbar (search, sort, actions)
     * @param {HTMLElement} container
     */
    renderToolbar(container) {
        const toolbar = container.createDiv({ cls: 'recycle-bin-toolbar' });

        // Search input
        const searchInput = toolbar.createEl('input', {
            type: 'text',
            placeholder: 'Search deleted files...',
            cls: 'recycle-bin-search',
            value: this.searchQuery
        });
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value;
            this.renderFileList(container);
        };

        // Actions row
        const actions = toolbar.createDiv({ cls: 'recycle-bin-actions' });

        // Sort dropdown
        const sortSelect = actions.createEl('select', { cls: 'recycle-bin-sort-select' });
        const sortOptions = [
            { value: 'date-desc', text: 'Newest first' },
            { value: 'date-asc', text: 'Oldest first' },
            { value: 'name-asc', text: 'Name A-Z' },
            { value: 'name-desc', text: 'Name Z-A' },
            { value: 'size-desc', text: 'Largest first' },
            { value: 'size-asc', text: 'Smallest first' }
        ];
        const currentSort = `${this.plugin.settings.sortBy}-${this.plugin.settings.sortOrder}`;
        sortOptions.forEach(opt => {
            const option = sortSelect.createEl('option', { value: opt.value, text: opt.text });
            if (opt.value === currentSort) option.selected = true;
        });
        sortSelect.onchange = async (e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            this.plugin.settings.sortBy = sortBy;
            this.plugin.settings.sortOrder = sortOrder;
            await this.plugin.saveSettings();
            this.renderFileList(container);
        };

        // Refresh button
        const refreshBtn = actions.createEl('button', { text: '↻ Refresh', cls: 'recycle-bin-btn' });
        refreshBtn.onclick = () => this.refresh();

        // Empty trash button
        const emptyBtn = actions.createEl('button', { text: '🗑 Empty All', cls: 'recycle-bin-btn danger' });
        emptyBtn.onclick = () => this.emptyTrash();
    }

    /**
     * Render the file list
     * @param {HTMLElement} container
     */
    renderFileList(container) {
        // Remove existing list if any
        const existingList = container.querySelector('.recycle-bin-list');
        if (existingList) existingList.remove();

        const list = container.createDiv({ cls: 'recycle-bin-list' });

        if (this.trashManager.isEmpty) {
            this.renderEmptyState(list);
            return;
        }

        // Get and sort items
        let items = this.trashManager.getFlatList();

        // Filter by search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            items = items.filter(item => item.name.toLowerCase().includes(query));
        }

        // Sort items
        items = this.sortItems(items);

        // Render each item
        items.forEach(item => {
            this.renderItem(list, item);
        });
    }

    /**
     * Sort items based on settings
     * @param {Array} items
     * @returns {Array}
     */
    sortItems(items) {
        const { sortBy, sortOrder } = this.plugin.settings;
        const multiplier = sortOrder === 'asc' ? 1 : -1;

        return items.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return multiplier * a.name.localeCompare(b.name);
                case 'date':
                    return multiplier * ((a.mtime || 0) - (b.mtime || 0));
                case 'size':
                    return multiplier * (a.size - b.size);
                default:
                    return 0;
            }
        });
    }

    /**
     * Render empty state message
     * @param {HTMLElement} container
     */
    renderEmptyState(container) {
        const empty = container.createDiv({ cls: 'recycle-bin-empty' });
        empty.createDiv({ cls: 'recycle-bin-empty-icon', text: '🗑️' });

        // Check if using Obsidian's .trash folder
        const trashOption = this.app.vault.config.trashOption || 'system';

        if (trashOption !== 'local') {
            // Show warning that plugin won't work with current setting
            empty.createEl('p', { text: 'Recycle Bin is not configured' });
            const warning = empty.createEl('small');
            warning.style.color = 'var(--text-warning)';
            warning.innerHTML = '⚠️ You\'re using System Trash.<br>Go to <strong>Settings → Recycle Bin</strong> to enable.';
        } else {
            empty.createEl('p', { text: 'Your recycle bin is empty' });
            empty.createEl('small', { text: 'Deleted files will appear here' });
        }
    }

    /**
     * Render a single item
     * @param {HTMLElement} container
     * @param {TrashedFile|TrashedFolder} item
     */
    renderItem(container, item) {
        const itemEl = container.createDiv({ cls: 'recycle-bin-item' });

        // Icon
        const icon = itemEl.createDiv({ cls: 'recycle-bin-item-icon' });
        icon.textContent = item.kind === 'folder' ? '📁' : this.getFileIcon(item.extension);

        // Content
        const content = itemEl.createDiv({ cls: 'recycle-bin-item-content' });

        // Name
        content.createDiv({ cls: 'recycle-bin-item-name', text: item.name });

        // Metadata
        if (this.plugin.settings.showMetadata) {
            const meta = content.createDiv({ cls: 'recycle-bin-item-meta' });
            meta.createSpan({ text: formatFileSize(item.size) });
            meta.createSpan({ text: '•' });
            meta.createSpan({ text: formatDate(item.mtime) });
        }

        // Actions - only restore button by default, delete is optional
        const actions = itemEl.createDiv({ cls: 'recycle-bin-item-actions' });

        // Restore button (always shown)
        const restoreBtn = actions.createEl('button', { text: '↩', cls: 'recycle-bin-item-btn restore', attr: { title: 'Restore' } });
        restoreBtn.onclick = async (e) => {
            e.stopPropagation();
            await this.restoreItem(item);
        };

        // Delete button (optional, hidden by default)
        if (this.plugin.settings.showDeleteButton) {
            const deleteBtn = actions.createEl('button', { text: '✕', cls: 'recycle-bin-item-btn delete', attr: { title: 'Delete permanently' } });
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                await this.deleteItem(item);
            };
        }

        // Click to preview in main tab (files only)
        if (item.kind === 'file') {
            itemEl.onclick = () => {
                this.openFilePreview(item);
            };
        }
    }

    /**
     * Open a file preview in the main editor area
     * @param {TrashedFile} file
     */
    async openFilePreview(file) {
        // Get or create a leaf in the main area
        const leaf = this.app.workspace.getLeaf('tab');
        await leaf.setViewState({
            type: PREVIEW_VIEW_TYPE,
            active: true
        });

        // Set the file on the view
        if (leaf.view instanceof FilePreviewView) {
            await leaf.view.setFile(file);
        }
    }

    /**
     * Get an appropriate icon for a file extension
     * @param {string} ext
     * @returns {string}
     */
    getFileIcon(ext) {
        const icons = {
            'md': '📝',
            'txt': '📄',
            'pdf': '📕',
            'png': '🖼️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'gif': '🖼️',
            'svg': '🖼️',
            'mp3': '🎵',
            'mp4': '🎬',
            'json': '{ }',
            'js': '📜',
            'css': '🎨',
            'canvas': '🎨'
        };
        return icons[ext?.toLowerCase()] || '📄';
    }

    /**
     * Render the stats bar
     * @param {HTMLElement} container
     */
    renderStats(container) {
        // Remove existing stats if any
        const existingStats = container.querySelector('.recycle-bin-stats');
        if (existingStats) existingStats.remove();

        const stats = container.createDiv({ cls: 'recycle-bin-stats' });
        stats.createSpan({ text: `${this.trashManager.totalCount} items` });
        stats.createSpan({ text: formatFileSize(this.trashManager.totalSize) });
    }

    /**
     * Restore an item
     * @param {TrashedFile|TrashedFolder} item
     */
    async restoreItem(item) {
        if (await item.restore()) {
            new obsidian.Notice(`Restored "${item.name}"`);
            await this.refresh();
        } else {
            new obsidian.Notice(`Cannot restore "${item.name}": path already exists`, 5000);
        }
    }

    /**
     * Delete an item permanently
     * @param {TrashedFile|TrashedFolder} item
     */
    async deleteItem(item) {
        if (this.plugin.settings.showConfirmations) {
            new ConfirmModal(
                this.app,
                'Delete permanently',
                `Are you sure you want to permanently delete "${item.name}"? This cannot be undone.`,
                'Delete',
                async () => {
                    await item.delete();
                    new obsidian.Notice(`Deleted "${item.name}"`);
                    await this.refresh();
                }
            ).open();
        } else {
            await item.delete();
            new obsidian.Notice(`Deleted "${item.name}"`);
            await this.refresh();
        }
    }

    /**
     * Empty the entire trash
     */
    async emptyTrash() {
        if (this.trashManager.isEmpty) {
            new obsidian.Notice('Recycle bin is already empty');
            return;
        }

        if (this.plugin.settings.showConfirmations) {
            new ConfirmModal(
                this.app,
                'Empty recycle bin',
                'Are you sure you want to permanently delete ALL files in the recycle bin? This cannot be undone!',
                'Empty Bin',
                async () => {
                    await this.trashManager.empty();
                    new obsidian.Notice('Recycle bin emptied');
                    await this.refresh();
                }
            ).open();
        } else {
            await this.trashManager.empty();
            new obsidian.Notice('Recycle bin emptied');
            await this.refresh();
        }
    }
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

/**
 * Settings tab for the plugin
 */
class RecycleBinSettingTab extends obsidian.PluginSettingTab {
    /**
     * @param {object} app - Obsidian app
     * @param {RecycleBinPlugin} plugin - Plugin instance
     */
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Recycle Bin Settings' });

        // =============================================
        // TRASH LOCATION SECTION
        // =============================================
        containerEl.createEl('h3', { text: '📍 Trash Location' });

        // Get current Obsidian trash setting
        const currentTrashOption = this.app.vault.config.trashOption || 'system';

        // Explain current setting
        const trashExplanation = containerEl.createDiv({ cls: 'setting-item-description' });
        trashExplanation.style.marginBottom = '12px';
        trashExplanation.style.padding = '12px';
        trashExplanation.style.background = 'var(--background-secondary)';
        trashExplanation.style.borderRadius = '6px';

        if (currentTrashOption === 'local') {
            trashExplanation.innerHTML = `
                <strong style="color: var(--text-success);">✓ Using Obsidian's .trash folder</strong><br>
                <span style="color: var(--text-muted);">Deleted files will appear in this Recycle Bin.</span>
            `;
        } else if (currentTrashOption === 'system') {
            trashExplanation.innerHTML = `
                <strong style="color: var(--text-warning);">⚠ Using System Trash (macOS Bin)</strong><br>
                <span style="color: var(--text-muted);">Deleted files go to your OS trash, not this Recycle Bin. Change below to use this plugin.</span>
            `;
        } else {
            trashExplanation.innerHTML = `
                <strong style="color: var(--text-error);">⚠ Permanent Deletion Enabled</strong><br>
                <span style="color: var(--text-muted);">Deleted files are immediately destroyed! Change below to enable recovery.</span>
            `;
        }

        // Dropdown to change trash location
        new obsidian.Setting(containerEl)
            .setName('Deleted files location')
            .setDesc('Choose where deleted files should go. "Obsidian .trash" is required for this plugin to work.')
            .addDropdown(dropdown => dropdown
                .addOption('local', '📁 Obsidian .trash folder (recommended)')
                .addOption('system', '🗑️ System trash (macOS Bin)')
                .addOption('none', '⚠️ Permanently delete (no recovery)')
                .setValue(currentTrashOption)
                .onChange(async (value) => {
                    // Update Obsidian's vault config
                    this.app.vault.config.trashOption = value;
                    await this.app.vault.setConfig('trashOption', value);
                    new obsidian.Notice(`Trash location changed to: ${value === 'local' ? 'Obsidian .trash' : value === 'system' ? 'System trash' : 'Permanent delete'}`);
                    this.display(); // Refresh to update explanation
                }));

        containerEl.createEl('hr');

        // =============================================
        // PLUGIN SETTINGS SECTION  
        // =============================================
        const settingsHeader = containerEl.createEl('h3', { text: '⚙️ Plugin Settings' });

        // Check if plugin is usable
        const isPluginEnabled = currentTrashOption === 'local';

        // Show disabled notice if not using local trash
        if (!isPluginEnabled) {
            const disabledNotice = containerEl.createDiv({ cls: 'setting-item-description' });
            disabledNotice.style.marginBottom = '12px';
            disabledNotice.style.padding = '12px';
            disabledNotice.style.background = 'var(--background-modifier-error)';
            disabledNotice.style.borderRadius = '6px';
            disabledNotice.style.color = 'var(--text-on-accent)';
            disabledNotice.innerHTML = `
                <strong>⚠️ Settings disabled</strong><br>
                Change "Deleted files location" above to "Obsidian .trash folder" to enable this plugin.
            `;
        }

        // Create settings container that can be disabled
        const settingsContainer = containerEl.createDiv();
        if (!isPluginEnabled) {
            settingsContainer.style.opacity = '0.4';
            settingsContainer.style.pointerEvents = 'none';
        }

        // Auto-purge toggle
        new obsidian.Setting(settingsContainer)
            .setName('Auto-purge old files')
            .setDesc('Automatically delete files older than a specified number of days')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoPurgeEnabled)
                .setDisabled(!isPluginEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.autoPurgeEnabled = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide days setting
                }));

        // Auto-purge days (only show if enabled)
        if (this.plugin.settings.autoPurgeEnabled) {
            new obsidian.Setting(settingsContainer)
                .setName('Auto-purge after (days)')
                .setDesc('Delete files older than this many days')
                .addText(text => text
                    .setPlaceholder('90')
                    .setValue(String(this.plugin.settings.autoPurgeDays))
                    .setDisabled(!isPluginEnabled)
                    .onChange(async (value) => {
                        const days = parseInt(value, 10);
                        if (!isNaN(days) && days > 0) {
                            this.plugin.settings.autoPurgeDays = days;
                            await this.plugin.saveSettings();
                        }
                    }));
        }

        // Show confirmations
        new obsidian.Setting(settingsContainer)
            .setName('Show confirmation dialogs')
            .setDesc('Ask for confirmation before deleting or emptying trash')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showConfirmations)
                .setDisabled(!isPluginEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.showConfirmations = value;
                    await this.plugin.saveSettings();
                }));

        // Show metadata
        new obsidian.Setting(settingsContainer)
            .setName('Show file metadata')
            .setDesc('Display file size and deletion date in the list')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showMetadata)
                .setDisabled(!isPluginEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.showMetadata = value;
                    await this.plugin.saveSettings();
                    await this.plugin.refreshViews();
                }));

        // Show delete button
        new obsidian.Setting(settingsContainer)
            .setName('Show per-item delete button')
            .setDesc('Show a delete button on each item to permanently delete individual files')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showDeleteButton)
                .setDisabled(!isPluginEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.showDeleteButton = value;
                    await this.plugin.saveSettings();
                    await this.plugin.refreshViews();
                }));

        // Acknowledgements
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: 'Acknowledgements' });
        const ack = containerEl.createEl('p');
        ack.innerHTML = `
            This plugin was inspired by <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a> 
            by <strong>Per Mortensen</strong>. Thank you for the original concept and inspiration!
        `;
    }
}

// ============================================================================
// MAIN PLUGIN CLASS
// ============================================================================

/**
 * Main plugin class
 */
class RecycleBinPlugin extends obsidian.Plugin {
    async onload() {
        console.log('Loading Recycle Bin plugin');

        // Load settings
        await this.loadSettings();

        // Initialize trash manager
        this.trashManager = new TrashManager(this.app.vault);
        await this.trashManager.refresh();

        // Register the sidebar view
        this.registerView(
            VIEW_TYPE,
            (leaf) => new RecycleBinView(leaf, this)
        );

        // Register the file preview view (opens in main tab)
        this.registerView(
            PREVIEW_VIEW_TYPE,
            (leaf) => new FilePreviewView(leaf, this)
        );

        // Add ribbon icon
        this.addRibbonIcon('trash-2', 'Open Recycle Bin', () => {
            this.activateView();
        });

        // Add command to open recycle bin
        this.addCommand({
            id: 'open-recycle-bin',
            name: 'Open Recycle Bin',
            callback: () => this.activateView()
        });

        // Add command to empty trash
        this.addCommand({
            id: 'empty-recycle-bin',
            name: 'Empty Recycle Bin',
            callback: () => this.emptyTrash()
        });

        // Add settings tab
        this.addSettingTab(new RecycleBinSettingTab(this.app, this));

        // Listen for file deletions to refresh the view
        this.registerEvent(
            this.app.vault.on('delete', async () => {
                await this.trashManager.refresh();
                await this.refreshViews();
            })
        );

        // Run auto-purge on startup if enabled
        if (this.settings.autoPurgeEnabled) {
            await this.runAutoPurge();
        }
    }

    onunload() {
        console.log('Unloading Recycle Bin plugin');
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);
        this.app.workspace.detachLeavesOfType(PREVIEW_VIEW_TYPE);
    }

    /**
     * Load settings from disk
     */
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    /**
     * Save settings to disk
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Activate the recycle bin view
     */
    async activateView() {
        const { workspace } = this.app;

        let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];

        if (!leaf) {
            const leftLeaf = workspace.getLeftLeaf(false);
            if (leftLeaf) {
                await leftLeaf.setViewState({ type: VIEW_TYPE, active: true });
                leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
            }
        }

        if (leaf) {
            await this.trashManager.refresh();
            workspace.revealLeaf(leaf);
            if (leaf.view && leaf.view.refresh) {
                await leaf.view.refresh();
            }
        }
    }

    /**
     * Refresh all open recycle bin views
     */
    async refreshViews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
        for (const leaf of leaves) {
            if (leaf.view instanceof RecycleBinView) {
                await leaf.view.refresh();
            }
        }
    }

    /**
     * Empty the trash (with confirmation)
     */
    async emptyTrash() {
        if (this.trashManager.isEmpty) {
            new obsidian.Notice('Recycle bin is already empty');
            return;
        }

        new ConfirmModal(
            this.app,
            'Empty recycle bin',
            'Are you sure you want to permanently delete ALL files in the recycle bin? This cannot be undone!',
            'Empty Bin',
            async () => {
                await this.trashManager.empty();
                new obsidian.Notice('Recycle bin emptied');
                await this.refreshViews();
            }
        ).open();
    }

    /**
     * Run auto-purge based on settings
     */
    async runAutoPurge() {
        if (!this.settings.autoPurgeEnabled) return;

        const purgedCount = await this.trashManager.purgeOlderThan(this.settings.autoPurgeDays);

        if (purgedCount > 0) {
            new obsidian.Notice(`Auto-purged ${purgedCount} old file(s) from recycle bin`);
            await this.refreshViews();
        }
    }
}

// Export the plugin
module.exports = RecycleBinPlugin;
