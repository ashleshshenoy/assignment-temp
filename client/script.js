let pdfDoc = null;
let formFields = {};

document.getElementById('loadPdf').addEventListener('click', loadPdf);
document.getElementById('savePdf').addEventListener('click', savePdf);


async function loadPdf() {
    try {
        const response = await fetch('/example.pdf');
        const pdfData = await response.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        pdfDoc = await loadingTask.promise;
        
        const pdfContainer = document.getElementById('pdfContainer');
        pdfContainer.innerHTML = '';

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            await renderPage(pageNum, pdfContainer);
        }
        document.getElementById('savePdf').style.display = 'block';
    } catch (error) {
        console.error('Error loading PDF:', error);
    }
}


async function renderPage(pageNumber, container) {
    const page = await pdfDoc.getPage(pageNumber);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    
    const pageContainer = document.createElement('div');
    pageContainer.className = 'pdf-page';
    pageContainer.style.position = 'relative';
    pageContainer.style.marginBottom = '20px';

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    await page.render(renderContext);
    
    pageContainer.appendChild(canvas);
    
    const annotations = await page.getAnnotations();
    createFormFields(annotations, scale, viewport, pageContainer, pageNumber);
    
    container.appendChild(pageContainer);
}

// creates fields that are sit on top of form annotations 
// the html fields are populated with values from pdf fields
function createFormFields(annotations, scale, viewport, container, pageNumber) {
    annotations.forEach(annotation => {
        if (annotation.subtype === 'Widget') {
            let input;
            let initialValue = annotation.fieldValue || ''; 
            switch (annotation.fieldType) {
                case 'Tx':
                    input = createTextField(annotation, scale, viewport, container);
                    input.value = initialValue; 
                    break;
                case 'Btn':
                    if (annotation.checkBox) {
                        input = createCheckbox(annotation, scale, viewport, container);
                        input.checked = initialValue === 'Yes'; 
                    } else if (annotation.radioButton) {
                        input = createRadioButton(annotation, scale, viewport, container);
                        input.querySelector('input').checked = (initialValue === annotation.buttonValue);
                    }
                    break;
                case 'Ch':
                    input = createDropdown(annotation, scale, viewport, container);
                    input.value = initialValue; 
                    break;
            }

            if (input) {
                const inputElement = input.tagName === 'LABEL' ? input.querySelector('input') : input;
                inputElement.id = `${annotation.fieldName}`;
                inputElement.name = annotation.fieldName;
                inputElement.addEventListener('change', (e) => {
                    if (e.target.type === 'radio') {
                        formFields[annotation.fieldName] = e.target.checked ? e.target.value : null;
                    } else {
                        formFields[annotation.fieldName] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    }
                });
                container.appendChild(input);
            }
        }
    });
}

function createTextField(annotation, scale, viewport, container) {
    const input = document.createElement('input');
    input.type = 'text';
    setInputPosition(input, annotation, scale, viewport);
    return input;
}

function createCheckbox(annotation, scale, viewport, container) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    setInputPosition(input, annotation, scale, viewport);
    return input;
}

function createRadioButton(annotation, scale, viewport, container) {
    const label = document.createElement('label');
    label.className = 'square-radio';
    
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = annotation.fieldName;
    
    if (annotation.exportValue) {
        input.value = annotation.exportValue;
    } else {
        input.value = annotation.buttonValue || 'YES';
    }
    
    const customRadio = document.createElement('span');
    customRadio.className = 'checkmark';
    
    label.appendChild(input);
    label.appendChild(customRadio);
    
    setInputPosition(label, annotation, scale, viewport, true);
    return label;
}

function createDropdown(annotation, scale, viewport, container) {
    const select = document.createElement('select');
    setInputPosition(select, annotation, scale, viewport);
    annotation.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.exportValue;
        optionElement.textContent = option.displayValue;
        select.appendChild(optionElement);
    });
    return select;
}

function setInputPosition(input, annotation, scale, viewport, isRadio) {
    input.style.position = 'absolute';
    const height = (annotation.rect[3] - annotation.rect[1]) * scale;
    input.style.left = `${annotation.rect[0] * scale}px`;
    input.style.top = `${viewport.height - annotation.rect[3] * scale + ((!isRadio) ? height * 0.15 : 0)}px`;
    input.style.width = `${(annotation.rect[2] - annotation.rect[0]) * scale * ((isRadio) ? 0.8 : 1)}px`;
    input.style.height = `${height * 0.8}px`;
}




async function savePdf() {
    try {
        const response = await fetch('/savePdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: formFields })
        });
        if (response.ok) {
            console.log('PDF saved successfully');
            alert('PDF saved successfully');
        } else {
            console.error('Failed to save PDF');
        }
    } catch (error) {
        console.error('Error saving PDF:', error);
    }
}