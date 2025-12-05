// QRForge - Main JavaScript File
// Handles all interactive functionality and QR code generation

class QRForge {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.generationCounter = 1247;
        this.currentQRData = null;
        this.batchData = [];
        this.customizationSettings = {
            template: 'classic',
            fgColor: '#000000',
            bgColor: '#ffffff',
            dotStyle: 'square',
            cornerStyle: 'square',
            size: 200,
            margin: 4,
            ecc: 'H'
        };

        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('batch.html')) return 'batch';
        if (path.includes('customize.html')) return 'customize';
        return 'generator';
    }

    init() {
        this.initAnimations();
        this.initEventListeners();

        // Page-specific initialization
        switch (this.currentPage) {
            case 'generator':
                this.initGenerator();
                break;
            case 'batch':
                this.initBatch();
                break;
            case 'customize':
                this.initCustomize();
                break;
        }

        // Start counter animation
        this.animateCounter();
    }

    initAnimations() {
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });

        // Animate navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('mouseenter', () => {
                anime({
                    targets: link,
                    scale: 1.05,
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            });

            link.addEventListener('mouseleave', () => {
                anime({
                    targets: link,
                    scale: 1,
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            });
        });
    }

    animateCounter() {
        const counter = document.getElementById('generation-counter');
        if (counter) {
            setInterval(() => {
                this.generationCounter += Math.floor(Math.random() * 3);
                anime({
                    targets: counter,
                    innerHTML: [counter.innerHTML, this.generationCounter],
                    duration: 1000,
                    easing: 'easeOutQuad',
                    round: 1
                });
            }, 15000);
        }
    }

    initEventListeners() {
        // Common event listeners for all pages
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                this.handleAction(e.target.dataset.action, e.target);
            }
        });

        // Handle form submissions
        document.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        this.initMobileMenu();
    }

    initMobileMenu() {
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');

        if (btn && menu) {
            btn.addEventListener('click', () => {
                menu.classList.toggle('hidden');
            });
        }
    }

    handleAction(action, element) {
        switch (action) {
            case 'reset':
                this.resetSettings();
                break;
            case 'copy-link':
                this.copyDirectLink();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    // Generator Page Functions
    initGenerator() {
        this.initDataTypeSelector();
        this.initLivePreview();
        this.initColorControls();
        this.initSizeControl();
        this.initDownloadButton();
        // this.initECCBtns(); // Removed

        // Generate initial QR code
        this.generateQR();
    }

    initDataTypeSelector() {
        const buttons = document.querySelectorAll('.data-type-btn');
        const forms = document.querySelectorAll('.input-form');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show corresponding form
                const type = btn.dataset.type;
                forms.forEach(form => {
                    form.classList.add('hidden');
                    form.classList.remove('active');
                });

                const activeForm = document.getElementById(type + '-form');
                if (activeForm) {
                    activeForm.classList.remove('hidden');
                    activeForm.classList.add('active');

                    // Focus first input
                    const firstInput = activeForm.querySelector('input, textarea');
                    if (firstInput) firstInput.focus();
                }

                this.generateQR();
            });
        });

        // Add input event listeners for live preview
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', this.debounce(() => {
                    this.generateQR();
                }, 300));
            });
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // initECCBtns removed

    initLivePreview() {
        // This will be triggered by input events
    }

    initColorControls() {
        const fgColor = document.getElementById('fg-color');
        const bgColor = document.getElementById('bg-color');

        if (fgColor && bgColor) {
            [fgColor, bgColor].forEach(picker => {
                picker.addEventListener('change', () => {
                    this.generateQR();
                });
            });
        }
    }

    initSizeControl() {
        const sizeSlider = document.getElementById('size-slider');
        const sizeValue = document.getElementById('size-value');

        if (sizeSlider && sizeValue) {
            sizeSlider.addEventListener('input', (e) => {
                sizeValue.textContent = e.target.value;
                this.generateQR();
            });
        }
    }

    initDownloadButton() {
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadQR();
            });
        }
    }

    getQRData() {
        const activeType = document.querySelector('.data-type-btn.active')?.dataset.type;
        const activeForm = document.querySelector('.input-form.active');

        if (!activeType || !activeForm) return null;

        const data = {};
        const inputs = activeForm.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            if (input.id && input.value) {
                const key = input.id.replace(/^(url|text|email|phone|wifi|sms)-/, '');
                data[key] = input.value;
            }
        });

        return {
            type: activeType,
            data: data
        };
    }

    getQRSettings() {
        const size = document.getElementById('size-slider')?.value || 200;
        const ecc = 'H'; // Hardcoded to High
        const fgColor = document.getElementById('fg-color')?.value || '#000000';
        const bgColor = document.getElementById('bg-color')?.value || '#ffffff';
        const format = document.getElementById('format-select')?.value || 'png';

        return {
            size: parseInt(size),
            ecc: ecc,
            fg_color: fgColor,
            bg_color: bgColor,
            format: format
        };
    }

    generateQRString(type, data) {
        switch (type) {
            case 'url':
                return data.url || data.text || data.input || '';
            case 'text':
                return data.text || data.content || data.input || '';
            case 'email':
                const email = data.email || data.input || '';
                if (!email) return '';
                let mailto = `mailto:${email}`;
                const params = [];
                if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
                if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
                if (params.length) mailto += `?${params.join('&')}`;
                return mailto;
            case 'phone':
                const phone = data.phone || data.text || data.input || '';
                return phone ? `tel:${phone}` : '';
            case 'wifi':
                const ssid = data.ssid || data.input || '';
                if (!ssid) return '';
                let wifi = `WIFI:S:${ssid};`;
                if (data.password && data.security !== 'nopass') {
                    wifi += `P:${data.password};T:${data.security};`;
                } else if (data.security === 'nopass') {
                    wifi += `T:nopass;`;
                }
                wifi += ';';
                return wifi;
            case 'sms':
                const smsPhone = data.phone || data.number || data.input || '';
                if (!smsPhone) return '';
                let sms = `sms:${smsPhone}`;
                if (data.message) sms += `?body=${encodeURIComponent(data.message)}`;
                return sms;
                const image = document.getElementById('qr-image');

                if (placeholder) placeholder.style.display = 'none';

                if (this.currentQRData && image && image.style.display !== 'none') {
                    // If we already have a QR code, just dim it instead of showing spinner
                    // This prevents the "rolling" flickering effect
                    image.style.opacity = '0.5';
                } else {
                    // First time generation or after error
                    if (loading) loading.style.display = 'block';
                    if (image) image.style.display = 'none';
                }
        }

        hideQRLoading() {
            const loading = document.getElementById('qr-loading');
            const image = document.getElementById('qr-image');

            if (loading) loading.style.display = 'none';
            if (image) image.style.opacity = '1';
        }

        displayQR(result) {
            const image = document.getElementById('qr-image');
            const placeholder = document.getElementById('qr-placeholder');

            if (image && result.url) {
                image.src = result.url;
                image.style.display = 'block';
                image.alt = 'Generated QR Code';
            }

            if (placeholder) {
                placeholder.style.display = 'none';
            }
        }

        showQRError(message) {
            const placeholder = document.getElementById('qr-placeholder');
            if (placeholder) {
                placeholder.innerHTML = `
                <div class="text-center text-red-500">
                    <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p>${message}</p>
                </div>
            `;
                placeholder.style.display = 'block';
            }
        }

        enableDownload() {
            const downloadBtn = document.getElementById('download-btn');
            const copyLinkBtn = document.getElementById('copy-link-btn');

            if (downloadBtn) {
                downloadBtn.disabled = false;
            }
            if (copyLinkBtn) {
                copyLinkBtn.style.display = 'block';
            }
        }

    async downloadQR() {
            if (!this.currentQRData) return;

            const downloadBtn = document.getElementById('download-btn');
            const downloadText = document.getElementById('download-text');
            const downloadLoading = document.getElementById('download-loading');

            // Show loading state
            if (downloadText) downloadText.style.display = 'none';
            if (downloadLoading) downloadLoading.style.display = 'inline';
            if (downloadBtn) downloadBtn.disabled = true;

            try {
                // Create a temporary link to trigger download
                const link = document.createElement('a');
                link.href = this.currentQRData.url;
                link.download = this.currentQRData.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Show success feedback
                this.showToast('QR code downloaded successfully!', 'success');
            } catch (error) {
                console.error('Error downloading QR code:', error);
                this.showToast('Failed to download QR code', 'error');
            } finally {
                // Reset button state
                if (downloadText) downloadText.style.display = 'inline';
                if (downloadLoading) downloadLoading.style.display = 'none';
                if (downloadBtn) downloadBtn.disabled = false;
            }
        }

        copyDirectLink() {
            if (!this.currentQRData) return;

            const url = window.location.origin + '/' + this.currentQRData.url;

            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Direct link copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Failed to copy link', 'error');
            });
        }

        resetSettings() {
            // Reset all form inputs to defaults
            document.getElementById('size-slider').value = 200;
            document.getElementById('size-value').textContent = '200';
            document.getElementById('fg-color').value = '#000000';
            document.getElementById('bg-color').value = '#ffffff';
            document.getElementById('format-select').value = 'png';

            // ECC reset removed

            this.generateQR();
            this.showToast('Settings reset to defaults', 'info');
        }

        // Batch Processing Functions
        initBatch() {
            this.initFileUpload();
            this.initBatchSettings();
            this.initBatchProcessing();
        }

        initFileUpload() {
            const uploadZone = document.getElementById('upload-zone');
            const fileInput = document.getElementById('csv-file');
            const browseBtn = document.getElementById('browse-btn');

            if (browseBtn) {
                browseBtn.addEventListener('click', () => {
                    fileInput.click();
                });
            }

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    this.handleFileUpload(e.target.files[0]);
                });
            }

            if (uploadZone) {
                // Drag and drop functionality
                uploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadZone.classList.add('dragover');
                });

                uploadZone.addEventListener('dragleave', () => {
                    uploadZone.classList.remove('dragover');
                });

                uploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadZone.classList.remove('dragover');
                    this.handleFileUpload(e.dataTransfer.files[0]);
                });
            }

            // Sample data button
            const sampleBtn = document.getElementById('sample-data-btn');
            if (sampleBtn) {
                sampleBtn.addEventListener('click', () => {
                    this.generateSampleCSV();
                });
            }
        }

    async handleFileUpload(file) {
            if (!file || file.type !== 'text/csv') {
                this.showToast('Please upload a valid CSV file', 'error');
                return;
            }

            try {
                const text = await file.text();
                this.parseCSV(text);
            } catch (error) {
                console.error('Error reading file:', error);
                this.showToast('Error reading CSV file', 'error');
            }
        }

        parseCSV(csvText) {
            const lines = csvText.split('\n').filter(line => line.trim());
            this.batchData = [];

            lines.forEach((line, index) => {
                const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
                if (columns[0]) { // Ensure first column has data
                    this.batchData.push({
                        data: columns[0],
                        label: columns[1] || '',
                        index: index
                    });
                }
            });

            this.displayDataPreview();
            this.updateTotalRows();
        }

        displayDataPreview() {
            const previewContainer = document.getElementById('data-preview');
            if (!previewContainer || this.batchData.length === 0) return;

            const table = document.createElement('table');
            table.innerHTML = `
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Label</th>
                    <th>Preview</th>
                </tr>
            </thead>
            <tbody>
                ${this.batchData.slice(0, 10).map(item => `
                    <tr>
                        <td class="font-mono text-sm">${item.data.substring(0, 30)}${item.data.length > 30 ? '...' : ''}</td>
                        <td>${item.label || '-'}</td>
                        <td><span class="status-badge status-pending">Ready</span></td>
                    </tr>
                `).join('')}
                ${this.batchData.length > 10 ? `
                    <tr>
                        <td colspan="3" class="text-center text-gray-500 italic">... and ${this.batchData.length - 10} more rows</td>
                    </tr>
                ` : ''}
            </tbody>
        `;

            previewContainer.innerHTML = '';
            previewContainer.appendChild(table);

            // Show clear button
            const clearBtn = document.getElementById('clear-data-btn');
            if (clearBtn) clearBtn.style.display = 'block';
        }

        updateTotalRows() {
            const totalRows = document.getElementById('total-rows');
            if (totalRows) {
                totalRows.textContent = this.batchData.length;
            }

            // Enable/disable process button
            const processBtn = document.getElementById('process-btn');
            if (processBtn) {
                processBtn.disabled = this.batchData.length === 0;
            }
        }

        generateSampleCSV() {
            const sampleData = [
                ['https://example.com/landing', 'Landing Page'],
                ['https://example.com/contact', 'Contact Us'],
                ['https://example.com/products', 'Products'],
                ['https://example.com/about', 'About Us'],
                ['https://example.com/blog', 'Blog'],
                ['https://example.com/support', 'Support'],
                ['https://example.com/pricing', 'Pricing'],
                ['https://example.com/demo', 'Demo Request'],
                ['https://example.com/newsletter', 'Newsletter'],
                ['https://example.com/careers', 'Careers']
            ];

            const csvContent = sampleData.map(row => `"${row[0]}","${row[1]}"`).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'sample_qr_data.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

            this.showToast('Sample CSV downloaded', 'success');
        }

        initBatchSettings() {
            // Settings change handlers will be added as needed
            const clearBtn = document.getElementById('clear-data-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.clearBatchData();
                });
            }
        }

        clearBatchData() {
            this.batchData = [];
            const previewContainer = document.getElementById('data-preview');
            if (previewContainer) {
                previewContainer.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>Upload a CSV file to preview your data</p>
                </div>
            `;
            }
            this.updateTotalRows();

            const clearBtn = document.getElementById('clear-data-btn');
            if (clearBtn) clearBtn.style.display = 'none';

            this.showToast('Data cleared', 'info');
        }

        initBatchProcessing() {
            const processBtn = document.getElementById('process-btn');
            if (processBtn) {
                processBtn.addEventListener('click', () => {
                    this.startBatchProcessing();
                });
            }
        }

    async startBatchProcessing() {
            if (this.batchData.length === 0) {
                this.showToast('No data to process', 'error');
                return;
            }

            const processBtn = document.getElementById('process-btn');
            const processText = document.getElementById('process-text');
            const processLoading = document.getElementById('process-loading');
            const progressFill = document.getElementById('progress-fill');
            const progressPercentage = document.getElementById('progress-percentage');
            const progressStatus = document.getElementById('progress-status');

            // Show loading state
            if (processText) processText.style.display = 'none';
            if (processLoading) processLoading.style.display = 'inline';
            if (processBtn) processBtn.disabled = true;

            try {
                // Get batch settings
                const size = parseInt(document.getElementById('batch-size')?.value || 200);
                const format = document.getElementById('batch-format')?.value || 'png';
                const ecc = 'H'; // Hardcoded to High
                const namingPattern = document.getElementById('naming-pattern')?.value || 'index';

                const zip = new JSZip();
                const results = [];
                let errors = 0;
                let completed = 0;
                const total = this.batchData.length;

                // Map ECC
                const eccMap = {
                    'L': QRCode.CorrectLevel.L,
                    'M': QRCode.CorrectLevel.M,
                    'Q': QRCode.CorrectLevel.Q,
                    'H': QRCode.CorrectLevel.H
                };

                // Process items
                for (let i = 0; i < total; i++) {
                    const item = this.batchData[i];

                    // Update progress
                    const percent = Math.round(((i) / total) * 100);
                    if (progressFill) progressFill.style.width = `${percent}%`;
                    if (progressPercentage) progressPercentage.textContent = `${percent}%`;
                    if (progressStatus) progressStatus.textContent = `Processing ${i + 1} of ${total}...`;

                    // Generate filename
                    let filename = `qr_${String(i + 1).padStart(3, '0')}`;
                    if (namingPattern === 'label' && item.label) {
                        filename = item.label.replace(/[^a-z0-9]/gi, '_');
                    } else if (namingPattern === 'content') {
                        filename = item.data.substring(0, 20).replace(/[^a-z0-9]/gi, '_');
                    }
                    filename += `.${format}`;

                    try {
                        // Generate QR
                        const container = document.createElement('div');
                        new QRCode(container, {
                            text: item.data,
                            width: size,
                            height: size,
                            colorDark: "#000000",
                            colorLight: "#ffffff",
                            correctLevel: eccMap[ecc] || QRCode.CorrectLevel.M
                        });

                        const canvas = container.querySelector('canvas');
                        const img = container.querySelector('img');
                        let dataUrl = '';

                        if (canvas) {
                            dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg');
                        } else if (img) {
                            dataUrl = img.src;
                        }

                        if (!dataUrl) throw new Error('Generation failed');

                        // Add to zip (remove header)
                        const base64Data = dataUrl.split(',')[1];
                        zip.file(filename, base64Data, { base64: true });

                        results.push({
                            success: true,
                            data: item.data,
                            filename: filename,
                            url: dataUrl // Use data URL for display
                        });
                        completed++;

                    } catch (err) {
                        console.error('Error generating item:', err);
                        errors++;
                    }

                    // Small delay to allow UI update
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                // Generate zip
                if (progressStatus) progressStatus.textContent = 'Creating ZIP archive...';
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(zipBlob);

                // Finalize
                if (progressFill) progressFill.style.width = '100%';
                if (progressPercentage) progressPercentage.textContent = '100%';
                if (progressStatus) progressStatus.textContent = 'Completed';

                const result = {
                    success: true,
                    completed: completed,
                    errors: errors,
                    results: results,
                    zip_archive: {
                        success: true,
                        url: zipUrl
                    }
                };

                this.displayBatchResults(result);
                this.showToast(`Batch processing complete: ${completed} successful, ${errors} errors`, 'success');

            } catch (error) {
                console.error('Error in batch processing:', error);
                this.showToast('Error during batch processing', 'error');
            } finally {
                // Reset button state
                if (processText) processText.style.display = 'inline';
                if (processLoading) processLoading.style.display = 'none';
                if (processBtn) processBtn.disabled = false;
            }
        }

        displayBatchResults(result) {
            const resultsSection = document.getElementById('results-section');
            const resultsGrid = document.getElementById('results-grid');
            const completedCount = document.getElementById('completed-count');
            const errorCount = document.getElementById('error-count');

            if (completedCount) completedCount.textContent = result.completed;
            if (errorCount) errorCount.textContent = result.errors;

            if (resultsGrid && result.results) {
                resultsGrid.innerHTML = result.results.map(item => `
                <div class="qr-item">
                    <div class="text-center mb-3">
                        <img src="${item.url}" alt="QR Code" class="w-32 h-32 mx-auto">
                    </div>
                    <div class="text-sm">
                        <p class="font-medium text-gray-800 truncate">${item.data.substring(0, 30)}${item.data.length > 30 ? '...' : ''}</p>
                        <p class="text-gray-500 text-xs mt-1">${item.filename}</p>
                        <div class="mt-2">
                            <span class="status-badge status-completed">Completed</span>
                        </div>
                        <button class="mt-2 w-full py-1 px-2 bg-sage-500 text-white rounded text-xs hover:bg-sage-600 transition-colors" 
                                onclick="window.open('${item.url}', '_blank')">
                            Download
                        </button>
                    </div>
                </div>
            `).join('');
            }

            if (resultsSection) {
                resultsSection.style.display = 'block';

                // Animate results in
                anime({
                    targets: resultsSection,
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 600,
                    easing: 'easeOutQuad'
                });
            }

            // Show download all button if ZIP was created
            if (result.zip_archive && result.zip_archive.success) {
                const downloadAllBtn = document.getElementById('download-all-btn');
                if (downloadAllBtn) {
                    downloadAllBtn.style.display = 'block';
                    downloadAllBtn.addEventListener('click', () => {
                        window.open(result.zip_archive.url, '_blank');
                    });
                }
            }
        }

        // Customization Page Functions
        initCustomize() {
            this.initTemplateSelector();
            this.initColorPresets();
            this.initStyleOptions();
            this.initLogoUpload();
            this.initSliders();
            this.initExportOptions();
            this.initPresetManager();

            // Add listener for test data
            const testData = document.getElementById('test-data');
            if (testData) {
                testData.addEventListener('input', this.debounce(() => {
                    this.updateCustomPreview();
                }, 300));
            }

            // Generate initial preview
            this.updateCustomPreview();
        }

        initTemplateSelector() {
            const templates = document.querySelectorAll('.template-card');
            templates.forEach(template => {
                template.addEventListener('click', () => {
                    templates.forEach(t => t.classList.remove('active'));
                    template.classList.add('active');

                    this.customizationSettings.template = template.dataset.template;
                    this.applyTemplateSettings(template.dataset.template);
                    this.updateCustomPreview();
                });
            });
        }

        applyTemplateSettings(template) {
            const templates = {
                classic: {
                    fgColor: '#000000',
                    bgColor: '#ffffff',
                    dotStyle: 'square',
                    cornerStyle: 'square'
                },
                modern: {
                    fgColor: '#7c9885',
                    bgColor: '#f8f6f0',
                    dotStyle: 'rounded',
                    cornerStyle: 'circle'
                },
                elegant: {
                    fgColor: '#4a4a4a',
                    bgColor: '#f8f6f0',
                    dotStyle: 'circle',
                    cornerStyle: 'square'
                },
                vibrant: {
                    fgColor: '#d4a574',
                    bgColor: '#ffffff',
                    dotStyle: 'square',
                    cornerStyle: 'dot'
                }
            };

            const settings = templates[template] || templates.classic;

            // Apply settings to UI
            document.getElementById('custom-fg-color').value = settings.fgColor;
            document.getElementById('custom-bg-color').value = settings.bgColor;

            // Update style options
            const dotStyles = document.querySelectorAll('.style-option[data-type="dot"]');
            dotStyles.forEach(opt => {
                if (opt.dataset.value === settings.dotStyle) opt.click();
            });

            const cornerStyles = document.querySelectorAll('.style-option[data-type="corner"]');
            cornerStyles.forEach(opt => {
                if (opt.dataset.value === settings.cornerStyle) opt.click();
            });
        }

        initColorPresets() {
            const presets = document.querySelectorAll('.color-preset');
            presets.forEach(preset => {
                preset.addEventListener('click', () => {
                    const fg = preset.dataset.fg;
                    const bg = preset.dataset.bg;

                    document.getElementById('custom-fg-color').value = fg;
                    document.getElementById('custom-bg-color').value = bg;

                    this.updateCustomPreview();
                });
            });

            // Color picker listeners
            ['custom-fg-color', 'custom-bg-color'].forEach(id => {
                const picker = document.getElementById(id);
                if (picker) {
                    picker.addEventListener('input', () => this.updateCustomPreview());
                }
            });
        }

        initStyleOptions() {
            const options = document.querySelectorAll('.style-option');
            options.forEach(option => {
                option.addEventListener('click', () => {
                    const type = option.dataset.type;
                    const value = option.dataset.value;

                    // Update active state
                    document.querySelectorAll(`.style-option[data-type="${type}"]`).forEach(opt => {
                        opt.classList.remove('active');
                    });
                    option.classList.add('active');

                    // Update settings
                    if (type === 'dot') this.customizationSettings.dotStyle = value;
                    if (type === 'corner') this.customizationSettings.cornerStyle = value;

                    this.updateCustomPreview();
                });
            });
        }

        initLogoUpload() {
            const logoInput = document.getElementById('logo-upload');
            const removeLogoBtn = document.getElementById('remove-logo-btn');

            if (logoInput) {
                logoInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            this.customizationSettings.logo = e.target.result;
                            this.updateCustomPreview();
                            if (removeLogoBtn) removeLogoBtn.style.display = 'inline-block';
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            if (removeLogoBtn) {
                removeLogoBtn.addEventListener('click', () => {
                    this.customizationSettings.logo = null;
                    if (logoInput) logoInput.value = '';
                    removeLogoBtn.style.display = 'none';
                    this.updateCustomPreview();
                });
            }
        }

        initSliders() {
            const sizeSlider = document.getElementById('custom-size');
            const sizeValue = document.getElementById('custom-size-value');
            const marginSlider = document.getElementById('custom-margin');
            const marginValue = document.getElementById('custom-margin-value');

            if (sizeSlider) {
                sizeSlider.addEventListener('input', (e) => {
                    if (sizeValue) sizeValue.textContent = e.target.value;
                    this.customizationSettings.size = parseInt(e.target.value);
                    this.updateCustomPreview();
                });
            }

            if (marginSlider) {
                marginSlider.addEventListener('input', (e) => {
                    if (marginValue) marginValue.textContent = e.target.value;
                    this.customizationSettings.margin = parseInt(e.target.value);
                    this.updateCustomPreview();
                });
            }
        }

        initExportOptions() {
            const downloadBtn = document.getElementById('custom-download-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadCustomQR();
                });
            }
        }

        initPresetManager() {
            const saveBtn = document.getElementById('save-preset-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    // Implementation for saving presets would go here
                    this.showToast('Preset saved (simulated)', 'success');
                });
            }
        }

    async updateCustomPreview() {
            const previewContainer = document.getElementById('custom-preview-container');
            if (!previewContainer) return;

            // Get current settings
            const settings = {
                text: document.getElementById('test-data')?.value || 'https://example.com',
                width: this.customizationSettings.size,
                height: this.customizationSettings.size,
                colorDark: document.getElementById('custom-fg-color')?.value || '#000000',
                colorLight: document.getElementById('custom-bg-color')?.value || '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            };

            // Clear container
            previewContainer.innerHTML = '';

            // Generate QR
            const qrContainer = document.createElement('div');
            new QRCode(qrContainer, settings);

            // Wait for generation
            await new Promise(resolve => setTimeout(resolve, 50));

            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
                // Apply custom styles (rounded dots, etc) if needed
                // Note: qrcode.js doesn't natively support dot styles, so we'd need a more advanced library
                // or custom canvas manipulation here. For now, we stick to colors.

                // Add logo if present
                if (this.customizationSettings.logo) {
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.src = this.customizationSettings.logo;
                    await new Promise(resolve => img.onload = resolve);

                    const logoSize = settings.width * 0.2;
                    const x = (settings.width - logoSize) / 2;
                    const y = (settings.height - logoSize) / 2;

                    ctx.drawImage(img, x, y, logoSize, logoSize);
                }

                previewContainer.appendChild(canvas);
            }
        }

        downloadCustomQR() {
            const canvas = document.querySelector('#custom-preview-container canvas');
            if (canvas) {
                const format = document.getElementById('custom-format')?.value || 'png';
                const link = document.createElement('a');
                link.download = `custom-qr.${format}`;
                link.href = canvas.toDataURL(`image/${format}`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        // Utility Functions
        showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast toast-${type} fade-in`;
            toast.textContent = message;

            container.appendChild(toast);

            // Remove after 3 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => {
                    container.removeChild(toast);
                }, 300);
            }, 3000);
        }
    }

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QRForge();
});