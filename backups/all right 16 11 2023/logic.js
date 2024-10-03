document.addEventListener('DOMContentLoaded', function () {
    const tabsContainer = document.querySelector('.tabs');
    const sidebarContainer = document.querySelector('.sidebar')
    const editor = ace.edit("editor");
    const localStorageKey = 'fileData';
    const nofilesSidebar = document.querySelector('.no_files_sidebar');

    // Load existing files from localStorage
    const existingFiles = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    // Track the currently opened file in the editor
    let currentFileName = null;
        
    // Check if there are no existing files
    if (existingFiles.length === 0) {
        // Create and append the "create or open new file!" div
        nofilesSidebar.style.display = 'block';
    }

    // Event listener for mouse down on file button
    sidebarContainer.addEventListener('mousedown', function (event) {
        const isFileButton = event.target.classList.contains('file-button');
        if (isFileButton) {
            const fileName = event.target.textContent;
            openFileInEditor(fileName);
            highlightSelectedFile(fileName);
        }
    });

    // Event listener for tab click
    tabsContainer.addEventListener('click', function (event) {
        const isTab = event.target.classList.contains('tab');
        if (isTab) {
            const fileName = event.target.textContent;
            openFileInEditor(fileName);
            highlightSelectedFile(fileName);
        }
    });

    // Event listener for editor content change
    editor.getSession().on('change', function (e) {
        if (currentFileName) {
            // Save the updated content to localStorage
            saveToFile(currentFileName, editor.getValue());
        }
    });

    // Function to set Ace editor mode based on file extension
    function setAceEditorMode(fileExtension) {
        // Map file extensions to Ace modes
        const modeMap = {
            "js": "ace/mode/javascript",
            "html": "ace/mode/html",
            "css": "ace/mode/css",
            // Add more mappings as needed
        };

        const mode = modeMap[fileExtension];
        if (mode) {
            editor.getSession().setMode(mode);
            console.log('Mode set successfully');
        } else {
            console.error("Unsupported file extension: " + fileExtension);
        }
    }

    // Function to open a file in the editor
    function openFileInEditor(fileName) {
        const fileData = getFileData();
        const selectedFile = fileData.find(file => file.name === fileName);

        if (selectedFile) {
            currentFileName = fileName;
            editor.setValue(selectedFile.content, -1);
            setAceEditorMode(getFileExtension(fileName));
        }
    }

    // Function to save content to a file in localStorage
    function saveToFile(fileName, content) {
        const fileData = getFileData();
        const updatedFileData = fileData.map(file => {
            if (file.name === fileName) {
                return { name: fileName, content: content };
            }
            return file;
        });

        localStorage.setItem(localStorageKey, JSON.stringify(updatedFileData));
        //console.log('it works!!');
    }

    // Helper function to get the file extension
    function getFileExtension(fileName) {
        return fileName.split('.').pop();
    }

    // Helper function to get file data from localStorage
    function getFileData() {
        return JSON.parse(localStorage.getItem(localStorageKey)) || [];
    }

    function highlightSelectedFile(fileName) {
        // Reset background color for all file buttons
        const allFileButtons = document.querySelectorAll('.file-button');
        allFileButtons.forEach(button => {
            button.style.background = ''; // Reset to original background color
        });

        // Reset background color for all tabs
        const allTabs = document.querySelectorAll('.tab');
        allTabs.forEach(tab => {
            tab.style.background = ''; // Reset to original background color
        });

        // Highlight the selected file
        const fileButton = Array.from(allFileButtons).find(element => element.textContent === fileName);
        const tab = Array.from(allTabs).find(element => element.textContent === fileName);

        if (fileButton && tab) {
            // Apply the scaling animation to file button
            fileButton.style.background = 'rgb(41, 74, 0)';

            // Apply the scaling animation to tab
            tab.style.background = 'rgb(41, 74, 0)';
        };
    }

    // Event listener for mouse move
    function handleMouseMove(event) {
        if (isDragging) {
            // You can adjust the scaling factor as needed
            const scalingFactor = 1.1;
            
            // Get the file button being dragged
            const fileButton = document.querySelector('.file-button.dragging');
            
            // Apply scaling to the file button
            fileButton.style.transform = `scale(${scalingFactor})`;
        }
    }

    // Event listener for mouse up
    function handleMouseUp() {
        if (isDragging) {
            // Reset styles and remove event listeners
            const fileButton = document.querySelector('.file-button.dragging');
            fileButton.style.transform = '';
            fileButton.classList.remove('dragging');
            isDragging = false;
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    };

    const existingFilesCount = existingFiles.length;


        // If there are more than 5 files, create a notification window
    if (existingFilesCount > 5) {
        createNotificationWindow();
    }

    // Function to create a notification window
    function createNotificationWindow() {
        // Create a notification div
        const notificationDiv = document.createElement('div');
        notificationDiv.classList.add('notification-window');

        // Add content to the notification div
        notificationDiv.innerHTML = `
            <p>Вы достигли максимального количества файлов (5).</p>
            <p>Закройте некоторые файлы перед созданием новых.</p>
            <span class="close-button">Закрыть</span>
        `;

        // Append the notification div to the body
        document.body.appendChild(notificationDiv);

        // Event listener for the close button
        const closeButton = notificationDiv.querySelector('.close-button');
        closeButton.addEventListener('click', function () {
            document.body.removeChild(notificationDiv);
        });

        // Event listener to close the notification when clicked outside
        window.addEventListener('click', function (event) {
            if (event.target === notificationDiv) {
                document.body.removeChild(notificationDiv);
            }
        });
    }
});
