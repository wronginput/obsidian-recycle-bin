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

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'de', 'zh', 'ja', 'es', 'fr', 'pt', 'ru'];

// ============================================================================
// TRANSLATIONS (i18n)
// ============================================================================
// 
// NOTE: These translations were generated using AI and may contain errors.
// If you find a mistake, please open an issue or PR on GitHub!
// Native speakers are welcome to contribute corrections.
//
// ============================================================================

const TRANSLATIONS = {
    // English (default)
    en: {
        // General
        recycleBin: 'Recycle Bin',
        recycleBinSettings: 'Recycle Bin Settings',
        trashedFilePreview: 'Trashed File Preview',

        // Empty state
        binEmpty: 'Your recycle bin is empty',
        deletedFilesAppear: 'Deleted files will appear here',
        binNotConfigured: 'Recycle Bin is not configured',
        usingSystemTrash: "⚠️ You're using System Trash.",
        goToSettings: 'Go to Settings → Recycle Bin to enable.',

        // Actions
        restore: 'Restore',
        deleteForever: 'Delete Forever',
        emptyAll: 'Empty All',
        refresh: 'Refresh',
        close: 'Close',
        cancel: 'Cancel',
        delete: 'Delete',
        preview: 'Preview',

        // File info
        originalLocation: 'Original location',
        size: 'Size',
        deleted: 'Deleted',
        items: 'items',

        // Time
        today: 'Today',
        yesterday: 'Yesterday',
        daysAgo: 'days ago',
        unknown: 'Unknown',

        // Trash banner
        fileInBin: 'This file is in the Recycle Bin',

        // Settings - Trash location
        trashLocation: '📍 Trash Location',
        deletedFilesLocation: 'Deleted files location',
        deletedFilesLocationDesc: 'Choose where deleted files should go. "Obsidian .trash" is required for this plugin to work.',
        obsidianTrashFolder: '📁 Obsidian .trash folder (recommended)',
        systemTrash: '🗑️ System trash',
        permanentDelete: '⚠️ Permanently delete (no recovery)',
        usingObsidianTrash: "✓ Using Obsidian's .trash folder",
        deletedFilesWillAppear: 'Deleted files will appear in this Recycle Bin.',
        usingSystemTrashWarning: '⚠ Using System Trash',
        systemTrashWarningDesc: 'Deleted files go to your OS trash, not this Recycle Bin. Change below to use this plugin.',
        permanentDeleteWarning: '⚠ Permanent Deletion Enabled',
        permanentDeleteWarningDesc: 'Deleted files are immediately destroyed! Change below to enable recovery.',
        trashLocationChanged: 'Trash location changed to',

        // Settings - Plugin settings
        pluginSettings: '⚙️ Plugin Settings',
        settingsDisabled: '⚠️ Settings disabled',
        settingsDisabledDesc: 'Change "Deleted files location" above to "Obsidian .trash folder" to enable this plugin.',

        autoPurge: 'Auto-purge old files',
        autoPurgeDesc: 'Automatically delete files older than a specified number of days',
        autoPurgeDays: 'Auto-purge after (days)',
        autoPurgeDaysDesc: 'Delete files older than this many days',

        showConfirmations: 'Show confirmation dialogs',
        showConfirmationsDesc: 'Ask for confirmation before deleting or emptying trash',

        showMetadata: 'Show file metadata',
        showMetadataDesc: 'Display file size and deletion date in the list',

        showDeleteButton: 'Show per-item delete button',
        showDeleteButtonDesc: 'Show a delete button on each item to permanently delete individual files',

        language: 'Language',
        languageDesc: 'Choose display language (auto = detect from Obsidian)',
        languageAuto: 'Auto-detect',

        // Settings - Acknowledgements
        acknowledgements: 'Acknowledgements',
        acknowledgementsText: 'This plugin was inspired by <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a> by <strong>Per Mortensen</strong>. Thank you for the original concept and inspiration!',
        translationNote: '🌍 Translations were generated by AI. <a href="https://github.com/wronginput/obsidian-recycle-bin/issues">Report errors</a>',

        // Modals
        deletePermanently: 'Delete permanently',
        deleteConfirmMessage: 'Are you sure you want to permanently delete "{name}"? This cannot be undone.',
        emptyBin: 'Empty recycle bin',
        emptyBinConfirmMessage: 'Are you sure you want to permanently delete ALL files in the recycle bin? This cannot be undone!',

        // Notices
        restored: 'Restored "{name}"',
        deleted: 'Deleted "{name}"',
        cannotRestore: 'Cannot restore: file already exists at original location',
        binEmptied: 'Recycle bin emptied',
        binAlreadyEmpty: 'Recycle bin is already empty',
        autoPurged: 'Auto-purged {count} old file(s) from recycle bin',

        // Toolbar
        searchPlaceholder: 'Search deleted files...',
        sortNewest: 'Newest first',
        sortOldest: 'Oldest first',
        sortNameAZ: 'Name A-Z',
        sortNameZA: 'Name Z-A',
        sortLargest: 'Largest first',
        sortSmallest: 'Smallest first',

        // Preview
        previewNotAvailable: 'Preview not available for',
        files: 'files',
        restoreToView: 'Restore the file to view it normally',
        unableToLoadImage: 'Unable to load image',
        noFileSelected: 'No file selected'
    },

    // German
    de: {
        recycleBin: 'Papierkorb',
        recycleBinSettings: 'Papierkorb-Einstellungen',
        trashedFilePreview: 'Gelöschte Datei Vorschau',
        binEmpty: 'Dein Papierkorb ist leer',
        deletedFilesAppear: 'Gelöschte Dateien erscheinen hier',
        binNotConfigured: 'Papierkorb ist nicht konfiguriert',
        usingSystemTrash: '⚠️ Du verwendest den System-Papierkorb.',
        goToSettings: 'Gehe zu Einstellungen → Papierkorb zum Aktivieren.',
        restore: 'Wiederherstellen',
        deleteForever: 'Endgültig löschen',
        emptyAll: 'Alles leeren',
        refresh: 'Aktualisieren',
        close: 'Schließen',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        preview: 'Vorschau',
        originalLocation: 'Ursprünglicher Speicherort',
        size: 'Größe',
        deleted: 'Gelöscht',
        items: 'Elemente',
        today: 'Heute',
        yesterday: 'Gestern',
        daysAgo: 'Tagen',
        unknown: 'Unbekannt',
        fileInBin: 'Diese Datei befindet sich im Papierkorb',
        trashLocation: '📍 Papierkorb-Speicherort',
        deletedFilesLocation: 'Speicherort für gelöschte Dateien',
        deletedFilesLocationDesc: 'Wähle, wohin gelöschte Dateien gehen sollen. "Obsidian .trash" ist für dieses Plugin erforderlich.',
        obsidianTrashFolder: '📁 Obsidian .trash Ordner (empfohlen)',
        systemTrash: '🗑️ System-Papierkorb',
        permanentDelete: '⚠️ Endgültig löschen (keine Wiederherstellung)',
        usingObsidianTrash: '✓ Verwendet Obsidians .trash-Ordner',
        deletedFilesWillAppear: 'Gelöschte Dateien erscheinen in diesem Papierkorb.',
        usingSystemTrashWarning: '⚠ Verwendet System-Papierkorb',
        systemTrashWarningDesc: 'Gelöschte Dateien gehen in den OS-Papierkorb, nicht in diesen. Ändere unten, um dieses Plugin zu verwenden.',
        permanentDeleteWarning: '⚠ Endgültiges Löschen aktiviert',
        permanentDeleteWarningDesc: 'Gelöschte Dateien werden sofort zerstört! Ändere unten, um Wiederherstellung zu ermöglichen.',
        trashLocationChanged: 'Papierkorb-Speicherort geändert zu',
        pluginSettings: '⚙️ Plugin-Einstellungen',
        settingsDisabled: '⚠️ Einstellungen deaktiviert',
        settingsDisabledDesc: 'Ändere "Speicherort für gelöschte Dateien" oben zu "Obsidian .trash Ordner", um dieses Plugin zu aktivieren.',
        autoPurge: 'Alte Dateien automatisch löschen',
        autoPurgeDesc: 'Automatisch Dateien löschen, die älter als eine bestimmte Anzahl von Tagen sind',
        autoPurgeDays: 'Automatisch löschen nach (Tagen)',
        autoPurgeDaysDesc: 'Dateien löschen, die älter als diese Anzahl von Tagen sind',
        showConfirmations: 'Bestätigungsdialoge anzeigen',
        showConfirmationsDesc: 'Vor dem Löschen oder Leeren des Papierkorbs um Bestätigung bitten',
        showMetadata: 'Datei-Metadaten anzeigen',
        showMetadataDesc: 'Dateigröße und Löschdatum in der Liste anzeigen',
        showDeleteButton: 'Löschen-Schaltfläche pro Element anzeigen',
        showDeleteButtonDesc: 'Eine Löschen-Schaltfläche auf jedem Element anzeigen, um einzelne Dateien endgültig zu löschen',
        language: 'Sprache',
        languageDesc: 'Anzeigesprache wählen (auto = von Obsidian erkennen)',
        languageAuto: 'Automatisch erkennen',
        acknowledgements: 'Danksagungen',
        acknowledgementsText: 'Dieses Plugin wurde inspiriert von <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a> von <strong>Per Mortensen</strong>. Danke für das ursprüngliche Konzept und die Inspiration!',
        translationNote: '🌍 Übersetzungen wurden von KI generiert. <a href="https://github.com/wronginput/obsidian-recycle-bin/issues">Fehler melden</a>',
        deletePermanently: 'Endgültig löschen',
        deleteConfirmMessage: 'Bist du sicher, dass du "{name}" endgültig löschen möchtest? Dies kann nicht rückgängig gemacht werden.',
        emptyBin: 'Papierkorb leeren',
        emptyBinConfirmMessage: 'Bist du sicher, dass du ALLE Dateien im Papierkorb endgültig löschen möchtest? Dies kann nicht rückgängig gemacht werden!',
        restored: '"{name}" wiederhergestellt',
        cannotRestore: 'Kann nicht wiederherstellen: Datei existiert bereits am ursprünglichen Speicherort',
        binEmptied: 'Papierkorb geleert',
        binAlreadyEmpty: 'Papierkorb ist bereits leer',
        autoPurged: '{count} alte Datei(en) automatisch aus dem Papierkorb gelöscht',
        searchPlaceholder: 'Gelöschte Dateien suchen...',
        sortNewest: 'Neueste zuerst',
        sortOldest: 'Älteste zuerst',
        sortNameAZ: 'Name A-Z',
        sortNameZA: 'Name Z-A',
        sortLargest: 'Größte zuerst',
        sortSmallest: 'Kleinste zuerst',
        previewNotAvailable: 'Vorschau nicht verfügbar für',
        files: 'Dateien',
        restoreToView: 'Stelle die Datei wieder her, um sie normal anzuzeigen',
        unableToLoadImage: 'Bild konnte nicht geladen werden',
        noFileSelected: 'Keine Datei ausgewählt'
    },

    // Chinese (Simplified)
    zh: {
        recycleBin: '回收站',
        recycleBinSettings: '回收站设置',
        trashedFilePreview: '已删除文件预览',
        binEmpty: '回收站是空的',
        deletedFilesAppear: '已删除的文件将显示在这里',
        binNotConfigured: '回收站未配置',
        usingSystemTrash: '⚠️ 您正在使用系统回收站。',
        goToSettings: '前往 设置 → 回收站 以启用。',
        restore: '恢复',
        deleteForever: '永久删除',
        emptyAll: '清空全部',
        refresh: '刷新',
        close: '关闭',
        cancel: '取消',
        delete: '删除',
        preview: '预览',
        originalLocation: '原始位置',
        size: '大小',
        deleted: '已删除',
        items: '项目',
        today: '今天',
        yesterday: '昨天',
        daysAgo: '天前',
        unknown: '未知',
        fileInBin: '此文件在回收站中',
        trashLocation: '📍 回收站位置',
        deletedFilesLocation: '已删除文件位置',
        deletedFilesLocationDesc: '选择已删除文件的存放位置。此插件需要"Obsidian .trash"。',
        obsidianTrashFolder: '📁 Obsidian .trash 文件夹（推荐）',
        systemTrash: '🗑️ 系统回收站',
        permanentDelete: '⚠️ 永久删除（无法恢复）',
        usingObsidianTrash: '✓ 正在使用 Obsidian 的 .trash 文件夹',
        deletedFilesWillAppear: '已删除的文件将显示在此回收站中。',
        usingSystemTrashWarning: '⚠ 正在使用系统回收站',
        systemTrashWarningDesc: '已删除的文件会进入系统回收站，而非此回收站。请在下方更改以使用此插件。',
        permanentDeleteWarning: '⚠ 已启用永久删除',
        permanentDeleteWarningDesc: '已删除的文件会被立即销毁！请在下方更改以启用恢复功能。',
        trashLocationChanged: '回收站位置已更改为',
        pluginSettings: '⚙️ 插件设置',
        settingsDisabled: '⚠️ 设置已禁用',
        settingsDisabledDesc: '请将上方的"已删除文件位置"更改为"Obsidian .trash 文件夹"以启用此插件。',
        autoPurge: '自动清除旧文件',
        autoPurgeDesc: '自动删除超过指定天数的文件',
        autoPurgeDays: '自动清除天数',
        autoPurgeDaysDesc: '删除超过此天数的文件',
        showConfirmations: '显示确认对话框',
        showConfirmationsDesc: '在删除或清空回收站之前确认',
        showMetadata: '显示文件元数据',
        showMetadataDesc: '在列表中显示文件大小和删除日期',
        showDeleteButton: '显示单项删除按钮',
        showDeleteButtonDesc: '在每个项目上显示删除按钮以永久删除单个文件',
        language: '语言',
        languageDesc: '选择显示语言（自动 = 从 Obsidian 检测）',
        languageAuto: '自动检测',
        acknowledgements: '致谢',
        acknowledgementsText: '此插件受到 <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a>（由 <strong>Per Mortensen</strong> 开发）的启发。感谢原创概念和灵感！',
        translationNote: '🌍 翻译由 AI 生成。<a href="https://github.com/wronginput/obsidian-recycle-bin/issues">报告错误</a>',
        deletePermanently: '永久删除',
        deleteConfirmMessage: '您确定要永久删除"{name}"吗？此操作无法撤消。',
        emptyBin: '清空回收站',
        emptyBinConfirmMessage: '您确定要永久删除回收站中的所有文件吗？此操作无法撤消！',
        restored: '已恢复"{name}"',
        cannotRestore: '无法恢复：原位置已存在该文件',
        binEmptied: '回收站已清空',
        binAlreadyEmpty: '回收站已经是空的',
        autoPurged: '已自动从回收站清除 {count} 个旧文件',
        searchPlaceholder: '搜索已删除的文件...',
        sortNewest: '最新优先',
        sortOldest: '最旧优先',
        sortNameAZ: '名称 A-Z',
        sortNameZA: '名称 Z-A',
        sortLargest: '最大优先',
        sortSmallest: '最小优先',
        previewNotAvailable: '预览不可用',
        files: '文件',
        restoreToView: '恢复文件以正常查看',
        unableToLoadImage: '无法加载图片',
        noFileSelected: '未选择文件'
    },

    // Japanese
    ja: {
        recycleBin: 'ごみ箱',
        recycleBinSettings: 'ごみ箱の設定',
        trashedFilePreview: '削除済みファイルのプレビュー',
        binEmpty: 'ごみ箱は空です',
        deletedFilesAppear: '削除されたファイルはここに表示されます',
        binNotConfigured: 'ごみ箱が設定されていません',
        usingSystemTrash: '⚠️ システムのごみ箱を使用しています。',
        goToSettings: '設定 → ごみ箱 に移動して有効にしてください。',
        restore: '復元',
        deleteForever: '完全に削除',
        emptyAll: 'すべて削除',
        refresh: '更新',
        close: '閉じる',
        cancel: 'キャンセル',
        delete: '削除',
        preview: 'プレビュー',
        originalLocation: '元の場所',
        size: 'サイズ',
        deleted: '削除日',
        items: '項目',
        today: '今日',
        yesterday: '昨日',
        daysAgo: '日前',
        unknown: '不明',
        fileInBin: 'このファイルはごみ箱にあります',
        trashLocation: '📍 ごみ箱の場所',
        deletedFilesLocation: '削除したファイルの場所',
        deletedFilesLocationDesc: '削除したファイルの保存先を選択してください。このプラグインには「Obsidian .trash」が必要です。',
        obsidianTrashFolder: '📁 Obsidian .trash フォルダ（推奨）',
        systemTrash: '🗑️ システムのごみ箱',
        permanentDelete: '⚠️ 完全に削除（復元不可）',
        usingObsidianTrash: '✓ Obsidian の .trash フォルダを使用中',
        deletedFilesWillAppear: '削除されたファイルはこのごみ箱に表示されます。',
        usingSystemTrashWarning: '⚠ システムのごみ箱を使用中',
        systemTrashWarningDesc: '削除されたファイルはOSのごみ箱に移動し、このプラグインでは表示されません。下で変更してください。',
        permanentDeleteWarning: '⚠ 完全削除が有効',
        permanentDeleteWarningDesc: '削除されたファイルは即座に破壊されます！下で変更して復元を有効にしてください。',
        trashLocationChanged: 'ごみ箱の場所を変更しました',
        pluginSettings: '⚙️ プラグイン設定',
        settingsDisabled: '⚠️ 設定が無効です',
        settingsDisabledDesc: '上の「削除したファイルの場所」を「Obsidian .trash フォルダ」に変更してこのプラグインを有効にしてください。',
        autoPurge: '古いファイルを自動削除',
        autoPurgeDesc: '指定した日数より古いファイルを自動的に削除します',
        autoPurgeDays: '自動削除までの日数',
        autoPurgeDaysDesc: 'この日数より古いファイルを削除',
        showConfirmations: '確認ダイアログを表示',
        showConfirmationsDesc: '削除またはごみ箱を空にする前に確認を求める',
        showMetadata: 'ファイルのメタデータを表示',
        showMetadataDesc: 'リストにファイルサイズと削除日を表示',
        showDeleteButton: '項目ごとの削除ボタンを表示',
        showDeleteButtonDesc: '各項目に削除ボタンを表示して個別のファイルを完全に削除',
        language: '言語',
        languageDesc: '表示言語を選択（自動 = Obsidian から検出）',
        languageAuto: '自動検出',
        acknowledgements: '謝辞',
        acknowledgementsText: 'このプラグインは <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a>（<strong>Per Mortensen</strong> 作）からインスピレーションを受けました。オリジナルのコンセプトとインスピレーションに感謝します！',
        translationNote: '🌍 翻訳はAIによって生成されました。<a href="https://github.com/wronginput/obsidian-recycle-bin/issues">エラーを報告</a>',
        deletePermanently: '完全に削除',
        deleteConfirmMessage: '「{name}」を完全に削除してもよろしいですか？この操作は取り消せません。',
        emptyBin: 'ごみ箱を空にする',
        emptyBinConfirmMessage: 'ごみ箱内のすべてのファイルを完全に削除してもよろしいですか？この操作は取り消せません！',
        restored: '「{name}」を復元しました',
        cannotRestore: '復元できません：元の場所にファイルが既に存在します',
        binEmptied: 'ごみ箱を空にしました',
        binAlreadyEmpty: 'ごみ箱は既に空です',
        autoPurged: 'ごみ箱から {count} 個の古いファイルを自動削除しました',
        searchPlaceholder: '削除済みファイルを検索...',
        sortNewest: '新しい順',
        sortOldest: '古い順',
        sortNameAZ: '名前 A-Z',
        sortNameZA: '名前 Z-A',
        sortLargest: '大きい順',
        sortSmallest: '小さい順',
        previewNotAvailable: 'プレビューは利用できません',
        files: 'ファイル',
        restoreToView: 'ファイルを復元して通常表示',
        unableToLoadImage: '画像を読み込めません',
        noFileSelected: 'ファイルが選択されていません'
    },

    // Spanish
    es: {
        recycleBin: 'Papelera',
        recycleBinSettings: 'Ajustes de Papelera',
        trashedFilePreview: 'Vista previa de archivo eliminado',
        binEmpty: 'Tu papelera está vacía',
        deletedFilesAppear: 'Los archivos eliminados aparecerán aquí',
        binNotConfigured: 'La papelera no está configurada',
        usingSystemTrash: '⚠️ Estás usando la papelera del sistema.',
        goToSettings: 'Ve a Ajustes → Papelera para activar.',
        restore: 'Restaurar',
        deleteForever: 'Eliminar permanentemente',
        emptyAll: 'Vaciar todo',
        refresh: 'Actualizar',
        close: 'Cerrar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        preview: 'Vista previa',
        originalLocation: 'Ubicación original',
        size: 'Tamaño',
        deleted: 'Eliminado',
        items: 'elementos',
        today: 'Hoy',
        yesterday: 'Ayer',
        daysAgo: 'días',
        unknown: 'Desconocido',
        fileInBin: 'Este archivo está en la Papelera',
        trashLocation: '📍 Ubicación de la Papelera',
        deletedFilesLocation: 'Ubicación de archivos eliminados',
        deletedFilesLocationDesc: 'Elige dónde van los archivos eliminados. Se requiere "Obsidian .trash" para que este plugin funcione.',
        obsidianTrashFolder: '📁 Carpeta .trash de Obsidian (recomendado)',
        systemTrash: '🗑️ Papelera del sistema',
        permanentDelete: '⚠️ Eliminar permanentemente (sin recuperación)',
        usingObsidianTrash: '✓ Usando la carpeta .trash de Obsidian',
        deletedFilesWillAppear: 'Los archivos eliminados aparecerán en esta Papelera.',
        usingSystemTrashWarning: '⚠ Usando la papelera del sistema',
        systemTrashWarningDesc: 'Los archivos eliminados van a la papelera del SO, no a esta Papelera. Cambia abajo para usar este plugin.',
        permanentDeleteWarning: '⚠ Eliminación permanente activada',
        permanentDeleteWarningDesc: '¡Los archivos eliminados se destruyen inmediatamente! Cambia abajo para habilitar la recuperación.',
        trashLocationChanged: 'Ubicación de papelera cambiada a',
        pluginSettings: '⚙️ Ajustes del Plugin',
        settingsDisabled: '⚠️ Ajustes desactivados',
        settingsDisabledDesc: 'Cambia "Ubicación de archivos eliminados" arriba a "Carpeta .trash de Obsidian" para activar este plugin.',
        autoPurge: 'Auto-eliminar archivos antiguos',
        autoPurgeDesc: 'Eliminar automáticamente archivos más antiguos que un número especificado de días',
        autoPurgeDays: 'Auto-eliminar después de (días)',
        autoPurgeDaysDesc: 'Eliminar archivos más antiguos que este número de días',
        showConfirmations: 'Mostrar diálogos de confirmación',
        showConfirmationsDesc: 'Pedir confirmación antes de eliminar o vaciar la papelera',
        showMetadata: 'Mostrar metadatos de archivos',
        showMetadataDesc: 'Mostrar tamaño y fecha de eliminación en la lista',
        showDeleteButton: 'Mostrar botón de eliminar por elemento',
        showDeleteButtonDesc: 'Mostrar un botón de eliminar en cada elemento para eliminar archivos individuales permanentemente',
        language: 'Idioma',
        languageDesc: 'Elegir idioma de visualización (auto = detectar de Obsidian)',
        languageAuto: 'Auto-detectar',
        acknowledgements: 'Agradecimientos',
        acknowledgementsText: 'Este plugin fue inspirado por <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a> de <strong>Per Mortensen</strong>. ¡Gracias por el concepto original y la inspiración!',
        translationNote: '🌍 Las traducciones fueron generadas por IA. <a href="https://github.com/wronginput/obsidian-recycle-bin/issues">Reportar errores</a>',
        deletePermanently: 'Eliminar permanentemente',
        deleteConfirmMessage: '¿Estás seguro de que quieres eliminar permanentemente "{name}"? Esto no se puede deshacer.',
        emptyBin: 'Vaciar papelera',
        emptyBinConfirmMessage: '¿Estás seguro de que quieres eliminar permanentemente TODOS los archivos de la papelera? ¡Esto no se puede deshacer!',
        restored: '"{name}" restaurado',
        cannotRestore: 'No se puede restaurar: el archivo ya existe en la ubicación original',
        binEmptied: 'Papelera vaciada',
        binAlreadyEmpty: 'La papelera ya está vacía',
        autoPurged: 'Se eliminaron automáticamente {count} archivo(s) antiguo(s) de la papelera',
        searchPlaceholder: 'Buscar archivos eliminados...',
        sortNewest: 'Más recientes primero',
        sortOldest: 'Más antiguos primero',
        sortNameAZ: 'Nombre A-Z',
        sortNameZA: 'Nombre Z-A',
        sortLargest: 'Más grandes primero',
        sortSmallest: 'Más pequeños primero',
        previewNotAvailable: 'Vista previa no disponible para',
        files: 'archivos',
        restoreToView: 'Restaura el archivo para verlo normalmente',
        unableToLoadImage: 'No se pudo cargar la imagen',
        noFileSelected: 'Ningún archivo seleccionado'
    },

    // French
    fr: {
        recycleBin: 'Corbeille',
        recycleBinSettings: 'Paramètres de la Corbeille',
        trashedFilePreview: 'Aperçu du fichier supprimé',
        binEmpty: 'Votre corbeille est vide',
        deletedFilesAppear: 'Les fichiers supprimés apparaîtront ici',
        binNotConfigured: 'La corbeille n\'est pas configurée',
        usingSystemTrash: '⚠️ Vous utilisez la corbeille système.',
        goToSettings: 'Allez dans Paramètres → Corbeille pour activer.',
        restore: 'Restaurer',
        deleteForever: 'Supprimer définitivement',
        emptyAll: 'Tout vider',
        refresh: 'Actualiser',
        close: 'Fermer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        preview: 'Aperçu',
        originalLocation: 'Emplacement d\'origine',
        size: 'Taille',
        deleted: 'Supprimé',
        items: 'éléments',
        today: 'Aujourd\'hui',
        yesterday: 'Hier',
        daysAgo: 'jours',
        unknown: 'Inconnu',
        fileInBin: 'Ce fichier est dans la Corbeille',
        trashLocation: '📍 Emplacement de la Corbeille',
        deletedFilesLocation: 'Emplacement des fichiers supprimés',
        deletedFilesLocationDesc: 'Choisissez où vont les fichiers supprimés. "Obsidian .trash" est requis pour que ce plugin fonctionne.',
        obsidianTrashFolder: '📁 Dossier .trash d\'Obsidian (recommandé)',
        systemTrash: '🗑️ Corbeille système',
        permanentDelete: '⚠️ Supprimer définitivement (sans récupération)',
        usingObsidianTrash: '✓ Utilise le dossier .trash d\'Obsidian',
        deletedFilesWillAppear: 'Les fichiers supprimés apparaîtront dans cette Corbeille.',
        usingSystemTrashWarning: '⚠ Utilise la corbeille système',
        systemTrashWarningDesc: 'Les fichiers supprimés vont dans la corbeille de l\'OS, pas dans cette Corbeille. Changez ci-dessous pour utiliser ce plugin.',
        permanentDeleteWarning: '⚠ Suppression permanente activée',
        permanentDeleteWarningDesc: 'Les fichiers supprimés sont détruits immédiatement ! Changez ci-dessous pour activer la récupération.',
        trashLocationChanged: 'Emplacement de la corbeille changé en',
        pluginSettings: '⚙️ Paramètres du Plugin',
        settingsDisabled: '⚠️ Paramètres désactivés',
        settingsDisabledDesc: 'Changez "Emplacement des fichiers supprimés" ci-dessus en "Dossier .trash d\'Obsidian" pour activer ce plugin.',
        autoPurge: 'Supprimer automatiquement les anciens fichiers',
        autoPurgeDesc: 'Supprimer automatiquement les fichiers plus anciens qu\'un nombre spécifié de jours',
        autoPurgeDays: 'Supprimer automatiquement après (jours)',
        autoPurgeDaysDesc: 'Supprimer les fichiers plus anciens que ce nombre de jours',
        showConfirmations: 'Afficher les dialogues de confirmation',
        showConfirmationsDesc: 'Demander confirmation avant de supprimer ou vider la corbeille',
        showMetadata: 'Afficher les métadonnées des fichiers',
        showMetadataDesc: 'Afficher la taille et la date de suppression dans la liste',
        showDeleteButton: 'Afficher le bouton de suppression par élément',
        showDeleteButtonDesc: 'Afficher un bouton de suppression sur chaque élément pour supprimer définitivement des fichiers individuels',
        language: 'Langue',
        languageDesc: 'Choisir la langue d\'affichage (auto = détecter d\'Obsidian)',
        languageAuto: 'Détection automatique',
        acknowledgements: 'Remerciements',
        acknowledgementsText: 'Ce plugin a été inspiré par <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a> de <strong>Per Mortensen</strong>. Merci pour le concept original et l\'inspiration !',
        translationNote: '🌍 Les traductions ont été générées par IA. <a href="https://github.com/wronginput/obsidian-recycle-bin/issues">Signaler des erreurs</a>',
        deletePermanently: 'Supprimer définitivement',
        deleteConfirmMessage: 'Êtes-vous sûr de vouloir supprimer définitivement "{name}" ? Cette action est irréversible.',
        emptyBin: 'Vider la corbeille',
        emptyBinConfirmMessage: 'Êtes-vous sûr de vouloir supprimer définitivement TOUS les fichiers de la corbeille ? Cette action est irréversible !',
        restored: '"{name}" restauré',
        cannotRestore: 'Impossible de restaurer : le fichier existe déjà à l\'emplacement d\'origine',
        binEmptied: 'Corbeille vidée',
        binAlreadyEmpty: 'La corbeille est déjà vide',
        autoPurged: '{count} ancien(s) fichier(s) automatiquement supprimé(s) de la corbeille',
        searchPlaceholder: 'Rechercher des fichiers supprimés...',
        sortNewest: 'Plus récents d\'abord',
        sortOldest: 'Plus anciens d\'abord',
        sortNameAZ: 'Nom A-Z',
        sortNameZA: 'Nom Z-A',
        sortLargest: 'Plus grands d\'abord',
        sortSmallest: 'Plus petits d\'abord',
        previewNotAvailable: 'Aperçu non disponible pour',
        files: 'fichiers',
        restoreToView: 'Restaurez le fichier pour le voir normalement',
        unableToLoadImage: 'Impossible de charger l\'image',
        noFileSelected: 'Aucun fichier sélectionné'
    },

    // Portuguese
    pt: {
        recycleBin: 'Lixeira',
        recycleBinSettings: 'Configurações da Lixeira',
        trashedFilePreview: 'Visualização de arquivo excluído',
        binEmpty: 'Sua lixeira está vazia',
        deletedFilesAppear: 'Arquivos excluídos aparecerão aqui',
        binNotConfigured: 'A lixeira não está configurada',
        usingSystemTrash: '⚠️ Você está usando a lixeira do sistema.',
        goToSettings: 'Vá para Configurações → Lixeira para ativar.',
        restore: 'Restaurar',
        deleteForever: 'Excluir permanentemente',
        emptyAll: 'Esvaziar tudo',
        refresh: 'Atualizar',
        close: 'Fechar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        preview: 'Visualizar',
        originalLocation: 'Local original',
        size: 'Tamanho',
        deleted: 'Excluído',
        items: 'itens',
        today: 'Hoje',
        yesterday: 'Ontem',
        daysAgo: 'dias atrás',
        unknown: 'Desconhecido',
        fileInBin: 'Este arquivo está na Lixeira',
        trashLocation: '📍 Local da Lixeira',
        deletedFilesLocation: 'Local dos arquivos excluídos',
        deletedFilesLocationDesc: 'Escolha para onde vão os arquivos excluídos. "Obsidian .trash" é necessário para este plugin funcionar.',
        obsidianTrashFolder: '📁 Pasta .trash do Obsidian (recomendado)',
        systemTrash: '🗑️ Lixeira do sistema',
        permanentDelete: '⚠️ Excluir permanentemente (sem recuperação)',
        usingObsidianTrash: '✓ Usando a pasta .trash do Obsidian',
        deletedFilesWillAppear: 'Arquivos excluídos aparecerão nesta Lixeira.',
        usingSystemTrashWarning: '⚠ Usando a lixeira do sistema',
        systemTrashWarningDesc: 'Arquivos excluídos vão para a lixeira do SO, não para esta Lixeira. Mude abaixo para usar este plugin.',
        permanentDeleteWarning: '⚠ Exclusão permanente ativada',
        permanentDeleteWarningDesc: 'Arquivos excluídos são destruídos imediatamente! Mude abaixo para ativar a recuperação.',
        trashLocationChanged: 'Local da lixeira alterado para',
        pluginSettings: '⚙️ Configurações do Plugin',
        settingsDisabled: '⚠️ Configurações desativadas',
        settingsDisabledDesc: 'Altere "Local dos arquivos excluídos" acima para "Pasta .trash do Obsidian" para ativar este plugin.',
        autoPurge: 'Excluir arquivos antigos automaticamente',
        autoPurgeDesc: 'Excluir automaticamente arquivos mais antigos que um número especificado de dias',
        autoPurgeDays: 'Excluir automaticamente após (dias)',
        autoPurgeDaysDesc: 'Excluir arquivos mais antigos que este número de dias',
        showConfirmations: 'Mostrar diálogos de confirmação',
        showConfirmationsDesc: 'Pedir confirmação antes de excluir ou esvaziar a lixeira',
        showMetadata: 'Mostrar metadados de arquivos',
        showMetadataDesc: 'Exibir tamanho e data de exclusão na lista',
        showDeleteButton: 'Mostrar botão de exclusão por item',
        showDeleteButtonDesc: 'Mostrar um botão de exclusão em cada item para excluir permanentemente arquivos individuais',
        language: 'Idioma',
        languageDesc: 'Escolher idioma de exibição (auto = detectar do Obsidian)',
        languageAuto: 'Detectar automaticamente',
        acknowledgements: 'Agradecimentos',
        acknowledgementsText: 'Este plugin foi inspirado pelo <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a> de <strong>Per Mortensen</strong>. Obrigado pelo conceito original e inspiração!',
        translationNote: '🌍 Traduções foram geradas por IA. <a href="https://github.com/wronginput/obsidian-recycle-bin/issues">Reportar erros</a>',
        deletePermanently: 'Excluir permanentemente',
        deleteConfirmMessage: 'Tem certeza de que deseja excluir permanentemente "{name}"? Esta ação não pode ser desfeita.',
        emptyBin: 'Esvaziar lixeira',
        emptyBinConfirmMessage: 'Tem certeza de que deseja excluir permanentemente TODOS os arquivos da lixeira? Esta ação não pode ser desfeita!',
        restored: '"{name}" restaurado',
        cannotRestore: 'Não é possível restaurar: arquivo já existe no local original',
        binEmptied: 'Lixeira esvaziada',
        binAlreadyEmpty: 'A lixeira já está vazia',
        autoPurged: '{count} arquivo(s) antigo(s) excluído(s) automaticamente da lixeira',
        searchPlaceholder: 'Pesquisar arquivos excluídos...',
        sortNewest: 'Mais recentes primeiro',
        sortOldest: 'Mais antigos primeiro',
        sortNameAZ: 'Nome A-Z',
        sortNameZA: 'Nome Z-A',
        sortLargest: 'Maiores primeiro',
        sortSmallest: 'Menores primeiro',
        previewNotAvailable: 'Visualização não disponível para',
        files: 'arquivos',
        restoreToView: 'Restaure o arquivo para visualizá-lo normalmente',
        unableToLoadImage: 'Não foi possível carregar a imagem',
        noFileSelected: 'Nenhum arquivo selecionado'
    },

    // Russian
    ru: {
        recycleBin: 'Корзина',
        recycleBinSettings: 'Настройки Корзины',
        trashedFilePreview: 'Просмотр удалённого файла',
        binEmpty: 'Ваша корзина пуста',
        deletedFilesAppear: 'Удалённые файлы появятся здесь',
        binNotConfigured: 'Корзина не настроена',
        usingSystemTrash: '⚠️ Вы используете системную корзину.',
        goToSettings: 'Перейдите в Настройки → Корзина для включения.',
        restore: 'Восстановить',
        deleteForever: 'Удалить навсегда',
        emptyAll: 'Очистить всё',
        refresh: 'Обновить',
        close: 'Закрыть',
        cancel: 'Отмена',
        delete: 'Удалить',
        preview: 'Просмотр',
        originalLocation: 'Исходное расположение',
        size: 'Размер',
        deleted: 'Удалено',
        items: 'элементов',
        today: 'Сегодня',
        yesterday: 'Вчера',
        daysAgo: 'дней назад',
        unknown: 'Неизвестно',
        fileInBin: 'Этот файл находится в Корзине',
        trashLocation: '📍 Расположение Корзины',
        deletedFilesLocation: 'Расположение удалённых файлов',
        deletedFilesLocationDesc: 'Выберите, куда отправляются удалённые файлы. Для работы этого плагина требуется "Obsidian .trash".',
        obsidianTrashFolder: '📁 Папка .trash Obsidian (рекомендуется)',
        systemTrash: '🗑️ Системная корзина',
        permanentDelete: '⚠️ Удалить навсегда (без восстановления)',
        usingObsidianTrash: '✓ Используется папка .trash Obsidian',
        deletedFilesWillAppear: 'Удалённые файлы появятся в этой Корзине.',
        usingSystemTrashWarning: '⚠ Используется системная корзина',
        systemTrashWarningDesc: 'Удалённые файлы отправляются в корзину ОС, а не в эту Корзину. Измените ниже, чтобы использовать этот плагин.',
        permanentDeleteWarning: '⚠ Включено безвозвратное удаление',
        permanentDeleteWarningDesc: 'Удалённые файлы уничтожаются немедленно! Измените ниже, чтобы включить восстановление.',
        trashLocationChanged: 'Расположение корзины изменено на',
        pluginSettings: '⚙️ Настройки плагина',
        settingsDisabled: '⚠️ Настройки отключены',
        settingsDisabledDesc: 'Измените "Расположение удалённых файлов" выше на "Папка .trash Obsidian", чтобы включить этот плагин.',
        autoPurge: 'Автоматически удалять старые файлы',
        autoPurgeDesc: 'Автоматически удалять файлы старше указанного количества дней',
        autoPurgeDays: 'Автоудаление через (дней)',
        autoPurgeDaysDesc: 'Удалять файлы старше этого количества дней',
        showConfirmations: 'Показывать диалоги подтверждения',
        showConfirmationsDesc: 'Запрашивать подтверждение перед удалением или очисткой корзины',
        showMetadata: 'Показывать метаданные файлов',
        showMetadataDesc: 'Отображать размер файла и дату удаления в списке',
        showDeleteButton: 'Показывать кнопку удаления для каждого элемента',
        showDeleteButtonDesc: 'Показывать кнопку удаления на каждом элементе для безвозвратного удаления отдельных файлов',
        language: 'Язык',
        languageDesc: 'Выберите язык отображения (авто = определить из Obsidian)',
        languageAuto: 'Автоопределение',
        acknowledgements: 'Благодарности',
        acknowledgementsText: 'Этот плагин был вдохновлён <a href="https://github.com/proog/obsidian-trash-explorer">Trash Explorer</a> от <strong>Per Mortensen</strong>. Спасибо за оригинальную концепцию и вдохновение!',
        translationNote: '🌍 Переводы были сгенерированы ИИ. <a href="https://github.com/wronginput/obsidian-recycle-bin/issues">Сообщить об ошибках</a>',
        deletePermanently: 'Удалить навсегда',
        deleteConfirmMessage: 'Вы уверены, что хотите навсегда удалить "{name}"? Это действие нельзя отменить.',
        emptyBin: 'Очистить корзину',
        emptyBinConfirmMessage: 'Вы уверены, что хотите навсегда удалить ВСЕ файлы из корзины? Это действие нельзя отменить!',
        restored: '"{name}" восстановлен',
        cannotRestore: 'Невозможно восстановить: файл уже существует в исходном расположении',
        binEmptied: 'Корзина очищена',
        binAlreadyEmpty: 'Корзина уже пуста',
        autoPurged: 'Автоматически удалено {count} старых файлов из корзины',
        searchPlaceholder: 'Поиск удалённых файлов...',
        sortNewest: 'Сначала новые',
        sortOldest: 'Сначала старые',
        sortNameAZ: 'Имя А-Я',
        sortNameZA: 'Имя Я-А',
        sortLargest: 'Сначала большие',
        sortSmallest: 'Сначала маленькие',
        previewNotAvailable: 'Просмотр недоступен для',
        files: 'файлов',
        restoreToView: 'Восстановите файл для обычного просмотра',
        unableToLoadImage: 'Не удалось загрузить изображение',
        noFileSelected: 'Файл не выбран'
    }
};

// ============================================================================
// I18N HELPER
// ============================================================================

let currentLanguage = 'en';

/**
 * Get the current language, checking plugin settings and Obsidian settings
 * @param {object} app - Obsidian app
 * @param {object} settings - Plugin settings
 * @returns {string} - Language code
 */
function getLanguage(app, settings) {
    // If user has set a specific language, use that
    if (settings && settings.language && settings.language !== 'auto') {
        return settings.language;
    }

    // Try to detect from Obsidian's locale
    try {
        const obsidianLang = app.vault.config?.locale || navigator.language || 'en';
        const langCode = obsidianLang.split('-')[0].toLowerCase();
        if (SUPPORTED_LANGUAGES.includes(langCode)) {
            return langCode;
        }
    } catch (e) {
        // Fallback to English
    }

    return 'en';
}

/**
 * Get a translated string
 * @param {string} key - Translation key
 * @param {object} replacements - Optional replacements for {placeholders}
 * @returns {string} - Translated string
 */
function t(key, replacements = {}) {
    let text = TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS.en[key] || key;

    // Replace placeholders like {name} with actual values
    for (const [placeholder, value] of Object.entries(replacements)) {
        text = text.replace(`{${placeholder}}`, value);
    }

    return text;
}

// Default settings
const DEFAULT_SETTINGS = {
    autoPurgeEnabled: false,
    autoPurgeDays: 90,
    showConfirmations: true,
    showMetadata: true,
    showDeleteButton: false,
    sortBy: 'date',
    sortOrder: 'desc',
    language: 'auto' // 'auto' or specific language code
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

        // Language setting (always enabled, not dependent on trash location)
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: '🌍 Language' });

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
                    await this.plugin.saveSettings();
                    this.display(); // Refresh settings with new language
                    await this.plugin.refreshViews();
                });
            });

        // Translation note
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
