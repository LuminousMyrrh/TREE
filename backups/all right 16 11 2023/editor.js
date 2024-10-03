document.addEventListener('DOMContentLoaded', function() {
    const editor = ace.edit("editor");

    editor.setTheme("ace/theme/twilight");
    editor.setOptions({
        tabSize: 2,
        useSoftTabs: true,
        wrap: true,
        autoCloseBrackets: true,
        autoCloseQuotes: true,
        highlightActiveLine: true,
        showGutter: true,
        showPrintMargin: false,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        autoScrollEditorIntoView: true,
        keyboardHandler: "ace/keyboard/vim",
        useWorker: true,
        showInvisibles: true,
        displayIndentGuides: true,
    });

});
