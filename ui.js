document.addEventListener('DOMContentLoaded', function () {
    const contextMenu = document.getElementById('context-menu');
    const contextMenuFile = document.getElementById('context-menu-file');
    const tabsContainer = document.querySelector('.tabs');
    const editor = ace.edit("editor");
    const clearAllModal = document.getElementById('clearAll_modal_win');
    const agreeInputClearAll = document.getElementById('agree_input_clearAll');
    const clearAllModalButton = document.getElementById('clearAll_modal_button');
    const buttonCloseModal = document.getElementById('buttonColse_modal');
    const sidebar = document.querySelector('.sidebar');
    const smallWindow = document.getElementById('clearAll_modal_win_small_window');
    const SubModalWin = document.getElementById('SubscriptionModalWin');
    const nofilesSidebar = document.querySelector('.no_files_sidebar');
    const buttonClose = document.getElementById('buttonClose');
    
    const dbPromise = initDatabase(); // Инициализация базы данных

    const MAX_FILES = 5;
    let createdFiles = 0;

    // Load existing files from IndexedDB
    dbPromise.then(db => {
        const transaction = db.transaction('files', 'readonly');
        const fileStore = transaction.objectStore('files');
        const getAllRequest = fileStore.getAll();

        return getAllRequest.onsuccess = function(event) {
            const existingFiles = event.target.result || [];

            existingFiles.forEach(file => {
                if (!fileExists(file.name)) {
                    if (file.content !== '') {
                        createFileButtonAndTabAtRefresh(file.name, file.content);
                        console.log("Tab and File-buttons created for file: " + file.name);
                        createdFiles++;
                    } else if (file.content == null) {
                        console.log("This file has null content: " + file.name);
                    } else {
                        removeFileWithoutClickedElement(file.name);
                        console.log("Deleted file: " + file.name);
                    };
                }
            });
            
            if (existingFiles == 0) {
                nofilesSidebar.style.display = 'block';
            };
        };
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
            console.log("Showed context menu for File");
        } else {
            // Handle the case when clickedElement is null (outside of a file button)
            contextMenuFile.clickedElement = null;
        }
    });


    // Event listener to hide the context menu on clicking elsewhere
    window.addEventListener('click', function () {
        hideContextMenu();
    });

    // initialization indexedDB (mayby idk)
    function initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TextEditorDB', 1);

            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                const fileStore = db.createObjectStore('files', { keyPath: 'name' });
                fileStore.createIndex('content', 'content', { unique: false });
            };

            request.onsuccess = function (event) {
                const db = event.target.result;
                resolve(db);
            };

            request.onerror = function (event) {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };
        });
    };

    function saveFileToIndexedDB(fileName, fileContent) {
        dbPromise.then(db => {
            const transaction = db.transaction('files', 'readwrite');
            const fileStore = transaction.objectStore('files');
            const file = { name: fileName, content: fileContent };
            fileStore.put(file);
            return transaction.complete;
        });
    }

    function removeFileFromIndexedDB(fileName) {
        dbPromise.then(db => {
            const transaction = db.transaction('files', 'readwrite');
            const fileStore = transaction.objectStore('files');
            fileStore.delete(fileName);
            return transaction.complete;
        });
    }

    function clearAllFilesFromIndexedDB() {
        dbPromise.then(db => {
            const transaction = db.transaction('files', 'readwrite');
            const fileStore = transaction.objectStore('files');
            fileStore.clear();
            return transaction.complete;
        });
    }

    function updateFileInIndexedDB(updatedFile) {
        dbPromise.then(db => {
            const transaction = db.transaction('files', 'readwrite');
            const fileStore = transaction.objectStore('files');
            fileStore.put(updatedFile);
            return transaction.complete;
        });
    }


    contextMenuFile.addEventListener('click', function (event) {
        const action = event.target.getAttribute('name');
        const clickedElement = contextMenuFile.clickedElement;

        if (action === 'buttonputaway') {
            // Remove file logic
            const fileName = clickedElement.textContent;
            removeFile(fileName, clickedElement);
            createdFiles--;
            if (createdFiles == 0) {
                    // Create and append the "create or open new file!" div
                nofilesSidebar.style.display = 'block';
            }
            console.log("Pressed \"remove button\"");
        } else if (action === 'buttonrename') {
            // Rename file logic
            const fileName = clickedElement.textContent;
            createRenameInput(clickedElement, fileName);
            console.log("Pressed \"rename button\"");
        } else if (action === 'buttoncopy') {
            // Copy file logic
            // Add your logic for copying the file here
            console.log("Pressed \"copy button\"");
        }
        hideContextMenu();
    });
    // Event listener for general menu actions
    contextMenu.addEventListener('click', function (event) {
        const action = event.target.getAttribute('name');
        if (action === 'buttonOpen') {
            console.log("Pressed \"file open button\"");
            if (createdFiles == MAX_FILES) {
                console.log('Showing subscription window');
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
                            console.log('User already has this file opened' + fileName);
                        }
                        createFileButtonAndTabAtOpen(fileName, fileContent);
                    };

                    reader.readAsText(selectedFile);
                });
            };
        } else if (action === 'buttonCreate') {
            console.log("Pressed \"create file button\"");
            if (createdFiles == MAX_FILES) {
                console.log('Showing subscription window');
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
            console.log("Pressed \"clear all button\/");
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
            console.log("User entered right agreed text");
            // Remove all file-buttons and tabs with animation
            const fileButtons = document.querySelectorAll('.file-button');
            const tabs = document.querySelectorAll('.tab');

            // Set animation for file-buttons
            fileButtons.forEach(button => {
                button.style.animation = 'going_left 0.7s ease-in-out';
                button.addEventListener('animationend', () => button.remove());
                createdFiles--;
            });

            // Set animation for tabs
            tabs.forEach(tab => {
                tab.style.animation = 'going_up 0.7s ease-in-out';
                tab.addEventListener('animationend', () => tab.remove());
            });

            clearAllFilesFromIndexedDB();
            editor.setValue('');

            // Hide clearAll modal
            clearAllModal.style.display = 'none';
            nofilesSidebar.style.display = 'block';
        } else {
            console.log("User entered wrong agreed text");
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
        console.log('Created file at "refresh"');
        return;

    }

    function createFileButtonAndTabAtCreate(fileName, fileContent) {
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
        saveFileToIndexedDB(fileName, fileContent);

        const fileButton = createFileElement('div', 'file-button', fileName);
        const tab = createFileElement('div', 'tab', fileName);

        sidebar.appendChild(fileButton);
        tabsContainer.appendChild(tab);

        editor.currentFileName = fileName;


        fileButton.style.animation = 'fadeIn 0.3s forwards';
        tab.style.animation = 'fadeIn 0.3s forwards';

        setTimeout(() => {
            // Reset the animation and transform properties after the animation completes
            fileButton.style.animation = '';

            tab.style.animation = '';
        }, 300);

        console.log('Created file at "create"');
        return;
    }

    let processingFile = null;

    function createFileButtonAndTabAtOpen(fileName, fileContent) {
        if (processingFile === fileName) {
            // Файл уже обрабатывается, игнорируем дополнительные вызовы
            return;
        }

        processingFile = fileName;

        getFileData().then(fileData => {
            const existingFile = fileData.find(file => file.name === fileName);

            if (existingFile) {
                // File with the same name already exists
                flashExistingFile(existingFile);
                processingFile = null;
                return; // Do not create new file button and tab
            }


            const fileButton = createFileElement('div', 'file-button', fileName);
            const tab = createFileElement('div', 'tab', fileName);

            sidebar.appendChild(fileButton);
            tabsContainer.appendChild(tab);

            //editor.currentFileName = fileName;

            fileButton.style.animation = 'fadeIn 0.3s forwards';
            tab.style.animation = 'fadeIn 0.3s forwards';

            setTimeout(() => {
                // Reset the animation and transform properties after the animation completes
                fileButton.style.animation = '';
                tab.style.animation = '';
                processingFile = null; // Сбрасываем текущий обрабатываемый файл
                createdFiles++;
            }, 300);
            
            // Add the new file to indexedDB
            saveFileToIndexedDB(fileName, fileContent);
            console.log('Created file at "open": ' + fileName);
            return;

        }).catch(error => {
            console.error('An error occurred:', error);
            processingFile = null; // Обработка завершилась с ошибкой, сбрасываем текущий обрабатываемый файл
            return;
        });
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
        return new Promise((resolve, reject) => {
            const dbPromise = initDatabase();

            dbPromise.then(db => {
                const transaction = db.transaction('files', 'readonly');
                const fileStore = transaction.objectStore('files');
                const request = fileStore.getAll();

                request.onsuccess = function (event) {
                    resolve(event.target.result || []);
                };

                request.onerror = function (event) {
                    console.error('Error fetching file data:', event.target.error);
                    reject(event.target.error);
                };
            });
        });
    }

    
    // Function to remove a file from localStorage, file-button, and tab
    function removeFile(fileName, clickedElement) {
        if (clickedElement || clickedElement == null) {
            //const updatedFileData = fileData.filter(file => file.name !== fileName);
            removeFileFromIndexedDB(fileName);

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
        } else {
            console.log("again");
            
        };
    }
    
    function removeFileWithoutClickedElement(fileName) {
        removeFileFromIndexedDB(fileName);
        const tabs = document.querySelectorAll('.tab');
        const tabToRemove = Array.from(tabs).find(tab => tab.textContent === fileName);
        if (tabToRemove) {
            tabToRemove.remove();
        } else {
            console.log("there is no tabs to remove");
        }

        const filebuttons = document.querySelectorAll('.file-button');
        const filebuttonToRemove = Array.from(filebuttons).find(filebutton => filebutton.textContent === fileName);
        if (filebuttonToRemove) {
            filebuttonToRemove.remove();
        } else {
            console.log("there is no file buttons to remove");
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
            fileExtension = getFileExtension(newFileName);
            if (newFileName !== fileName) {
                if (fileExists(newFileName) || fileExtension == '') {
                    // If the file already exists, trigger the shake animation
                    inputElement.style.animation = 'shake 0.2s forwards';
                    setTimeout(() => {
                        inputElement.style.animation = '';
                    }, 500); // Adjust the time based on your preference
                    inputElement.value = fileName;
                    inputElement.focus();
                    //createRenameInput(clickedElement, fileName);
                } else {
                    renameFile(fileName, newFileName, clickedElement);
                    //console.log(fileExtension + newFileName.indexOf('.'));
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

    function getFileExtension(fileName) {
        if (fileName.indexOf('.') > -1) {
            return fileName.split('.').pop();
        } else {
            return '';
        }
    }

    // Function to rename a file in IndexedDB, file-button, and tab
    function renameFile(oldFileName, newFileName, clickedElement) {
        getFileData().then(fileData => {
            const fileToUpdate = fileData.find(file => file.name === oldFileName);

            if (fileToUpdate) {
                removeFileFromIndexedDB(oldFileName);
                // Update the file name in the object
                fileToUpdate.name = newFileName;

                // Update the file in IndexedDB
                updateFileInIndexedDB(fileToUpdate);

                // Update file-button text
                clickedElement.textContent = newFileName;
                clickedElement.currentFileName = newFileName;

                // Update corresponding tab text
                const tabs = document.querySelectorAll('.tab');
                const tabToUpdate = Array.from(tabs).find(tab => tab.textContent === oldFileName);
                if (tabToUpdate) {
                    tabToUpdate.textContent = newFileName;
                    tabToUpdate.currentFileName = newFileName;
                }

            } else {
                console.error('File not found during renaming:', oldFileName);
            }
        }).catch(error => {
            console.error('An error occurred during renaming:', error);
        });
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
