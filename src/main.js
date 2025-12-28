/**
 * ============================================================================
 * RECYCLE BIN - Obsidian Plugin
 * ============================================================================
 * 
 * A visual recycle bin for your Obsidian vault.
 * 
 * @author wronginput
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

'use strict';

// Import Obsidian API
const obsidian = require('obsidian');

// Import modules
const { t, getLanguage, setLanguage, TRANSLATIONS, SUPPORTED_LANGUAGES } = require('./translations');
const { formatFileSize, formatDate, escapeHtml, isValidPath, debounce } = require('./utils');
const { VIEW_TYPE, PREVIEW_VIEW_TYPE, TRASH_FOLDER, DEFAULT_SETTINGS, FILE_ICONS } = require('./constants');

// Current language state (module-level)
let currentLanguage = 'en';

// ============================================================================
// TRASH ITEM CLASSES
// ============================================================================

/**
 * Class representing a file in the trash
 */
class TrashedFile {
    /**
     * @param {object} vault - Obsidian vault
     * @param {string} path - Path to file in trash
     * @param {object} stat - File stats
     */
    constructor(vault, path, stat) {
        this.vault = vault;
        this.path = path;
        this.stat = stat;
        this.kind = 'file';

        const pathParts = path.split('/');
        this.name = pathParts.pop();
        pathParts.shift(); // Remove .trash
        this.originalPath = pathParts.length > 0
            ? pathParts.join('/') + '/' + this.name
            : this.name;
    }

    get size() { return this.stat?.size || 0; }
    get mtime() { return this.stat?.mtime || 0; }
    get extension() {
        const parts = this.name.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
    }

    /**
     * Restore file to original location
     * @returns {Promise<boolean>} Success status
     */
    async restore() {
        try {
            // Validate path before restore
            if (!isValidPath(this.originalPath)) {
                console.error('Invalid restore path:', this.originalPath);
                return false;
            }

            const exists = await this.vault.adapter.exists(this.originalPath);
            if (exists) return false;

            const content = await this.vault.adapter.read(this.path);

            // Ensure parent directories exist
            const parentPath = this.originalPath.split('/').slice(0, -1).join('/');
            if (parentPath) {
                await this.vault.adapter.mkdir(parentPath);
            }

            await this.vault.adapter.write(this.originalPath, content);
            await this.vault.adapter.remove(this.path);
            return true;
        } catch (e) {
            console.error('Failed to restore file:', e);
            return false;
        }
    }

    /**
     * Permanently delete file
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            await this.vault.adapter.remove(this.path);
            return true;
        } catch (e) {
            console.error('Failed to delete file:', e);
            return false;
        }
    }
}

/**
 * Class representing a folder in the trash
 */
class TrashedFolder {
    /**
     * @param {object} vault - Obsidian vault
     * @param {string} path - Path to folder in trash
     */
    constructor(vault, path) {
        this.vault = vault;
        this.path = path;
        this.kind = 'folder';
        this.children = [];

        const pathParts = path.split('/');
        this.name = pathParts.pop();
        pathParts.shift(); // Remove .trash
        this.originalPath = pathParts.length > 0
            ? pathParts.join('/') + '/' + this.name
            : this.name;
    }

    get size() {
        return this.children.reduce((sum, child) => sum + child.size, 0);
    }

    get mtime() {
        if (this.children.length === 0) return 0;
        return Math.max(...this.children.map(c => c.mtime));
    }

    /**
     * Restore folder and contents
     * @returns {Promise<boolean>} Success status
     */
    async restore() {
        try {
            // Validate path
            if (!isValidPath(this.originalPath)) {
                console.error('Invalid restore path:', this.originalPath);
                return false;
            }

            await this.vault.adapter.mkdir(this.originalPath);
            for (const child of this.children) {
                await child.restore();
            }
            await this.vault.adapter.rmdir(this.path, true);
            return true;
        } catch (e) {
            console.error('Failed to restore folder:', e);
            return false;
        }
    }

    /**
     * Permanently delete folder and contents
     * @returns {Promise<boolean>} Success status
     */
    async delete() {
        try {
            await this.vault.adapter.rmdir(this.path, true);
            return true;
        } catch (e) {
            console.error('Failed to delete folder:', e);
            return false;
        }
    }
}

// ============================================================================
// TRASH MANAGER
// ============================================================================

/**
 * Manages trash folder operations
 */
class TrashManager {
    /**
     * @param {object} vault - Obsidian vault
     */
    constructor(vault) {
        this.vault = vault;
        this.items = [];
    }

    /**
     * Refresh the list of trashed items
     * @returns {Promise<void>}
     */
    async refresh() {
        this.items = [];

        const trashExists = await this.vault.adapter.exists(TRASH_FOLDER);
        if (!trashExists) return;

        await this.scanFolder(TRASH_FOLDER);
    }

    /**
     * Recursively scan a folder for trashed items
     * @param {string} folderPath - Path to scan
     * @param {TrashedFolder} parent - Parent folder if any
     */
    async scanFolder(folderPath, parent = null) {
        try {
            const listing = await this.vault.adapter.list(folderPath);

            for (const filePath of listing.files) {
                const stat = await this.vault.adapter.stat(filePath);
                const file = new TrashedFile(this.vault, filePath, stat);

                if (parent) {
                    parent.children.push(file);
                } else {
                    this.items.push(file);
                }
            }

            for (const subFolder of listing.folders) {
                if (subFolder === TRASH_FOLDER) continue;

                const folder = new TrashedFolder(this.vault, subFolder);

                await this.scanFolder(subFolder, folder);

                if (parent) {
                    parent.children.push(folder);
                } else {
                    this.items.push(folder);
                }
            }
        } catch (e) {
            console.error('Failed to scan folder:', e);
        }
    }

    /**
     * Empty the entire trash
     * @returns {Promise<void>}
     */
    async empty() {
        for (const item of this.items) {
            await item.delete();
        }
        this.items = [];
    }

    /**
     * Purge files older than specified days
     * @param {number} days - Age threshold in days
     * @returns {Promise<number>} Number of items purged
     */
    async purgeOlderThan(days) {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        let count = 0;

        for (const item of [...this.items]) {
            if (item.mtime < cutoff) {
                await item.delete();
                this.items = this.items.filter(i => i !== item);
                count++;
            }
        }

        return count;
    }

    /**
     * Sort items by criteria
     * @param {string} sortBy - Sort field
     * @param {string} order - Sort order
     */
    sort(sortBy, order = 'desc') {
        this.items.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'date':
                default:
                    comparison = a.mtime - b.mtime;
            }

            return order === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Filter items by search query
     * @param {string} query - Search string
     * @returns {Array} Filtered items
     */
    filter(query) {
        if (!query || !query.trim()) return this.items;

        const lowerQuery = query.toLowerCase();
        return this.items.filter(item =>
            item.name.toLowerCase().includes(lowerQuery)
        );
    }
}

// ============================================================================
// FILE PREVIEW VIEW (Main Tab)
// ============================================================================

/**
 * File preview view that opens in a main tab
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
    }

    getViewType() {
        return PREVIEW_VIEW_TYPE;
    }

    getDisplayText() {
        return this.file ? `🗑️ ${this.file.name}` : t('trashedFilePreview');
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
        await this.render();
        this.leaf.updateHeader();
    }

    async render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('recycle-bin-preview-container');

        if (!this.file) {
            container.createEl('p', { text: t('noFileSelected') });
            return;
        }

        // Info banner
        const banner = container.createDiv({ cls: 'recycle-bin-preview-banner' });
        banner.innerHTML = `
            <div class="recycle-bin-preview-banner-icon">🗑️</div>
            <div class="recycle-bin-preview-banner-text">
                <strong>${t('fileInBin')}</strong><br>
                <span>${t('originalLocation')}: ${escapeHtml(this.file.originalPath)} • ${formatFileSize(this.file.size)} • ${t('deleted')} ${formatDate(this.file.mtime)}</span>
            </div>
        `;

        // Action buttons in banner
        const actions = banner.createDiv({ cls: 'recycle-bin-preview-banner-actions' });

        const restoreBtn = actions.createEl('button', { text: '↩ ' + t('restore'), cls: 'recycle-bin-btn restore' });
        restoreBtn.onclick = async () => {
            if (await this.file.restore()) {
                new obsidian.Notice(t('restored', { name: this.file.name }));
                const restoredFile = this.app.vault.getAbstractFileByPath(this.file.originalPath);
                if (restoredFile) {
                    await this.leaf.openFile(restoredFile);
                } else {
                    this.leaf.detach();
                }
                await this.plugin.refreshViews();
            } else {
                new obsidian.Notice(t('cannotRestore'), 5000);
            }
        };

        const deleteBtn = actions.createEl('button', { text: '✕ ' + t('deleteForever'), cls: 'recycle-bin-btn danger' });
        deleteBtn.onclick = async () => {
            if (this.plugin.settings.showConfirmations) {
                new ConfirmModal(
                    this.app,
                    t('deletePermanently'),
                    t('deleteConfirmMessage', { name: this.file.name }),
                    t('delete'),
                    async () => {
                        await this.file.delete();
                        new obsidian.Notice(t('deleted', { name: this.file.name }));
                        this.leaf.detach();
                        await this.plugin.refreshViews();
                    }
                ).open();
            } else {
                await this.file.delete();
                new obsidian.Notice(t('deleted', { name: this.file.name }));
                this.leaf.detach();
                await this.plugin.refreshViews();
            }
        };

        // Content area
        const content = container.createDiv({ cls: 'recycle-bin-preview-content' });
        const ext = this.file.extension;

        if (['md', 'markdown', 'txt', 'js', 'ts', 'css', 'html', 'json', 'xml', 'yaml', 'yml'].includes(ext)) {
            // Text file preview
            try {
                const text = await this.app.vault.adapter.read(this.file.path);
                if (ext === 'md' || ext === 'markdown') {
                    await obsidian.MarkdownRenderer.renderMarkdown(text, content, this.file.path, this);
                } else {
                    const pre = content.createEl('pre');
                    const code = pre.createEl('code');
                    code.textContent = text;
                    code.className = `language-${ext}`;
                }
            } catch (e) {
                content.createEl('p', { text: `Error loading file: ${e.message}` });
            }
        } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
            // Image preview
            try {
                const arrayBuffer = await this.app.vault.adapter.readBinary(this.file.path);
                const blob = new Blob([arrayBuffer]);
                const url = URL.createObjectURL(blob);
                const img = content.createEl('img', { cls: 'recycle-bin-preview-image' });
                img.src = url;
                img.alt = this.file.name;
                this.register(() => URL.revokeObjectURL(url));
            } catch (e) {
                content.createEl('p', { text: t('unableToLoadImage') + `: ${e.message}` });
            }
        } else {
            // Unsupported format
            content.createDiv({ cls: 'recycle-bin-unsupported' }).innerHTML = `
                <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                <p>${t('previewNotAvailable')} <strong>.${ext}</strong> ${t('files')}</p>
                <p style="color: var(--text-muted);">${t('restoreToView')}</p>
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
            text: t('cancel'),
            cls: 'recycle-bin-btn'
        });
        cancelBtn.onclick = () => this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}

// ============================================================================
// RECYCLE BIN VIEW (Sidebar)
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
        this.searchQuery = '';
        this.sortBy = plugin.settings.sortBy || 'date';
        this.sortOrder = plugin.settings.sortOrder || 'desc';
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return t('recycleBin');
    }

    getIcon() {
        return 'trash-2';
    }

    async onOpen() {
        await this.render();
    }

    onClose() {
        // Cleanup
    }

    /**
     * Render the view
     */
    async render() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('recycle-bin-container');

        await this.plugin.trashManager.refresh();

        // Toolbar
        this.renderToolbar(container);

        // Content
        const content = container.createDiv({ cls: 'recycle-bin-content' });

        const filteredItems = this.plugin.trashManager.filter(this.searchQuery);
        this.plugin.trashManager.sort(this.sortBy, this.sortOrder);

        if (filteredItems.length === 0) {
            this.renderEmptyState(content);
        } else {
            const list = content.createDiv({ cls: 'recycle-bin-list' });
            for (const item of filteredItems) {
                this.renderItem(list, item);
            }
        }
    }

    /**
     * Refresh the view
     */
    async refresh() {
        await this.render();
    }

    /**
     * Render toolbar
     * @param {HTMLElement} container
     */
    renderToolbar(container) {
        const toolbar = container.createDiv({ cls: 'recycle-bin-toolbar' });

        // Search
        const search = toolbar.createEl('input', {
            type: 'text',
            cls: 'recycle-bin-search',
            placeholder: t('searchPlaceholder')
        });
        search.value = this.searchQuery;
        search.oninput = debounce((e) => {
            this.searchQuery = e.target.value;
            this.render();
        }, 200);

        // Sort dropdown
        const sort = toolbar.createEl('select', { cls: 'recycle-bin-sort' });
        const sortOptions = [
            { value: 'date-desc', text: t('sortNewest') },
            { value: 'date-asc', text: t('sortOldest') },
            { value: 'name-asc', text: t('sortNameAZ') },
            { value: 'name-desc', text: t('sortNameZA') },
            { value: 'size-desc', text: t('sortLargest') },
            { value: 'size-asc', text: t('sortSmallest') }
        ];
        for (const opt of sortOptions) {
            const option = sort.createEl('option', { value: opt.value, text: opt.text });
            if (`${this.sortBy}-${this.sortOrder}` === opt.value) {
                option.selected = true;
            }
        }
        sort.onchange = (e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            this.sortBy = sortBy;
            this.sortOrder = sortOrder;
            this.render();
        };

        // Buttons
        const buttons = toolbar.createDiv({ cls: 'recycle-bin-toolbar-buttons' });

        const refreshBtn = buttons.createEl('button', { text: '🔄', cls: 'recycle-bin-toolbar-btn', attr: { title: t('refresh') } });
        refreshBtn.onclick = () => this.refresh();

        const emptyBtn = buttons.createEl('button', { text: '🗑️', cls: 'recycle-bin-toolbar-btn danger', attr: { title: t('emptyAll') } });
        emptyBtn.onclick = () => this.emptyAll();
    }

    /**
     * Render empty state
     * @param {HTMLElement} container
     */
    renderEmptyState(container) {
        const empty = container.createDiv({ cls: 'recycle-bin-empty' });
        empty.createDiv({ cls: 'recycle-bin-empty-icon', text: '🗑️' });

        // Check if using Obsidian's .trash folder
        const trashOption = this.app.vault.config.trashOption || 'system';

        if (trashOption !== 'local') {
            // Show warning that plugin won't work with current setting
            empty.createEl('p', { text: t('binNotConfigured') });
            const warning = empty.createEl('small');
            warning.style.color = 'var(--text-warning)';
            warning.innerHTML = t('usingSystemTrash') + '<br>' + t('goToSettings');
        } else {
            empty.createEl('p', { text: t('binEmpty') });
            empty.createEl('small', { text: t('deletedFilesAppear') });
        }
    }

    /**
     * Get file icon
     * @param {string} ext - File extension
     * @returns {string} Emoji icon
     */
    getFileIcon(ext) {
        return FILE_ICONS[ext] || FILE_ICONS.default;
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
        content.createDiv({ cls: 'recycle-bin-item-name', text: item.name });

        // Metadata
        if (this.plugin.settings.showMetadata) {
            const meta = content.createDiv({ cls: 'recycle-bin-item-meta' });
            meta.createSpan({ text: formatFileSize(item.size) });
            meta.createSpan({ text: '•' });
            meta.createSpan({ text: formatDate(item.mtime) });
        }

        // Actions
        const actions = itemEl.createDiv({ cls: 'recycle-bin-item-actions' });

        // Restore button
        const restoreBtn = actions.createEl('button', { text: '↩', cls: 'recycle-bin-item-btn restore', attr: { title: t('restore') } });
        restoreBtn.onclick = async (e) => {
            e.stopPropagation();
            await this.restoreItem(item);
        };

        // Delete button (optional)
        if (this.plugin.settings.showDeleteButton) {
            const deleteBtn = actions.createEl('button', { text: '✕', cls: 'recycle-bin-item-btn delete', attr: { title: t('deletePermanently') } });
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                await this.deleteItem(item);
            };
        }

        // Click to preview (files only)
        if (item.kind === 'file') {
            itemEl.onclick = () => this.openFilePreview(item);
        }
    }

    /**
     * Open file preview in main tab
     * @param {TrashedFile} file
     */
    async openFilePreview(file) {
        const leaf = this.app.workspace.getLeaf('tab');
        await leaf.setViewState({
            type: PREVIEW_VIEW_TYPE,
            active: true
        });

        const view = leaf.view;
        if (view instanceof FilePreviewView) {
            await view.setFile(file);
        }
    }

    /**
     * Restore an item
     * @param {TrashedFile|TrashedFolder} item
     */
    async restoreItem(item) {
        if (await item.restore()) {
            new obsidian.Notice(t('restored', { name: item.name }));
            await this.refresh();
        } else {
            new obsidian.Notice(t('cannotRestore'), 5000);
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
                t('deletePermanently'),
                t('deleteConfirmMessage', { name: item.name }),
                t('delete'),
                async () => {
                    await item.delete();
                    new obsidian.Notice(t('deleted', { name: item.name }));
                    await this.refresh();
                }
            ).open();
        } else {
            await item.delete();
            new obsidian.Notice(t('deleted', { name: item.name }));
            await this.refresh();
        }
    }

    /**
     * Empty all items from trash
     */
    async emptyAll() {
        if (this.plugin.trashManager.items.length === 0) {
            new obsidian.Notice(t('binAlreadyEmpty'));
            return;
        }

        if (this.plugin.settings.showConfirmations) {
            new ConfirmModal(
                this.app,
                t('emptyBin'),
                t('emptyBinConfirmMessage'),
                t('emptyAll'),
                async () => {
                    await this.plugin.trashManager.empty();
                    new obsidian.Notice(t('binEmptied'));
                    await this.refresh();
                }
            ).open();
        } else {
            await this.plugin.trashManager.empty();
            new obsidian.Notice(t('binEmptied'));
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

        containerEl.createEl('h2', { text: t('recycleBinSettings') });

        // =============================================
        // TRASH LOCATION SECTION
        // =============================================
        containerEl.createEl('h3', { text: t('trashLocation') });

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
                <strong style="color: var(--text-success);">${t('usingObsidianTrash')}</strong><br>
                <span style="color: var(--text-muted);">${t('deletedFilesWillAppear')}</span>
            `;
        } else if (currentTrashOption === 'system') {
            trashExplanation.innerHTML = `
                <strong style="color: var(--text-warning);">${t('usingSystemTrashWarning')}</strong><br>
                <span style="color: var(--text-muted);">${t('systemTrashWarningDesc')}</span>
            `;
        } else {
            trashExplanation.innerHTML = `
                <strong style="color: var(--text-error);">${t('permanentDeleteWarning')}</strong><br>
                <span style="color: var(--text-muted);">${t('permanentDeleteWarningDesc')}</span>
            `;
        }

        // Dropdown to change trash location
        new obsidian.Setting(containerEl)
            .setName(t('deletedFilesLocation'))
            .setDesc(t('deletedFilesLocationDesc'))
            .addDropdown(dropdown => dropdown
                .addOption('local', t('obsidianTrashFolder'))
                .addOption('system', t('systemTrash'))
                .addOption('none', t('permanentDelete'))
                .setValue(currentTrashOption)
                .onChange(async (value) => {
                    // Update Obsidian's vault config and save it properly
                    this.app.vault.config.trashOption = value;

                    // Try multiple methods to persist the setting
                    try {
                        await this.app.vault.setConfig('trashOption', value);

                        const configPath = this.app.vault.configDir + '/app.json';
                        const configContent = JSON.stringify(this.app.vault.config, null, 2);
                        await this.app.vault.adapter.write(configPath, configContent);
                    } catch (e) {
                        console.error('Failed to save trash config:', e);
                    }

                    new obsidian.Notice(t('trashLocationChanged') + ': ' + (value === 'local' ? 'Obsidian .trash' : value === 'system' ? 'System' : 'Permanent'));
                    this.display();
                }));

        containerEl.createEl('hr');

        // =============================================
        // PLUGIN SETTINGS SECTION  
        // =============================================
        containerEl.createEl('h3', { text: t('pluginSettings') });

        const isPluginEnabled = currentTrashOption === 'local';

        if (!isPluginEnabled) {
            const disabledNotice = containerEl.createDiv({ cls: 'setting-item-description' });
            disabledNotice.style.marginBottom = '12px';
            disabledNotice.style.padding = '12px';
            disabledNotice.style.background = 'var(--background-modifier-error)';
            disabledNotice.style.borderRadius = '6px';
            disabledNotice.style.color = 'var(--text-on-accent)';
            disabledNotice.innerHTML = `
                <strong>${t('settingsDisabled')}</strong><br>
                ${t('settingsDisabledDesc')}
            `;
        }

        const settingsContainer = containerEl.createDiv();
        if (!isPluginEnabled) {
            settingsContainer.style.opacity = '0.4';
            settingsContainer.style.pointerEvents = 'none';
        }

        // Auto-purge toggle
        new obsidian.Setting(settingsContainer)
            .setName(t('autoPurge'))
            .setDesc(t('autoPurgeDesc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoPurgeEnabled)
                .setDisabled(!isPluginEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.autoPurgeEnabled = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.autoPurgeEnabled) {
            new obsidian.Setting(settingsContainer)
                .setName(t('autoPurgeDays'))
                .setDesc(t('autoPurgeDaysDesc'))
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
            .setName(t('showConfirmations'))
            .setDesc(t('showConfirmationsDesc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showConfirmations)
                .setDisabled(!isPluginEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.showConfirmations = value;
                    await this.plugin.saveSettings();
                }));

        // Show metadata
        new obsidian.Setting(settingsContainer)
            .setName(t('showMetadata'))
            .setDesc(t('showMetadataDesc'))
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
            .setName(t('showDeleteButton'))
            .setDesc(t('showDeleteButtonDesc'))
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showDeleteButton)
                .setDisabled(!isPluginEnabled)
                .onChange(async (value) => {
                    this.plugin.settings.showDeleteButton = value;
                    await this.plugin.saveSettings();
                    await this.plugin.refreshViews();
                }));

        // Language setting
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: '🌍 ' + t('language') });

        new obsidian.Setting(containerEl)
            .setName(t('language'))
            .setDesc(t('languageDesc'))
            .addDropdown(dropdown => {
                dropdown.addOption('auto', t('languageAuto'));
                dropdown.addOption('en', 'English');
                dropdown.addOption('de', 'Deutsch');
                dropdown.addOption('zh', '中文');
                dropdown.addOption('ja', '日本語');
                dropdown.addOption('es', 'Español');
                dropdown.addOption('fr', 'Français');
                dropdown.addOption('pt', 'Português');
                dropdown.addOption('ru', 'Русский');
                dropdown.setValue(this.plugin.settings.language);
                dropdown.onChange(async (value) => {
                    this.plugin.settings.language = value;
                    currentLanguage = getLanguage(this.app, this.plugin.settings);
                    setLanguage(currentLanguage);
                    await this.plugin.saveSettings();
                    this.display();
                    await this.plugin.refreshViews();
                });
            });

        const translationNote = containerEl.createEl('p', { cls: 'setting-item-description' });
        translationNote.style.marginTop = '8px';
        translationNote.innerHTML = t('translationNote');

        // Acknowledgements
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: t('acknowledgements') });
        const ack = containerEl.createEl('p');
        ack.innerHTML = t('acknowledgementsText');
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

        // Initialize language
        currentLanguage = getLanguage(this.app, this.settings);
        setLanguage(currentLanguage);

        // Initialize trash manager
        this.trashManager = new TrashManager(this.app.vault);
        await this.trashManager.refresh();

        // Register views
        this.registerView(
            VIEW_TYPE,
            (leaf) => new RecycleBinView(leaf, this)
        );

        this.registerView(
            PREVIEW_VIEW_TYPE,
            (leaf) => new FilePreviewView(leaf, this)
        );

        // Add ribbon icon
        this.addRibbonIcon('trash-2', t('recycleBin'), () => {
            this.activateView();
        });

        // Add command
        this.addCommand({
            id: 'open-recycle-bin',
            name: t('recycleBin'),
            callback: () => this.activateView()
        });

        this.addCommand({
            id: 'empty-recycle-bin',
            name: t('emptyBin'),
            callback: async () => {
                await this.trashManager.refresh();
                if (this.trashManager.items.length === 0) {
                    new obsidian.Notice(t('binAlreadyEmpty'));
                    return;
                }
                new ConfirmModal(
                    this.app,
                    t('emptyBin'),
                    t('emptyBinConfirmMessage'),
                    t('emptyAll'),
                    async () => {
                        await this.trashManager.empty();
                        new obsidian.Notice(t('binEmptied'));
                        await this.refreshViews();
                    }
                ).open();
            }
        });

        // Add settings tab
        this.addSettingTab(new RecycleBinSettingTab(this.app, this));

        // Run auto-purge on load if enabled
        if (this.settings.autoPurgeEnabled) {
            const purged = await this.trashManager.purgeOlderThan(this.settings.autoPurgeDays);
            if (purged > 0) {
                new obsidian.Notice(t('autoPurged', { count: purged }));
            }
        }
    }

    onunload() {
        console.log('Unloading Recycle Bin plugin');
        this.app.workspace.detachLeavesOfType(VIEW_TYPE);
        this.app.workspace.detachLeavesOfType(PREVIEW_VIEW_TYPE);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Activate the recycle bin view
     */
    async activateView() {
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE);
        if (existing.length) {
            this.app.workspace.revealLeaf(existing[0]);
        } else {
            await this.app.workspace.getRightLeaf(false).setViewState({
                type: VIEW_TYPE,
                active: true
            });
        }
    }

    /**
     * Refresh all recycle bin views
     */
    async refreshViews() {
        await this.trashManager.refresh();
        for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
            if (leaf.view instanceof RecycleBinView) {
                await leaf.view.refresh();
            }
        }
    }
}

module.exports = RecycleBinPlugin;
