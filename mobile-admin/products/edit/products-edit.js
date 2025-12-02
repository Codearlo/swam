/* mobile-admin/products/edit/products-edit.js */

let categoryTree = [];
let allBrands = [];
let selectedImageFile = null;
let cropper = null;
let currentProductId = null;
let originalImageUrl = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    currentProductId = params.get('id');

    if (!currentProductId) {
        showToast('Producto no especificado', 'error');
        setTimeout(() => history.back(), 1000);
        return;
    }

    await Promise.all([loadCategories(), loadBrands()]);
    
    setupFloatingDropdown('cat-main-wrapper', 'cat-main-dropdown');
    setupFloatingDropdown('cat-sub-wrapper', 'cat-sub-dropdown');
    setupFloatingDropdown('brand-wrapper', 'brand-dropdown');
    
    setupCategoryLogic();
    setupBrandLogic();
    setupImageCropper();
    setupSwitch();
    setupSaveAction();
    setupDeleteAction();

    await loadProductData(currentProductId);
});

async function loadProductData(id) {
    if (typeof mobileApi === 'undefined') return;

    const res = await mobileApi.getProductById(id);
    if (!res.success || !res.data) {
        showToast('Error cargando producto', 'error');
        return;
    }

    const p = res.data;

    document.getElementById('name').value = p.name;
    document.getElementById('suggested_price').value = p.suggested_price;
    
    originalImageUrl = p.image_url;
    
    if (originalImageUrl) {
        const preview = document.getElementById('preview-img');
        preview.src = originalImageUrl;
        preview.classList.remove('u-hidden');
        document.getElementById('upload-placeholder').classList.add('u-hidden');
        document.getElementById('btn-remove-img').classList.remove('u-hidden');
    }

    const sw = document.getElementById('is_active');
    sw.checked = p.is_active;
    sw.dispatchEvent(new Event('change'));

    if (p.brands) {
        document.getElementById('brand_input').value = p.brands.name;
        document.getElementById('brand_id').value = p.brand_id;
    }

    if (p.category_id) {
        let found = false;
        const parentCat = categoryTree.find(c => c.id == p.category_id);
        if (parentCat) {
            selectCategory(parentCat);
            found = true;
        } else {
            for (const parent of categoryTree) {
                if (parent.subcategories) {
                    const sub = parent.subcategories.find(s => s.id == p.category_id);
                    if (sub) {
                        selectCategory(parent);
                        document.getElementById('cat_sub_display').value = sub.name;
                        document.getElementById('cat_sub_id').value = sub.id;
                        found = true;
                        break;
                    }
                }
            }
        }
    }
}

// ... (Funciones UI auxiliares igual que antes) ...
function setupFloatingDropdown(wrapperId, dropdownId) {
    const wrapper = document.getElementById(wrapperId);
    const dropdown = document.getElementById(dropdownId);
    if (!wrapper || !dropdown) return;
    document.body.appendChild(dropdown);
    dropdown.classList.add('dropdown-portal');

    const positionDropdown = () => {
        const rect = wrapper.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.width = `${rect.width}px`;
    };

    wrapper.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-option')) return;
        const isHidden = dropdown.classList.contains('u-hidden');
        document.querySelectorAll('.dropdown-portal').forEach(d => d.classList.add('u-hidden'));
        if (isHidden) {
            positionDropdown();
            dropdown.classList.remove('u-hidden');
            window.addEventListener('scroll', positionDropdown, true);
            window.addEventListener('resize', positionDropdown);
        }
    });

    const input = wrapper.querySelector('input[type="text"]');
    if(input) {
        input.addEventListener('focus', () => {
            positionDropdown();
            dropdown.classList.remove('u-hidden');
        });
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-container') && !e.target.closest('.dropdown-portal') && !e.target.closest('.cropper-modal')) {
        document.querySelectorAll('.dropdown-portal').forEach(d => d.classList.add('u-hidden'));
    }
});

async function loadCategories() {
    if (typeof mobileApi === 'undefined') return;
    const res = await mobileApi.getCategoriesTree();
    if(res.success) categoryTree = res.data;
}

function setupCategoryLogic() {
    const mainDropdown = document.getElementById('cat-main-dropdown');
    const mainWrapper = document.getElementById('cat-main-wrapper');
    mainWrapper.addEventListener('click', () => renderCategories(mainDropdown));
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
    document.getElementById('cat_main_display').value = cat.name;
    document.getElementById('cat_main_id').value = cat.id;
    const subDisplay = document.getElementById('cat_sub_display');
    const subId = document.getElementById('cat_sub_id');
    const subWrapper = document.getElementById('cat-sub-wrapper');
    const subDropdown = document.getElementById('cat-sub-dropdown');
    
    subDisplay.value = '';
    subId.value = '';
    subDropdown.innerHTML = '';

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
        subWrapper.style.opacity = '0.5';
        subWrapper.style.pointerEvents = 'none';
        subDisplay.placeholder = "(Sin subcat.)";
    }
}

async function loadBrands() {
    if (typeof mobileApi === 'undefined') return;
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
    input.addEventListener('focus', () => renderBrands(allBrands, dropdown, input.value.trim()));
}

function renderBrands(list, dropdown, searchTerm = '') {
    dropdown.innerHTML = '';
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
    if(searchTerm && !list.some(b => b.name.toLowerCase() === searchTerm.toLowerCase())) {
        const createDiv = document.createElement('div');
        createDiv.className = 'dropdown-option create-option';
        createDiv.innerHTML = `+ Crear "${searchTerm}"`;
        createDiv.onclick = async () => createNewBrand(searchTerm);
        dropdown.appendChild(createDiv);
    }
}

async function createNewBrand(name) {
    const input = document.getElementById('brand_input');
    input.disabled = true; input.value = "Creando...";
    const res = await mobileApi.createBrand(name);
    input.disabled = false;
    if(res.success) {
        allBrands.push(res.data);
        input.value = res.data.name;
        document.getElementById('brand_id').value = res.data.id;
        document.getElementById('brand-dropdown').classList.add('u-hidden');
        showToast(`Marca creada`, 'success');
    } else {
        input.value = name;
        showToast('Error al crear marca', 'error');
    }
}

function setupImageCropper() {
    const box = document.getElementById('image-preview-box');
    const fileInput = document.getElementById('image_file');
    const modal = document.getElementById('cropper-modal');
    const cropperImg = document.getElementById('cropper-image');
    const previewImg = document.getElementById('preview-img');
    const placeholder = document.getElementById('upload-placeholder');
    const removeBtn = document.getElementById('btn-remove-img');
    const confirmBtn = document.getElementById('btn-confirm-crop');
    const cancelBtn = document.getElementById('btn-cancel-crop');

    box.addEventListener('click', (e) => {
        if(e.target !== removeBtn) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                cropperImg.src = ev.target.result;
                modal.classList.remove('u-hidden');
                setTimeout(() => {
                    modal.classList.add('is-visible');
                    if(cropper) cropper.destroy();
                    cropper = new Cropper(cropperImg, {
                        aspectRatio: 1, viewMode: 1, dragMode: 'move', autoCropArea: 1,
                        background: false, responsive: true, modal: true
                    });
                }, 150);
            };
            reader.readAsDataURL(file);
        }
        fileInput.value = '';
    });

    confirmBtn.addEventListener('click', () => {
        if(!cropper) return;
        cropper.getCroppedCanvas({
            width: 800, height: 800, fillColor: '#fff'
        }).toBlob((blob) => {
            selectedImageFile = blob;
            const url = URL.createObjectURL(blob);
            previewImg.src = url;
            previewImg.classList.remove('u-hidden');
            removeBtn.classList.remove('u-hidden');
            placeholder.classList.add('u-hidden');
            modal.classList.remove('is-visible');
            setTimeout(() => {
                modal.classList.add('u-hidden');
                if(cropper) { cropper.destroy(); cropper = null; }
                cropperImg.src = '';
            }, 300);
        }, 'image/jpeg', 0.9);
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('is-visible');
        setTimeout(() => {
            modal.classList.add('u-hidden');
            if(cropper) { cropper.destroy(); cropper = null; }
        }, 300);
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedImageFile = null;
        previewImg.src = '';
        previewImg.classList.add('u-hidden');
        removeBtn.classList.add('u-hidden');
        placeholder.classList.remove('u-hidden');
    });
}

function setupSwitch() {
    const sw = document.getElementById('is_active');
    const txt = document.getElementById('status-text');
    sw.addEventListener('change', (e) => {
        txt.textContent = e.target.checked ? 'Producto Activo' : 'Producto Inactivo';
        txt.style.color = e.target.checked ? '#10b981' : '#ef4444';
    });
}

// --- GUARDAR Y BORRAR ---
function setupSaveAction() {
    const btn = document.getElementById('btn-save');
    btn.addEventListener('click', async () => {
        const name = document.getElementById('name').value.trim();
        const mainCatId = document.getElementById('cat_main_id').value;
        const subCatId = document.getElementById('cat_sub_id').value;
        const brandId = document.getElementById('brand_id').value;
        const price = parseFloat(document.getElementById('suggested_price').value);
        const isActive = document.getElementById('is_active').checked;

        if (!name) { showToast('Falta nombre', 'error'); return; }
        if (!mainCatId) { showToast('Falta categoría', 'error'); return; }
        if (!brandId) { showToast('Falta marca', 'error'); return; }

        btn.disabled = true; btn.textContent = 'Guardando...';

        let finalImageUrl = originalImageUrl;
        let shouldDeleteOld = false;

        // Caso 1: Nueva imagen
        if (selectedImageFile) {
            btn.textContent = 'Subiendo imagen...';
            const fileToUpload = new File([selectedImageFile], `prod-${Date.now()}.jpg`, { type: 'image/jpeg' });
            const uploadRes = await mobileApi.uploadProductImage(fileToUpload);
            
            if(!uploadRes.success) {
                showToast('Error al subir imagen', 'error');
                btn.disabled = false; return;
            }
            finalImageUrl = uploadRes.url;
            shouldDeleteOld = true;
        } 
        // Caso 2: Se quitó la imagen
        else if (!selectedImageFile && document.getElementById('preview-img').classList.contains('u-hidden')) {
            finalImageUrl = null;
            shouldDeleteOld = true;
        }

        if (!originalImageUrl) shouldDeleteOld = false;

        const finalCategoryId = subCatId ? subCatId : mainCatId;
        const data = {
            name, category_id: finalCategoryId, brand_id: brandId,
            suggested_price: isNaN(price) ? 0 : price,
            image_url: finalImageUrl,
            is_active: isActive
        };

        const res = await mobileApi.updateProduct(currentProductId, data);
        
        if(res.success) {
            if (shouldDeleteOld && originalImageUrl) {
                console.log('🗑️ Ejecutando borrado de imagen antigua...');
                // Aquí llamamos al servicio que ahora nos avisa si falla
                await mobileApi.deleteProductImage(originalImageUrl);
            }

            showToast('Producto actualizado', 'success');
            setTimeout(() => history.back(), 1500);
        } else {
            showToast(res.error || 'Error al actualizar', 'error');
            btn.disabled = false; btn.textContent = 'Guardar Cambios';
        }
    });
}

function setupDeleteAction() {
    const btn = document.getElementById('btn-delete');
    btn.addEventListener('click', () => {
        if(confirm('¿Eliminar producto?')) {
             showToast('Eliminación en desarrollo', 'info');
        }
    });
}