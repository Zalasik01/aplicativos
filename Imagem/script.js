document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    displayHistory(1);
    document.getElementById('themeToggle').addEventListener('change', toggleTheme);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', function(event) {
        if (event.target === this) {
            closeModal();
        }
    });
});

document.getElementById('imageInput').addEventListener('change', handleImage);
document.getElementById('convertButton').addEventListener('click', convertImage);

const itemsPerPage = 5;

function handleImage(event) {
    const file = event.target.files[0];
    const fileFormat = document.getElementById('fileFormat');
    fileFormat.textContent = file ? `Formato: ${file.type}` : 'Nenhum arquivo selecionado';
}

function convertImage() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];
    const outputFormat = document.getElementById('outputFormat').value;
    const resizeOption = document.getElementById('resizeOptions').value;
    
    if (!file) {
        alert('Selecione uma imagem primeiro.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width, height;
            if (resizeOption === 'original') {
                width = img.width;
                height = img.height;
            } else {
                [width, height] = resizeOption.split('x').map(Number);
            }
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            if (outputFormat === 'pdf') {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: width > height ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [width, height]
                });
                pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, width, height);
                const pdfUrl = pdf.output('bloburl');
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `image.pdf`;
                document.getElementById('downloadSection').style.display = 'block';
                document.getElementById('downloadButton').onclick = function() {
                    link.click();
                };
                saveHistory(pdfUrl, link.download, width, height, 'pdf');
            } else {
                const newDataUrl = canvas.toDataURL(`image/${outputFormat}`);
                const link = document.createElement('a');
                link.href = newDataUrl;
                link.download = `image.${outputFormat}`;
                document.getElementById('downloadSection').style.display = 'block';
                document.getElementById('downloadButton').onclick = function() {
                    link.click();
                };
                saveHistory(link.href, link.download, width, height);
            }
        };
    };
    reader.readAsDataURL(file);
}

function saveHistory(url, fileName, width, height, type = 'image') {
    let history = JSON.parse(localStorage.getItem('imageConversionHistory') || '[]');
    history.unshift({ url, fileName, width, height, type });
    localStorage.setItem('imageConversionHistory', JSON.stringify(history));
    displayHistory(1);
}

function displayHistory(page) {
    const historyList = document.getElementById('historyList');
    const pagination = document.getElementById('pagination');
    historyList.innerHTML = '';
    pagination.innerHTML = '';
    const history = JSON.parse(localStorage.getItem('imageConversionHistory') || '[]');
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = history.slice(start, end);

    pageItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>Imagem ${start + index + 1}: ${item.fileName} (${item.width}x${item.height})</span>
            <div>
                <button onclick="viewFile('${item.url}', '${item.fileName}', '${item.type}')" class="button">Visualizar</button>
                <button onclick="downloadImage('${item.url}', '${item.fileName}')" class="button">Download</button>
            </div>
        `;
        historyList.appendChild(li);
    });

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = 'page-btn';
        if (i === page) {
            pageBtn.classList.add('active');
        }
        pageBtn.addEventListener('click', () => displayHistory(i));
        pagination.appendChild(pageBtn);
    }
}

function viewFile(url, fileName, type) {
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modalImage');
    const captionText = document.getElementById('caption');
    modal.style.display = 'block';

    if (type === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '80vh';
        iframe.style.border = 'none';
        modalImg.style.display = 'none';
        modal.appendChild(iframe);
    } else {
        modalImg.src = url;
        modalImg.style.display = 'block';
    }
    
    captionText.innerHTML = fileName;
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    const iframe = modal.querySelector('iframe');
    if (iframe) {
        iframe.remove();
    }
}

function downloadImage(url, fileName) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
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
