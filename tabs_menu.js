document.addEventListener('DOMContentLoaded', function () {
    const tabsContainer = document.querySelector('.tabs');
    const contextMenuTabs = document.getElementById('context-menu-tabs');
    const contextMenuTab = document.getElementById('context-menu-tab');
    const ace_content = document.querySelector('.ace_content');
    const editor = document.getElementById('editor');
    const buttonHide = document.getElementsByName('buttonHide');

        // Function to show the context menu
    function showContextMenu(x, y, isFile) {
        const menuToShow = isFile ? contextMenuTab : contextMenuTabs;
        const menuToHide = isFile ? contextMenuTabs : contextMenuTab;

        menuToShow.style.display = 'block';
        menuToHide.style.display = 'none';
        menuToShow.style.left = x + 'px';
        menuToShow.style.top = y + 'px';
    }
    
    // Function to hide the context menu
    function hideContextMenu() {
        contextMenuTabs.style.display = 'none';
        contextMenuTab.style.display = 'none';
    }

    // Event listener for right-click on sidebar using event delegation
    tabsContainer.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        //const isTabs = event.target.classList.contains('tabs');
        const isTab = event.target.classList.contains('tab');
        const clickedElement = isTab ? event.target : null;

        showContextMenu(event.clientX, event.clientY, isTab);

        if (isTab) {
            contextMenuTab.clickedElement = clickedElement;
        }
    });

    // Event listener to hide the context menu on clicking elsewhere
    window.addEventListener('click', function () {
        hideContextMenu();
    });

    contextMenuTabs.addEventListener('click', function (event) {
        const action = event.target.getAttribute('name');

        if (action === 'buttonHide') {
            tabsContainer.style.display = 'none';
            editor.style.gridRow = '1 / 3';
        }; 
        hideContextMenu();
    });

    contextMenuTab.addEventListener('click', function (event) {
        const action = event.target.getAttribute('name');

        if (action === 'buttonSplitToRight') {
            tabsContainer.style.width = '48.8%';
            editor.style.width = '50%'
            ace_content.style.width = '50%';

            const newEditor = document.createElement('div');
            newEditor.id = 'editor';
            newEditor.style.width = '50%';

            // Copy existing tabs to the new tabs container
            const tabsCopy = tabsContainer.cloneNode(true);
            tabsCopy.appendChild(tabsCopy);

            // Append new elements to the DOM
            tabsContainer.insertAdjacentElement('afterend', newTabsContainer);
            editor.insertAdjacentElement('afterend', newEditor);

        } else if (action === 'buttonSplitToLeft') {

        } else if (action === 'buttonSplitToTop') {

        } else if (action === 'buttonSplitToBottom') {

        };
        hideContextMenu();

    });
});
