document.addEventListener('DOMContentLoaded', function () {
    const tabsContainer = document.querySelector('.tabs');
    const sidebarContainer = document.querySelector('.sidebar');
    const editor = ace.edit("editor");
    const editorId = document.getElementById('editor');
    const proj_nameId = document.getElementById('proj_name');
    const dbPromise = initDatabase();
    const accountButton = document.getElementById("accountButton");
    const viewButton = document.getElementById("viewButton");
    let currentFileName = null;

    sidebarContainer.addEventListener('mousedown', function (event) {
        const isFileButton = event.target.classList.contains('file-button');
        if (isFileButton) {
            const fileName = event.target.textContent;
            openFileInEditor(fileName);
            highlightSelectedFile(fileName);
        }
    });

    tabsContainer.addEventListener('click', function (event) {
        const isTab = event.target.classList.contains('tab');
        if (isTab) {
            const fileName = event.target.textContent;
            openFileInEditor(fileName);
            highlightSelectedFile(fileName);
        }
    });

    editor.getSession().on('change', function (e) {
        if (currentFileName) {
            saveToFile(currentFileName, editor.getValue());
        }
    });

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

    function setAceEditorMode(fileExtension) {
        if (fileExtension == 'txt') {
            console.log('This file has .txt extension');
        } else {
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
                console.log('Mode set successfully' + mode);
            } else {
                console.error("Unsupported file extension: " + fileExtension);
            }
        }
    }

    function openFileInEditor(fileName) {
        dbPromise.then(db => {
            const transaction = db.transaction('files', 'readonly');
            const fileStore = transaction.objectStore('files');
            const request = fileStore.get(fileName);

            request.onsuccess = function (event) {
                const file = event.target.result;

                if (file) {
                    currentFileName = fileName;
                    editor.setValue(file.content, -1);
                    setAceEditorMode(getFileExtension(fileName));
                }
            };
        });
    }

    function saveToFile(fileName, content) {
        dbPromise.then(db => {
            const transaction = db.transaction('files', 'readwrite');
            const fileStore = transaction.objectStore('files');
            const request = fileStore.put({ name: fileName, content: content });

            request.onerror = function (event) {
                console.error('Error saving file:', event.target.error);
            };
        });
    }

    function getFileExtension(fileName) {
        return fileName.split('.').pop();
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

    // downloading file
        // Add event listener for Ctrl + S key combination
    document.addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault(); // Prevent the default save behavior in the browser
            if (currentFileName) {
                downloadFile(currentFileName, editor.getValue());
            }
        }
    });

        // Function to trigger file download
    function downloadFile(fileName, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    }


    // setting field logic

    let tooltipVisible = false;
    let viewtooltipVisible = false;
    let tooltip;
    let viewtooltip;
    let menu;
    let outputWinVisible = false;
    let menuVisible = false;
    let dragAllow = true;
    let originalConsoleLog = console.log;

    let pinned = false;

    accountButton.addEventListener("click", function (event) {
        // Проверяем, видимо ли окно
        if (tooltipVisible) {
            // Удаляем динамический элемент из DOM
            if (tooltip) {
                document.body.removeChild(tooltip);
                tooltipVisible = false;
            }
        } else {
            // Создаем динамический элемент для окна
            tooltip = document.createElement("div");
            tooltip.className = "tooltip";

            // Рассчитываем координаты для отступа
            const buttonRect = accountButton.getBoundingClientRect();
            const topOffset = buttonRect.top + 23;
            const rightOffset = window.innerWidth - buttonRect.right + 0;

            // Устанавливаем стили для элемента
            tooltip.style.position = "fixed";
            tooltip.style.zIndex = "1001";
            tooltip.style.top = topOffset + "px";
            tooltip.style.right = rightOffset + "px";
            tooltip.style.height = "auto"; // Уменьшаем высоту для двух рядов
            tooltip.style.width = "300px"; // Увеличиваем ширину для двух рядов
            tooltip.style.backgroundColor = "black";
            tooltip.style.padding = "10px";
            tooltip.style.borderRadius = "10px";
            tooltip.style.border = "1px solid white";
            tooltip.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";

            const accountP = document.createElement("p");
            accountP.innerHTML = '.Account';
            accountP.style = "margin-left: 40%; color: red; font-family: 'VT323', monospace; font-size: 20px; font-stretch: expanded; margin-top: -1%; user-select: none;";
            // Создаем элементы для каждого ряда текста
            const firstRow = document.createElement("p");
            firstRow.className = "tooltip-row";
            firstRow.innerHTML = "Your name:"; // Замените на ваш текст
            firstRow.style = "color: white; margin-top: 10%; font-family: 'Roboto Mono', monospace;";


            const firstRowDate = document.createElement("p");
            firstRowDate.className = "tooltip-row";
            firstRowDate.innerHTML = "Account creation date: "; // Замените на ваш текст
            firstRowDate.style = "color: white; margin-top: 5%; font-family: 'Roboto Mono', monospace;";

            const secondRow = document.createElement("p");
            secondRow.className = "tooltip-row";
            secondRow.innerHTML = "Your subscription level: "; // Замените на ваш текст
            secondRow.style = "color: yellow; margin-top: 22%; font-family: 'VT323', monospace; font-size: 18px; font-stretch: expanded";
    

            // Добавляем элементы в DOM
            tooltip.appendChild(accountP);
            tooltip.appendChild(firstRow);
            tooltip.appendChild(firstRowDate);
            tooltip.appendChild(secondRow);
            document.body.appendChild(tooltip);

            // Устанавливаем флаг видимости окна
            tooltipVisible = true;
        }

        // Предотвращаем всплытие события к window
        event.stopPropagation();
    });

    let outputZone;
    // Максимальное количество сообщений
    const maxMessages = 16;
    // Массив для хранения сообщений
    const messagesArray = [];

    viewButton.addEventListener('click', function (event) {
        if (viewtooltipVisible) {
            if (viewtooltip) {
                document.body.removeChild(viewtooltip);
                viewtooltipVisible = false;
            }
        } else {
            // Создаем динамический элемент для окна
            viewtooltip = document.createElement("div");
            viewtooltip.className = "viewtooltip";

            // Рассчитываем координаты для отступа
            const buttonRect = viewButton.getBoundingClientRect();
            const topOffset = buttonRect.top + 23;
            const rightOffset = window.innerWidth - buttonRect.right - 120;

            // Устанавливаем стили для элемента
            viewtooltip.style.position = "fixed";
            viewtooltip.style.zIndex = "1001";
            viewtooltip.style.top = topOffset + "px";
            viewtooltip.style.right = rightOffset + "px";
            viewtooltip.style.height = "auto"; // Уменьшаем высоту для двух рядов
            viewtooltip.style.width = "170px"; // Увеличиваем ширину для двух рядов
            viewtooltip.style.backgroundColor = "black";
            viewtooltip.style.padding = "10px";
            viewtooltip.style.borderRadius = "10px";
            viewtooltip.style.border = "1px solid white";
            buttonStyle = "background-color: black; color: white; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;";

            outputWinbutton = document.createElement('button');
            outputWinbutton.className = "outputWinbutton";
            outputWinbutton.innerHTML = 'Output Terminal';
            outputWinbutton.style = buttonStyle;

            settingsPagebutton = document.createElement('button');
            settingsPagebutton.className = "settingsPagebutton";
            settingsPagebutton.innerHTML = 'Settings Page';
            settingsPagebutton.style = buttonStyle;

            showHideBarbutton = document.createElement('button');
            showHideBarbutton.className = "showhidebarbutton";
            showHideBarbutton.innerHTML = 'Show/Hide bar';
            showHideBarbutton.style = buttonStyle;

            showHideSideBarbutton = document.createElement('button');
            showHideSideBarbutton.className = "showhidesidebarbutton";
            showHideSideBarbutton.innerHTML = 'Show/Hide SideBar';
            showHideSideBarbutton.style = buttonStyle;
            // Add hover effect
            outputWinbutton.addEventListener("mouseover", function() {
                outputWinbutton.style = "background-color: white; color: black; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            outputWinbutton.addEventListener("mouseout", function() {
                outputWinbutton.style = "background-color: black; color: white; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            settingsPagebutton.addEventListener("mouseover", function() {
                settingsPagebutton.style = "background-color: white; color: black; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            settingsPagebutton.addEventListener("mouseout", function() {
                settingsPagebutton.style = "background-color: black; color: white; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            showHideBarbutton.addEventListener("mouseover", function() {
                showHideBarbutton.style = "background-color: white; color: black; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            showHideBarbutton.addEventListener("mouseout", function() {
                showHideBarbutton.style = "background-color: black; color: white; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            showHideSideBarbutton.addEventListener("mouseover", function() {
                showHideSideBarbutton.style = "background-color: white; color: black; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            showHideSideBarbutton.addEventListener("mouseout", function() {
                showHideSideBarbutton.style = "background-color: black; color: white; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 3px;"
            });

            outputWinbutton.addEventListener("click", function (event) {
                if (outputWinVisible) {
                    console.log("i am right");
                } else {
                    document.body.removeChild(viewtooltip);
                    viewtooltipVisible = false;

                    // Создаем новый элемент div для окна
                    outputWin = document.createElement("div");

                    // Устанавливаем размеры окна
                    outputWin.style.width = "400px";
                    outputWin.style.height = "350px";

                    // Устанавливаем стили для центрирования по экрану
                    outputWin.style.position = "absolute";
                    outputWin.style.zIndex = "999";
                    outputWin.style.top = "50%";
                    outputWin.style.left = "50%";
                    outputWin.style.marginTop = "-50px"; // половина высоты окна
                    outputWin.style.marginLeft = "-50px"; // половина ширины окна

                    // Устанавливаем другие стили для внешнего вида окна
                    outputWin.style.backgroundColor = "black";
                    outputWin.style.border = "1px solid white";
                    outputWin.style.borderRadius = "10px";

                    const draggingZoneAndName = document.createElement("div");
                    draggingZoneAndName.innerHTML = "Output Terminal"
                    draggingZoneAndName.style = "color: white; padding-top: 10px; padding-left: 50px; padding-bottom: 10px; font-family: 'Roboto Mono', monospace;";
                    draggingZoneAndName.style.userSelect = "none";
                    draggingZoneAndName.style.borderBottom = "1px solid white";

                    outputZone = document.createElement("div");
                    outputZone.style.backgroundColor = "transparent";
                    outputZone.style.height = "170px";
                    outputZone.style.color = "white";
                    outputZone.style = "font-family: 'Roboto Mono', monospace; font-size: 13px;";

                    function onDrag({ movementX, movementY }) {
                        if (dragAllow) {
                            let transformStyle = window.getComputedStyle(outputWin).getPropertyValue('transform');
                            let matrix = new DOMMatrix(transformStyle);
                            let currentX = matrix.m41;
                            let currentY = matrix.m42;
                            outputWin.style.transform = `translate(${currentX + movementX}px, ${currentY + movementY}px)`;
                        }
                    }

                    draggingZoneAndName.addEventListener("mousedown", ()=> {
                        draggingZoneAndName.addEventListener("mousemove", onDrag);
                    })

                    document.addEventListener("mouseup", ()=>{
                        draggingZoneAndName.removeEventListener("mousemove", onDrag);
                    })

                    draggingZoneAndName.addEventListener("contextmenu", (event)=> {
                        event.preventDefault();
                        if (menuVisible) {
                            hideContextMenu();
                        }
                        showContextMenu(event.clientX, event.clientY);

                        menuVisible = true;
                    })

                    // Перехватываем console.log и выводим в outputZone
                    console.log = function(message) {
                        originalConsoleLog.apply(console, arguments);
                        
                        // Добавляем сообщение в массив
                        messagesArray.push(`<div style="border-bottom: 1px solid white; color: white;">${message}</div>`);
                        
                        // Проверяем, превышено ли максимальное количество сообщений
                        if (messagesArray.length > maxMessages) {
                            // Удаляем самое старое сообщение
                            messagesArray.shift();
                        }
                        
                        // Обновляем outputZone с новыми сообщениями
                        outputZone.innerHTML = messagesArray.join('');
                        
                        // Прокручиваем вниз, чтобы видеть последние сообщения
                        outputZone.scrollTop = outputZone.scrollHeight;
                    };

                    // Перехватываем ошибки и выводим в outputZone
                    window.addEventListener('error', function(errorEvent) {
                        const errorMessage = errorEvent.message || 'An error occurred';
                        
                        // Добавляем сообщение в массив
                        messagesArray.push(`<div style="color: red;">${errorMessage}</div>`);
                        
                        // Проверяем, превышено ли максимальное количество сообщений
                        if (messagesArray.length > maxMessages) {
                            // Удаляем самое старое сообщение
                            messagesArray.shift();
                        }
                        
                        // Обновляем outputZone с новыми сообщениями
                        outputZone.innerHTML = messagesArray.join('');
                        
                        // Прокручиваем вниз, чтобы видеть последние сообщения
                        outputZone.scrollTop = outputZone.scrollHeight;
                    });

                    // Добавляем окно в body
                    outputWin.appendChild(draggingZoneAndName);
                    outputWin.appendChild(outputZone);
                    document.body.appendChild(outputWin);
                    outputWinVisible = true;
                }
                //console.log("Window created and positioned.");
            });


            settingsPagebutton.addEventListener("click", function (event) {
                //somethig must be there
                console.log("it click's (settingspagebutton)");

                // Перенаправление на другую страницу
                window.location.href = "pages/settingsPage/settings.html";

                // Предотвращаем всплытие события к window
                event.stopPropagation();
            });

            showHideBarbutton.addEventListener("click", (event)=> {
                document.body.removeChild(viewtooltip);
                viewtooltipVisible = false;
                if (tabsContainer.style.display == '' || tabsContainer.style.display == 'flex') {
                    tabsContainer.style.display = 'none';
                    editorId.style.gridRow = '1 / 3';
                    console.log('Tabs hidden');
                } else if (tabsContainer.style.display === 'none') {
                    tabsContainer.style.display = 'flex';
                    editorId.style.gridRow = '2 / 3';
                    console.log('Tabs revealed');
                }

            });

            showHideSideBarbutton.addEventListener("click", (event)=> {
                document.body.removeChild(viewtooltip);
                viewtooltipVisible = false;
                if (sidebarContainer.style.display == '' || sidebarContainer.style.display == 'block') {
                    sidebarContainer.style.display = 'none';
                    proj_nameId.style.display = 'none';
                    proj_nameId.style.display = 'none';
                    tabsContainer.style.gridColumn = "1 / 3";
                    editorId.style.gridColumn = '1 / 3';
                    console.log('SideBar hidden');
                } else if (sidebarContainer.style.display === 'none') {
                    sidebarContainer.style.display = 'block';
                    proj_nameId.style.display = 'block';
                    tabsContainer.style.gridColumn = "2 / 3";
                    editorId.style.gridColumn = '2 / 3';
                    console.log('SideBar revealed');
                }
            })

            viewtooltip.appendChild(outputWinbutton);
            viewtooltip.appendChild(settingsPagebutton);
            viewtooltip.appendChild(showHideBarbutton);
            viewtooltip.appendChild(showHideSideBarbutton);
            console.log(showHideBarbutton);
            // Добавляем элементы в DOM
            document.body.appendChild(viewtooltip);

            // Устанавливаем флаг видимости окна
            viewtooltipVisible = true;
        }
        // Предотвращаем всплытие события к window
        event.stopPropagation();
    });

    

    function showContextMenu(x, y) {
        menu = document.createElement("div");
        menu.style.height = "93px";
        menu.style.width = "120px";
        menu.style.position = "absolute";
        menu.style.backgroundColor = "black";
        menu.style.border = "1px solid white";
        menu.style.borderRadius = "5px";
        menu.style.zIndex = "999";

        menu.style.display = 'block';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        fixposButton = document.createElement("button");
        closeButton = document.createElement("button");
        clearOutputButton = document.createElement("button");
        
        fixposButton.className = "fixposButton";
        
        if (pinned) {
            fixposButton.innerHTML = 'Unpin it';
        } else {
            fixposButton.innerHTML = 'Pin it';
        }

        closeButton.innerHTML = 'Close';
        clearOutputButton.innerHTML = 'Clear output';

        ButtonStyle = "margin-left: 5px; width: 110px; background-color: black; color: white; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 5px;";
        HoverButtonStyle = "margin-left: 5px; width: 110px; background-color: white; color: black; border: 2px solid white; border-radius: 3px; font-family: 'Roboto Mono', monospace; margin-top: 5px;"
        fixposButton.style = ButtonStyle;
        closeButton.style = ButtonStyle;
        clearOutputButton.style = ButtonStyle;

        fixposButton.addEventListener("mouseover", function() {
            fixposButton.style = HoverButtonStyle;
        });

        fixposButton.addEventListener("mouseout", function() {
            fixposButton.style = ButtonStyle;
        });

        closeButton.addEventListener("mouseover", function() {
            closeButton.style = HoverButtonStyle;
        });

        closeButton.addEventListener("mouseout", function() {
            closeButton.style = ButtonStyle;
        });

        clearOutputButton.addEventListener("mouseover", function() {
            clearOutputButton.style = HoverButtonStyle;
        });

        clearOutputButton.addEventListener("mouseout", function() {
            clearOutputButton.style = ButtonStyle;
        });

        fixposButton.addEventListener("click", togglePin);
        closeButton.addEventListener("click", closeWin);
        clearOutputButton.addEventListener('click', clearOutput);

        function togglePin() {
            if (pinned) {
                dragAllow = true;
                //fixposButton.style.color = "green";
                pinned = false;
                console.log('Window unpinned');
            } else {
                dragAllow = false;
                pinned = true;
                console.log('Window pinned');
                //console.log(messagesArray);
            }
        }

        function closeWin() {
            console.log = originalConsoleLog;

            document.body.removeChild(outputWin);
            outputWinVisible = false;
            pinned = false;
            dragAllow = true;
            outputZone.innerHTML = '';

            messagesArray.length = 0;
            fixposButton.removeEventListener('click', togglePin);
            console.log("Window closed");
        }

        function clearOutput() {
            outputZone.innerHTML = '';
            messagesArray.length = 0;
            console.log("Output cleared");
        }

        menu.appendChild(fixposButton);
        menu.appendChild(closeButton);
        menu.appendChild(clearOutputButton);
        // Append the menu to the body
        document.body.appendChild(menu);
    }

    
    // Function to hide the context menu
    function hideContextMenu() {
        document.body.removeChild(menu);
        menuVisible = false;
    }

    function closeTooltips(event) {
        if (tooltipVisible && tooltip && !tooltip.contains(event.target)) {
            document.body.removeChild(tooltip);
            tooltipVisible = false;
        } else if (viewtooltipVisible && viewtooltip && !viewtooltip.contains(event.target)) {
            document.body.removeChild(viewtooltip);
            viewtooltipVisible = false;
        }
    }

    document.addEventListener('click', function (event) {
        closeTooltips(event);
        if (menuVisible) {
            hideContextMenu();
        }
    });

    window.addEventListener('wheel', function (event) {
        closeTooltips(event);
        if (menuVisible) {
            hideContextMenu();
        }
    });

});
