/* mobile-admin/products/create/products-create.js */

let categoryTree = [];
let allBrands = [];
let selectedImageFile = null; // Aquí se guardará el Blob de la imagen recortada
let cropper = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar datos iniciales
    await Promise.all([loadCategories(), loadBrands()]);
    
    // 2. Inicializar sistema de dropdowns flotantes
    setupFloatingDropdown('cat-main-wrapper', 'cat-main-dropdown');
    setupFloatingDropdown('cat-sub-wrapper', 'cat-sub-dropdown');
    setupFloatingDropdown('brand-wrapper', 'brand-dropdown');
    
    // 3. Inicializar lógica específica
    setupCategoryLogic();
    setupBrandLogic();
    setupImageCropper();
    setupSwitch();
    setupSaveAction();
});

// =========================================================
// 1. SISTEMA DE DROPDOWNS FLOTANTES (Solución visual)
// =========================================================
function setupFloatingDropdown(wrapperId, dropdownId) {
    const wrapper = document.getElementById(wrapperId);
    const dropdown = document.getElementById(dropdownId);
    
    if (!wrapper || !dropdown) return;

    // Mover el dropdown al body para evitar que lo tapen otros elementos (z-index clipping)
    document.body.appendChild(dropdown);
    dropdown.classList.add('dropdown-portal');

    // Función para calcular posición exacta
    const positionDropdown = () => {
        const rect = wrapper.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 5}px`; // 5px de separación
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
    };

    // Evento al hacer click en el input/wrapper
    wrapper.addEventListener('click', (e) => {
        // Si clickeó una opción interna, no hacemos toggle aquí (se maneja en la opción)
        if (e.target.closest('.dropdown-option')) return;
        
        const isHidden = dropdown.classList.contains('u-hidden');
        
        // Primero cerrar cualquier otro dropdown abierto
        document.querySelectorAll('.dropdown-portal').forEach(d => d.classList.add('u-hidden'));
        
        if (isHidden) {
            positionDropdown();
            dropdown.classList.remove('u-hidden');
            
            // Recalcular posición si el usuario hace scroll o cambia tamaño de ventana
            window.addEventListener('scroll', positionDropdown, true);
            window.addEventListener('resize', positionDropdown);
        }
    });

    // Si el wrapper tiene un input de texto (como marcas), abrir al hacer focus
    const input = wrapper.querySelector('input');
    if(input && input.type === 'text') {
        input.addEventListener('focus', () => {
            positionDropdown();
            dropdown.classList.remove('u-hidden');
        });
    }
}

// Cerrar todos los dropdowns al hacer click fuera
document.addEventListener('click', (e) => {
    const isClickInWrapper = e.target.closest('.custom-select-container');
    const isClickInDropdown = e.target.closest('.dropdown-portal');
    const isClickInCropper = e.target.closest('.cropper-modal'); // Evitar cerrar si interactúa con el modal

    if (!isClickInWrapper && !isClickInDropdown && !isClickInCropper) {
        document.querySelectorAll('.dropdown-portal').forEach(d => d.classList.add('u-hidden'));
    }
});


// =========================================================
// 2. LÓGICA DE CATEGORÍAS
// =========================================================
async function loadCategories() {
    const res = await mobileApi.getCategoriesTree();
    if(res.success) categoryTree = res.data;
}

function setupCategoryLogic() {
    const mainDropdown = document.getElementById('cat-main-dropdown');
    const subDropdown = document.getElementById('cat-sub-dropdown');
    const mainWrapper = document.getElementById('cat-main-wrapper'); 
    
    // Renderizar categorías principales al abrir
    mainWrapper.addEventListener('click', () => {
        renderCategories(mainDropdown);
    });
}

function renderCategories(dropdown) {
    dropdown.innerHTML = '';
    categoryTree.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'dropdown-option';
        div.textContent = cat.name;
        div.onclick = () => {
            selectCategory(cat);
            dropdown.classList.add('u-hidden');
        };
        dropdown.appendChild(div);
    });
}

function selectCategory(cat) {
    // 1. Asignar Padre
    document.getElementById('cat_main_display').value = cat.name;
    document.getElementById('cat_main_id').value = cat.id;
    
    // 2. Resetear Hijo
    const subDisplay = document.getElementById('cat_sub_display');
    const subId = document.getElementById('cat_sub_id');
    const subWrapper = document.getElementById('cat-sub-wrapper');
    const subDropdown = document.getElementById('cat-sub-dropdown');
    
    subDisplay.value = '';
    subId.value = '';
    subDropdown.innerHTML = '';

    // 3. Configurar hijos si existen
    if (cat.subcategories && cat.subcategories.length > 0) {
        subWrapper.style.opacity = '1';
        subWrapper.style.pointerEvents = 'auto';
        
        cat.subcategories.forEach(sub => {
            const div = document.createElement('div');
            div.className = 'dropdown-option';
            div.textContent = sub.name;
            div.onclick = () => {
                subDisplay.value = sub.name;
                subId.value = sub.id;
                subDropdown.classList.add('u-hidden');
            };
            subDropdown.appendChild(div);
        });
    } else {
        // Deshabilitar si no hay hijos
        subWrapper.style.opacity = '0.5';
        subWrapper.style.pointerEvents = 'none';
        subDisplay.placeholder = "(Sin subcategorías)";
    }
}


// =========================================================
// 3. LÓGICA DE MARCAS (Buscar + Crear)
// =========================================================
async function loadBrands() {
    const res = await mobileApi.getBrands();
    if(res.success) allBrands = res.data;
}

function setupBrandLogic() {
    const input = document.getElementById('brand_input');
    const dropdown = document.getElementById('brand-dropdown');

    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtered = term === '' ? allBrands : allBrands.filter(b => b.name.toLowerCase().includes(term));
        renderBrands(filtered, dropdown, term);
    });
    
    input.addEventListener('focus', () => {
        const term = input.value.trim();
        renderBrands(allBrands, dropdown, term);
    });
}

function renderBrands(list, dropdown, searchTerm = '') {
    dropdown.innerHTML = '';
    
    // Opciones existentes
    list.forEach(b => {
        const div = document.createElement('div');
        div.className = 'dropdown-option';
        div.textContent = b.name;
        div.onclick = () => {
            document.getElementById('brand_input').value = b.name;
            document.getElementById('brand_id').value = b.id;
            dropdown.classList.add('u-hidden');
        };
        dropdown.appendChild(div);
    });

    // Opción de crear nueva
    if(searchTerm && !list.some(b => b.name.toLowerCase() === searchTerm.toLowerCase())) {
        const createDiv = document.createElement('div');
        createDiv.className = 'dropdown-option create-option';
        createDiv.innerHTML = `+ Crear "${searchTerm}"`;
        createDiv.onclick = async () => createNewBrand(searchTerm);
        dropdown.appendChild(createDiv);
    }
}

async function createNewBrand(name) {
    const dropdown = document.getElementById('brand-dropdown');
    const input = document.getElementById('brand_input');
    
    input.disabled = true; input.value = "Creando...";
    const res = await mobileApi.createBrand(name);
    input.disabled = false;
    
    if(res.success) {
        allBrands.push(res.data);
        input.value = res.data.name;
        document.getElementById('brand_id').value = res.data.id;
        dropdown.classList.add('u-hidden');
        showToast(`Marca creada`, 'success');
    } else {
        input.value = name;
        showToast('Error al crear marca', 'error');
    }
}


// =========================================================
// 4. RECORTE DE IMAGEN (CROPPER.JS)
// =========================================================
function setupImageCropper() {
    const box = document.getElementById('image-preview-box');
    const fileInput = document.getElementById('image_file');
    const modal = document.getElementById('cropper-modal');
    const cropperImg = document.getElementById('cropper-image');
    const previewImg = document.getElementById('preview-img');
    const placeholder = document.getElementById('upload-placeholder');
    const removeBtn = document.getElementById('btn-remove-img');
    const cancelBtn = document.getElementById('btn-cancel-crop');
    const confirmBtn = document.getElementById('btn-confirm-crop');

    // 1. Abrir selector de archivos
    box.addEventListener('click', (e) => {
        if(e.target !== removeBtn) fileInput.click();
    });

    // 2. Al seleccionar archivo
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (ev) => {
                // Asignar fuente
                cropperImg.src = ev.target.result;
                
                // Mostrar modal (primero quitar hidden)
                modal.classList.remove('u-hidden');
                
                // Pequeño timeout para asegurar que el DOM se pintó y la imagen tiene dimensiones
                setTimeout(() => {
                    modal.classList.add('is-visible'); // Transición CSS
                    
                    // Iniciar Cropper
                    if(cropper) cropper.destroy();
                    
                    cropper = new Cropper(cropperImg, {
                        aspectRatio: 1, // Cuadrado 1:1
                        viewMode: 1,    // Restringir el recorte al contenedor
                        dragMode: 'move',
                        autoCropArea: 1, // Ocupar todo el espacio posible
                        background: false, // Quitar fondo de cuadritos
                        responsive: true,
                        restore: false,
                    });
                }, 150); 
            };
            
            reader.readAsDataURL(file);
        }
        // Limpiar input para permitir seleccionar la misma imagen si se cancela
        fileInput.value = '';
    });

    // 3. Confirmar Recorte
    confirmBtn.addEventListener('click', () => {
        if(!cropper) return;
        
        // Obtener el recorte como Blob (JPG optimizado)
        cropper.getCroppedCanvas({
            width: 800, height: 800,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        }).toBlob((blob) => {
            selectedImageFile = blob; // Guardar en variable global para subirlo luego
            
            // Mostrar vista previa en el formulario
            const url = URL.createObjectURL(blob);
            previewImg.src = url;
            previewImg.classList.remove('u-hidden');
            removeBtn.classList.remove('u-hidden');
            placeholder.classList.add('u-hidden');
            
            closeCropperModal();
        }, 'image/jpeg', 0.9);
    });

    // 4. Cancelar
    cancelBtn.addEventListener('click', () => {
        closeCropperModal();
        selectedImageFile = null;
    });

    function closeCropperModal() {
        modal.classList.remove('is-visible');
        setTimeout(() => {
            modal.classList.add('u-hidden');
            if(cropper) {
                cropper.destroy();
                cropper = null;
            }
            cropperImg.src = '';
        }, 300);
    }

    // 5. Eliminar imagen previa
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedImageFile = null;
        previewImg.classList.add('u-hidden');
        removeBtn.classList.add('u-hidden');
        placeholder.classList.remove('u-hidden');
        previewImg.src = '';
    });
}


// =========================================================
// 5. SWITCH ESTADO
// =========================================================
function setupSwitch() {
    const sw = document.getElementById('is_active');
    const txt = document.getElementById('status-text');
    sw.addEventListener('change', (e) => {
        txt.textContent = e.target.checked ? 'Producto Activo' : 'Producto Inactivo';
        txt.style.color = e.target.checked ? '#10b981' : '#ef4444';
    });
}


// =========================================================
// 6. GUARDAR PRODUCTO
// =========================================================
function setupSaveAction() {
    const btn = document.getElementById('btn-save');
    
    btn.addEventListener('click', async () => {
        const name = document.getElementById('name').value.trim();
        const mainCatId = document.getElementById('cat_main_id').value;
        const subCatId = document.getElementById('cat_sub_id').value;
        const brandId = document.getElementById('brand_id').value;
        const price = parseFloat(document.getElementById('suggested_price').value);
        const isActive = document.getElementById('is_active').checked;

        // Validaciones
        if (!selectedImageFile) { showToast('Falta la imagen del producto', 'error'); return; }
        if (!name) { showToast('El nombre es obligatorio', 'error'); return; }
        if (!mainCatId) { showToast('Selecciona una categoría', 'error'); return; }
        if (!brandId) { showToast('Selecciona una marca', 'error'); return; }

        btn.disabled = true;
        btn.textContent = 'Subiendo imagen...';

        // 1. Subir Imagen
        // Convertimos el Blob (del cropper) a un archivo File para la API
        const fileToUpload = new File([selectedImageFile], `prod-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const uploadRes = await mobileApi.uploadProductImage(fileToUpload);
        
        if(!uploadRes.success) {
            showToast('Error al subir imagen', 'error');
            btn.disabled = false;
            btn.textContent = 'Guardar Producto';
            return;
        }

        btn.textContent = 'Guardando datos...';

        // 2. Guardar Datos del Producto
        const finalCategoryId = subCatId ? subCatId : mainCatId;
        
        const productData = {
            name: name,
            category_id: finalCategoryId,
            brand_id: brandId,
            suggested_price: isNaN(price) ? 0 : price,
            image_url: uploadRes.url,
            is_active: isActive
        };

        const res = await mobileApi.createProduct(productData);
        
        if(res.success) {
            showToast('Producto creado correctamente', 'success');
            setTimeout(() => history.back(), 1500);
        } else {
            showToast(res.error || 'Error al guardar', 'error');
            btn.disabled = false;
            btn.textContent = 'Guardar Producto';
        }
    });
}