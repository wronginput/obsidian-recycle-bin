/**
 * Recycle Bin Plugin - Constants and Settings
 * 
 * @module constants
 */

'use strict';

// View type identifiers
const VIEW_TYPE = 'recycle-bin-view';
const PREVIEW_VIEW_TYPE = 'recycle-bin-preview';
const PLUGIN_ID = 'recycle-bin';
const TRASH_FOLDER = '.trash';

// Default plugin settings
const DEFAULT_SETTINGS = {
    autoPurgeEnabled: false,
    autoPurgeDays: 90,
    showConfirmations: true,
    showMetadata: true,
    showDeleteButton: false,
    sortBy: 'date',
    sortOrder: 'desc',
    language: 'auto'
};

// File type categories for icons and preview
const FILE_TYPES = {
    markdown: ['md', 'markdown'],
    code: ['js', 'ts', 'jsx', 'tsx', 'css', 'scss', 'less', 'html', 'json', 'xml', 'yaml', 'yml', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'go', 'rs', 'php', 'sh', 'bash'],
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    archive: ['zip', 'tar', 'gz', 'rar', '7z'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
    video: ['mp4', 'webm', 'mov', 'avi', 'mkv']
};

// File icons by extension
const FILE_ICONS = {
    md: '📝',
    txt: '📄',
    pdf: '📕',
    js: '💛',
    ts: '💙',
    css: '💜',
    html: '🧡',
    json: '📋',
    png: '🖼️',
    jpg: '🖼️',
    gif: '🎞️',
    svg: '🎨',
    mp3: '🎵',
    mp4: '🎬',
    zip: '📦',
    default: '📄'
};

module.exports = {
    VIEW_TYPE,
    PREVIEW_VIEW_TYPE,
    PLUGIN_ID,
    TRASH_FOLDER,
    DEFAULT_SETTINGS,
    FILE_TYPES,
    FILE_ICONS
};
