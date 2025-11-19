document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.support-form');
    const submitBtn = document.querySelector('.submit-btn');
    const fileInput = document.getElementById('adjuntos');
    const fileList = document.getElementById('file-list');
    const uploadText = document.getElementById('upload-text');
    const uploadHint = document.getElementById('upload-hint');
    const fileUploadDiv = document.querySelector('.file-upload');

    // --- Definir Mixin de SweetAlert para Tema Oscuro ---
    const DarkSwal = Swal.mixin({
        background: '#000000ff', 
        color: '#ffffff',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#ef4444'
    });

    // --- LÓGICA PARA ACTUALIZAR LA LISTA VISUAL ---
    function updateFileList() {
        fileList.innerHTML = "";
        // fileInput.files es la única fuente de verdad
        const files = fileInput.files;

        if (files.length > 0) {
            uploadText.textContent = "Archivos seleccionados:";
            uploadHint.style.display = 'none';

            Array.from(files).forEach((file, index) => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <span class="file-name">• ${file.name}</span>
                    <span class="file-size">(${formatFileSize(file.size)})</span>
                    <button type="button" class="remove-file" data-index="${index}" aria-label="Eliminar archivo">
                        <i class="fas fa-times-circle"></i>
                    </button>
                `;
                fileList.appendChild(li);
            });

            // Agregar eventos de eliminación
            document.querySelectorAll('.remove-file').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(btn.getAttribute('data-index'));
                    removeFile(index);
                });
            });
        } else {
            uploadText.textContent = "Arrastra o haz clic para adjuntar";
            uploadHint.style.display = 'block';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function removeFile(index) {
        // Crear nuevo DataTransfer para mantener archivos existentes
        const dataTransfer = new DataTransfer();
        const currentFiles = Array.from(fileInput.files);

        currentFiles.forEach((file, i) => {
            if (i !== index) {
                dataTransfer.items.add(file);
            }
        });

        // Actualizar el input con los archivos restantes
        fileInput.files = dataTransfer.files;
        updateFileList();
    }

    // --- INICIALIZAR LISTA ---
    updateFileList();

    // --- MANEJO DE CLIC EN EL CONTENEDOR ---
    fileUploadDiv.addEventListener('click', () => {
        fileInput.click();
    });

    // --- MANEJO DE CAMBIO EN INPUT DE ARCHIVOS ---
    fileInput.addEventListener('change', () => {
        // El input se actualiza solo, solo necesitamos refrescar la UI
        updateFileList();
    });

    // --- MANEJO DE DRAG AND DROP ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadDiv.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadDiv.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadDiv.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        fileUploadDiv.classList.add('dragging');
    }

    function unhighlight() {
        fileUploadDiv.classList.remove('dragging');
    }

    fileUploadDiv.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;

        if (files.length > 0) {
            const dataTransfer = new DataTransfer();
            const filesToProcess = Array.from(files).slice(0, 10);

            filesToProcess.forEach(file => {
                const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
                if (validTypes.includes(file.type) || file.name.endsWith('.pdf')) {
                    dataTransfer.items.add(file);
                }
            });

            // Asignar los archivos al input
            fileInput.files = dataTransfer.files;
            updateFileList();
        }
    });

    // --- LÓGICA DEL FORMULARIO BTN
   submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const carnet = document.getElementById('numeroCarnet').value.trim();
    const problema = document.getElementById('problema').value.trim();
    const categoria = document.getElementById('categoria').value;

    if (carnet === "" || categoria === "" || problema === "") {
        await DarkSwal.fire({
            icon: 'error',
            title: 'Campo requerido',
            text: 'Completa todos los campos obligatorios.'
        });
        return;
    }

    if (problema.length < 20) {
        await DarkSwal.fire({
            icon: 'warning',
            title: 'Descripción muy corta',
            text: 'Escribe al menos 20 caracteres.'
        });
        return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    const body = {
        numeroCarnet: carnet,
        categoria,
        problema
    };

    try {
        const response = await fetch('https://helpdesklanding.vercel.app/submit-form', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (response.status === 403) {
            await DarkSwal.fire({
                icon: 'error',
                title: 'Acceso denegado',
                text: result.error
            });
            return;
        }

        if (response.ok) {
            await DarkSwal.fire({
                icon: 'success',
                title: 'Solicitud enviada',
                text: 'Responderemos en 24 horas hábiles.'
            });
            form.reset();
        } else {
            await DarkSwal.fire({
                icon: 'error',
                title: 'Error',
                text: result.error || 'Error en el servidor.'
            });
        }

    } catch (error) {
        await DarkSwal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Servidor no disponible.'
        });
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
});

    // MANEJO DE RESETEO DEL FORMULARIO
    form.addEventListener('reset', () => {
        // Usamos un timeout corto para asegurar que el reset del DOM ocurra

        setTimeout(() => {
           
        }, 50); 
    });

});