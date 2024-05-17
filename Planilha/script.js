document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    displayHistory();
    document.getElementById('themeToggle').addEventListener('change', toggleTheme);
});

document.getElementById('fileInput').addEventListener('change', handleFile);
document.getElementById('saveButton').addEventListener('click', saveSpreadsheet);

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = event.target.result;
        let workbook;
        if (file.name.endsWith('.csv')) {
            workbook = XLSX.read(data, { type: 'binary' });
        } else {
            workbook = XLSX.read(data, { type: 'array' });
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

        displayTable(json);
        enableDownload(json);
        enableSave();
    };

    if (file.name.endsWith('.csv')) {
        reader.readAsBinaryString(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function displayTable(data) {
    const table = document.getElementById('excelTable');
    table.innerHTML = '';

    const tbody = document.createElement('tbody');

    data.forEach((row, rowIndex) => {
        const rowElement = document.createElement('tr');
        rowElement.addEventListener('click', function() {
            const rows = table.getElementsByTagName('tr');
            for (let i = 0; i < rows.length; i++) {
                rows[i].classList.remove('highlighted-row');
            }
            rowElement.classList.add('highlighted-row');
        });

        row.forEach((cell, cellIndex) => {
            const cellElement = document.createElement('td');
            const inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = cell;
            inputElement.addEventListener('input', (event) => {
                data[rowIndex][cellIndex] = event.target.value;
            });
            inputElement.addEventListener('paste', handlePaste);
            cellElement.appendChild(inputElement);
            rowElement.appendChild(cellElement);
        });

        tbody.appendChild(rowElement);
    });

    table.appendChild(tbody);

    makeTableResizable(table);
}

function handlePaste(event) {
    event.preventDefault();
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('Text');
    const inputElement = event.target;
    inputElement.value = pastedData;
    const rowIndex = inputElement.closest('tr').rowIndex - 1;
    const cellIndex = inputElement.closest('td').cellIndex;
    const tableData = getTableData();
    tableData[rowIndex][cellIndex] = pastedData;
}

function enableDownload(data) {
    const downloadButton = document.getElementById('downloadButton');
    downloadButton.style.display = 'inline-block';

    downloadButton.addEventListener('click', () => {
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, worksheet, 'Sheet1');
        XLSX.writeFile(newWorkbook, 'planilha_com_alteracoes.xlsx');
    });
}

function enableSave() {
    const saveButton = document.getElementById('saveButton');
    saveButton.style.display = 'inline-block';
}

function saveSpreadsheet() {
    const fileName = prompt('Digite o nome do arquivo:');
    if (!fileName) return;

    let history = JSON.parse(localStorage.getItem('spreadsheetHistory') || '[]');
    const existingIndex = history.findIndex(item => item.name === fileName);

    if (existingIndex !== -1) {
        const overwrite = confirm('Já existe uma planilha com esse nome. Deseja substituir?');
        if (!overwrite) return;

        history[existingIndex] = createHistoryItem(fileName);
    } else {
        history.push(createHistoryItem(fileName));
    }

    localStorage.setItem('spreadsheetHistory', JSON.stringify(history));
    alert('Planilha salva no histórico!');
    displayHistory();
}

function createHistoryItem(fileName) {
    const tableData = getTableData();
    const date = new Date().toLocaleString();
    return { name: fileName, date, data: tableData };
}

function getTableData() {
    const table = document.getElementById('excelTable');
    const data = [];
    table.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td input').forEach(cell => {
            rowData.push(cell.value);
        });
        data.push(rowData);
    });
    return data;
}

function displayHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    const history = JSON.parse(localStorage.getItem('spreadsheetHistory') || '[]');
    history.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span onclick="loadSpreadsheet(${index})">Planilha ${index + 1} - ${item.name} (${item.date})</span>
            <button onclick="deleteSpreadsheet(${index})">Excluir</button>
        `;
        historyList.appendChild(li);
    });
}

function loadSpreadsheet(index) {
    const history = JSON.parse(localStorage.getItem('spreadsheetHistory') || '[]');
    const data = history[index].data;
    displayTable(data);
    enableDownload(data);
}

function deleteSpreadsheet(index) {
    let history = JSON.parse(localStorage.getItem('spreadsheetHistory') || '[]');
    history.splice(index, 1);
    localStorage.setItem('spreadsheetHistory', JSON.stringify(history));
    displayHistory();
}

// Função para alternar o tema
function toggleTheme() {
    const isDarkMode = document.getElementById('themeToggle').checked;
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    applyTheme();
}

// Função para aplicar o tema atual
function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.className = theme;
    document.getElementById('themeToggle').checked = theme === 'dark';
    document.getElementById('themeLabel').textContent = theme === 'dark' ? 'Modo Claro' : 'Modo Escuro';
}

function makeTableResizable(table) {
    const cols = table.getElementsByTagName('th');
    for (let i = 0; i < cols.length; i++) {
        const div = createDiv(table.offsetHeight);
        cols[i].appendChild(div);
        cols[i].style.position = 'relative';
        setListeners(div);
    }
}

function createDiv(height) {
    const div = document.createElement('div');
    div.style.top = 0;
    div.style.right = 0;
    div.style.width = '5px';
    div.style.position = 'absolute';
    div.style.cursor = 'col-resize';
    div.style.userSelect = 'none';
    div.style.height = height + 'px';
    return div;
}

function setListeners(div) {
    let pageX, curCol, nxtCol, curColWidth, nxtColWidth;

    div.addEventListener('mousedown', function (e) {
        curCol = e.target.parentElement;
        nxtCol = curCol.nextElementSibling;
        pageX = e.pageX;

        curColWidth = curCol.offsetWidth;
        if (nxtCol) nxtColWidth = nxtCol.offsetWidth;
    });

    document.addEventListener('mousemove', function (e) {
        if (curCol) {
            const diffX = e.pageX - pageX;

            if (nxtCol) nxtCol.style.width = (nxtColWidth - diffX) + 'px';

            curCol.style.width = (curColWidth + diffX) + 'px';
        }
    });

    document.addEventListener('mouseup', function () {
        curCol = undefined;
        nxtCol = undefined;
        pageX = undefined;
        curColWidth = undefined;
        nxtColWidth = undefined;
    });
}
