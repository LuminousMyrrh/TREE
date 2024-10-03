document.addEventListener('DOMContentLoaded', function () {
    const contextMenu = document.getElementById('context-menu');
    const contextMenuFile = document.getElementById('context-menu-file');
    const tabsContainer = document.querySelector('.tabs');
    const editor = ace.edit("editor");
    const localStorageKey = 'fileData';
    const clearAllModal = document.getElementById('clearAll_modal_win');
    const agreeInputClearAll = document.getElementById('agree_input_clearAll');
    const clearAllModalButton = document.getElementById('clearAll_modal_button');
    const buttonCloseModal = document.getElementById('buttonColse_modal');
    const sidebar = document.querySelector('.sidebar');
    const smallWindow = document.getElementById('clearAll_modal_win_small_window');
    const SubModalWin = document.getElementById('SubscriptionModalWin');
    const nofilesSidebar = document.querySelector('.no_files_sidebar');
    const buttonClose = document.getElementById('buttonClose');
    

    const MAX_FILES = 5;
    let createdFiles = 0;

    // Load existing files from localStorage
    const existingFiles = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    existingFiles.forEach(file => {
        if (!fileExists(file.name)) {
            if (file.content.trim() !== '') {
                createFileButtonAndTabAtRefresh(file.name, file.content);
                createdFiles++;
            } else {
                removeFile(file.name, null);
            }
        }
    });

        // Function to show the context menu
    function showContextMenu(x, y, isFile) {
        const menuToShow = isFile ? contextMenuFile : contextMenu;
        const menuToHide = isFile ? contextMenu : contextMenuFile;

        menuToShow.style.display = 'block';
        menuToHide.style.display = 'none';
        menuToShow.style.left = x + 'px';
        menuToShow.style.top = y + 'px';
    }
    
    // Function to hide the context menu
    function hideContextMenu() {
        contextMenu.style.display = 'none';
        contextMenuFile.style.display = 'none';
    }

    // Event listener for right-click on sidebar using event delegation
    sidebar.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        const isFileButton = event.target.classList.contains('file-button');
        const clickedElement = isFileButton ? event.target : null;

        showContextMenu(event.clientX, event.clientY, isFileButton);

        if (isFileButton) {
            contextMenuFile.clickedElement = clickedElement;
        }
    });

    // Event listener to hide the context menu on clicking elsewhere
    window.addEventListener('click', function () {
        hideContextMenu();
    });

    contextMenuFile.addEventListener('click', function (event) {
        const action = event.target.getAttribute('name');
        const clickedElement = contextMenuFile.clickedElement;

        if (action === 'buttonputaway') {
            // Remove file logic
            const fileName = clickedElement.textContent;
            removeFile(fileName, clickedElement);
            const existingFiles = JSON.parse(localStorage.getItem(localStorageKey)) || [];
            if (existingFiles.length == 0) {
                    // Create and append the "create or open new file!" div
                nofilesSidebar.style.display = 'block';
            }
        } else if (action === 'buttonrename') {
            // Rename file logic
            const fileName = clickedElement.textContent;
            createRenameInput(clickedElement, fileName);
        } else if (action === 'buttoncopy') {
            // Copy file logic
            // Add your logic for copying the file here
        }
        hideContextMenu();
    });
    // Event listener for general menu actions
    contextMenu.addEventListener('click', function (event) {
        const action = event.target.getAttribute('name');
        if (action === 'buttonOpen') {
            if (createdFiles == MAX_FILES) {
                console.log('subscribtion!!!');
                createPopup();
            } else {
                // Open file dialog logic
                nofilesSidebar.style.display = 'none';
                const fileInput = document.getElementById('file-input');
                fileInput.click();

                fileInput.addEventListener('change', function () {
                    const selectedFile = fileInput.files[0];
                    const reader = new FileReader();

                    reader.onload = function (e) {
                        const fileName = selectedFile.name;
                        const fileContent = e.target.result;

                        // Save file to localStorage and create button/tab
                        if (fileExists(fileName)) {
                            // do something with file name
                            console.log('it starts');
                        }
                        createFileButtonAndTabAtOpen(fileName, fileContent);
                    };

                    reader.readAsText(selectedFile);
                });
                createdFiles++;
            };
        } else if (action === 'buttonCreate') {
            if (createdFiles == MAX_FILES) {
                console.log('subscribtion!!!');
                createPopup();
            } else {
                // Create file logic
                nofilesSidebar.style.display = 'none';
                const fileName = 'unnamed.txt'; // You can generate a unique name
                const fileContent = ''; // Initial content
                createFileButtonAndTabAtCreate(fileName, fileContent);
                createdFiles++;
            };
        } else if (action === 'buttonClearAll') {
            // Show clearAll modal
            clearAllModal.style.display = 'block';
            smallWindow.style.animation = 'fadeIn 0.3s forwards';
            
            setTimeout(() => {
                smallWindow.style.animation = '';
            }, 300);
        }
        hideContextMenu();
        event.stopPropagation(); // Остановить всплытие события
    });

    clearAllModalButton.addEventListener('click', function () {
        const agreedText = 'I AGREE';
        if (agreeInputClearAll.value.trim() === agreedText) {
            // Clear all files in localStorage

            // Remove all file-buttons and tabs with animation
            const fileButtons = document.querySelectorAll('.file-button');
            const tabs = document.querySelectorAll('.tab');

            // Set animation for file-buttons
            fileButtons.forEach(button => {
                button.style.animation = 'going_left 0.7s ease-in-out';
                button.addEventListener('animationend', () => button.remove());
            });

            // Set animation for tabs
            tabs.forEach(tab => {
                tab.style.animation = 'going_up 0.7s ease-in-out';
                tab.addEventListener('animationend', () => tab.remove());
            });

            localStorage.removeItem(localStorageKey);
            editor.setValue('');

            // Hide clearAll modal
            clearAllModal.style.display = 'none';
            nofilesSidebar.style.display = 'block';
        } else {
            // Add the shake-animation class to the small window inside the modal
            smallWindow.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                smallWindow.style.animation = '';
            }, 500); // Adjust the time based on your preference
        }
    });


    buttonCloseModal.addEventListener('click', function () {
        clearAllModal.style.display = 'none';
    });

    function createFileButtonAndTabAtRefresh(fileName, fileContent) {
        const fileButton = createFileElement('div', 'file-button', fileName);
        const tab = createFileElement('div', 'tab', fileName);

        sidebar.appendChild(fileButton);
        tabsContainer.appendChild(tab);

        editor.currentFileName = fileName;
        editor.setValue(fileContent);

        fileButton.style.animation = 'fadeIn 0.3s forwards';
        tab.style.animation = 'fadeIn 0.3s forwards';

        setTimeout(() => {
            // Reset the animation and transform properties after the animation completes
            fileButton.style.animation = '';

            tab.style.animation = '';
        }, 300);

    }

    function createFileButtonAndTabAtCreate(fileName, fileContent) {
        const fileData = getFileData();
        let originalFileName = fileName;
        let count = 0;

        // Check if the file with the same name already exists in localStorage
        while (fileExists(fileName)) {
            count++;
            const fileNameWithoutExtension = originalFileName.replace(/\.[^.]+$/, '');
            const fileExtension = originalFileName.match(/\.[^.]+$/);
            fileName = `${fileNameWithoutExtension}_${count}${fileExtension || ''}`;
        }

        // Add the new file to localStorage
        fileData.push({ name: fileName, content: fileContent });
        localStorage.setItem(localStorageKey, JSON.stringify(fileData));

        const fileButton = createFileElement('div', 'file-button', fileName);
        const tab = createFileElement('div', 'tab', fileName);

        sidebar.appendChild(fileButton);
        tabsContainer.appendChild(tab);

        editor.currentFileName = fileName;
        editor.setValue(fileContent);

        fileButton.style.animation = 'fadeIn 0.3s forwards';
        tab.style.animation = 'fadeIn 0.3s forwards';

        setTimeout(() => {
            // Reset the animation and transform properties after the animation completes
            fileButton.style.animation = '';

            tab.style.animation = '';
        }, 300);

    }

    function createFileButtonAndTabAtOpen(fileName, fileContent) {
        const fileData = getFileData();
        const existingFile = fileData.find(file => file.name === fileName);

        if (existingFile) {
            // File with the same name already exists
            flashExistingFile(existingFile);
            return; // Do not create new file button and tab
        }

        // Add the new file to localStorage
        fileData.push({ name: fileName, content: fileContent });
        localStorage.setItem(localStorageKey, JSON.stringify(fileData));

        const fileButton = createFileElement('div', 'file-button', fileName);
        const tab = createFileElement('div', 'tab', fileName);

        sidebar.appendChild(fileButton);
        tabsContainer.appendChild(tab);

        editor.currentFileName = fileName;
        editor.setValue(fileContent);

        fileButton.style.animation = 'fadeIn 0.3s forwards';
        tab.style.animation = 'fadeIn 0.3s forwards';

        setTimeout(() => {
            // Reset the animation and transform properties after the animation completes
            fileButton.style.animation = '';

            tab.style.animation = '';
        }, 300);

    }

    function flashExistingFile(existingFile) {
        const fileButton = Array.from(document.querySelectorAll('.file-button')).find(element => element.textContent === existingFile.name);
        const tab = Array.from(document.querySelectorAll('.tab')).find(element => element.textContent === existingFile.name);

        if (fileButton && tab) {
            const animationDuration = 400; // in milliseconds
            const originalTransform = fileButton.style.transform || '';

            // Apply the scaling animation to file button
            fileButton.style.animation = `scaleUp ${animationDuration / 1000}s forwards`;

            // Apply the scaling animation to tab
            tab.style.animation = `scaleUp ${animationDuration / 1000}s forwards`;

            setTimeout(() => {
                // Reset the animation and transform properties after the animation completes
                fileButton.style.animation = '';
                fileButton.style.transform = originalTransform;

                tab.style.animation = '';
                tab.style.transform = originalTransform;
            }, animationDuration);
        }
    }

    function fileExists(fileName) {
        //const originalFileName = fileName.replace(/(\.[^.]+)?\d*$/, '');
        return Array.from(document.querySelectorAll('.file-button, .tab')).some(element => element.textContent === fileName);
    }

    function createFileElement(elementType, className, textContent) {
        const element = document.createElement(elementType);
        element.classList.add(className);
        element.textContent = textContent;
        return element;
    }

    function getFileData() {
        return JSON.parse(localStorage.getItem(localStorageKey)) || [];
    }
    
    // Function to remove a file from localStorage, file-button, and tab
    function removeFile(fileName, clickedElement) {
        try {
            const fileData = getFileData();
            const updatedFileData = fileData.filter(file => file.name !== fileName);
            localStorage.setItem(localStorageKey, JSON.stringify(updatedFileData));

            // Remove the corresponding tab
            const tabs = document.querySelectorAll('.tab');
            const tabToRemove = Array.from(tabs).find(tab => tab.textContent === fileName);

            // Set the scaleDown animation to the clickedElement
            clickedElement.style.animation = 'scaleDown 0.5s forwards';
            // Remove the element after the animation completes
            clickedElement.addEventListener('animationend', () => {
                clickedElement.remove();
            });

            // Set the scaleDown animation to the tabToRemove element
            tabToRemove.style.animation = 'scaleDown 0.5s forwards';
            // Remove the tabToRemove element after the animation completes
            tabToRemove.addEventListener('animationend', () => {
                tabToRemove.remove();
            });
        } catch (error) {
            console.log('forget about it js is actually dumb asf (or me)');
        }
    }


    function createRenameInput(clickedElement, fileName) {
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = fileName;
        inputElement.className = 'rename-input';

        // Handle blur event to save the new name
        inputElement.addEventListener('blur', function () {
            const newFileName = inputElement.value;
            if (newFileName.trim() !== '' && newFileName !== fileName) {
                if (fileExists(newFileName)) {
                    // If the file already exists, trigger the shake animation
                    inputElement.style.animation = 'shake 0.3s forwards';
                    setTimeout(() => {
                        inputElement.style.animation = '';
                    }, 500); // Adjust the time based on your preference
                    inputElement.value = fileName;
                    inputElement.focus();
                    //createRenameInput(clickedElement, fileName);
                } else {
                    renameFile(fileName, newFileName, clickedElement);
                }
            } else {
                // If the input is empty or unchanged, replace with the original file-button
                const newFileButton = createFileElement('div', 'file-button', fileName);
                clickedElement.parentNode.replaceChild(newFileButton, clickedElement);
            }
        });

        // Handle Enter key press to save the new name
        inputElement.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                inputElement.blur();
            }
        });

        // Replace the file-button's content with the input element
        clickedElement.textContent = '';
        clickedElement.appendChild(inputElement);

        // Focus on the input element
        inputElement.focus();
    }

    // Function to rename a file in localStorage, file-button, and tab
    function renameFile(oldFileName, newFileName, clickedElement) {
        const fileData = getFileData();
        const updatedFileData = fileData.map(file => {
            if (file.name === oldFileName) {
                return { name: newFileName, content: file.content };
            }
            return file;
        });

        localStorage.setItem(localStorageKey, JSON.stringify(updatedFileData));

        // Update file-button text
        clickedElement.textContent = newFileName;

        // Update corresponding tab text
        const tabs = document.querySelectorAll('.tab');
        const tabToUpdate = Array.from(tabs).find(tab => tab.textContent === oldFileName);
        if (tabToUpdate) {
            tabToUpdate.textContent = newFileName;
        }
    }

    function generateRandomColor() {
        // Генерация случайного цвета в формате RGB
        return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
    }

    let alreadyOpened = false;

    function createPopup() {
        if (alreadyOpened == 0) {
            SubModalWin.style.display = 'block';
            SubModalWin.style.animation = 'zoomRotate 0.5s ease-in-out';
            SubModalWin.style.transformOrigin = 'center';
            
            setTimeout(() => {
                SubModalWin.style.animation = '';
            }, 1000);
            alreadyOpened = true;
        }
    };

    buttonClose.addEventListener('click', function (event) {
        SubModalWin.style.animation = 'outRotate 0.5s ease-in-out';
        SubModalWin.style.transformOrigin = 'center';

        SubModalWin.addEventListener('animationend', function onAnimationEnd() {
            SubModalWin.style.animation = '';
            SubModalWin.style.transform = 'none';
            SubModalWin.style.display = 'none';

            // Удаление обработчика события, чтобы избежать многократного вызова
            SubModalWin.removeEventListener('animationend', onAnimationEnd);
        }, { once: true });
        alreadyOpened = false;
    });


});
