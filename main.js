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
            default:
                return '';
        }
    }

    async generateQR() {
        const qrData = this.getQRData();
        if (!qrData) return;

        const settings = this.getQRSettings();
        const qrString = this.generateQRString(qrData.type, qrData.data);

        if (!qrString) return;

        this.showQRLoading();

        try {
            // Generate QR code client-side
            const qrContainer = document.createElement('div');
            qrContainer.style.position = 'absolute';
            qrContainer.style.left = '-9999px';
            qrContainer.style.top = '-9999px';
            document.body.appendChild(qrContainer);

            // Map ECC string to integer for qrcode.js
            const eccMap = {
                'L': QRCode.CorrectLevel.L,
                'M': QRCode.CorrectLevel.M,
                'Q': QRCode.CorrectLevel.Q,
                'H': QRCode.CorrectLevel.H
            };

            new QRCode(qrContainer, {
                text: qrString,
                width: settings.size,
                height: settings.size,
                colorDark: settings.fg_color,
                colorLight: settings.bg_color,
                correctLevel: eccMap[settings.ecc] || QRCode.CorrectLevel.M
            });

            // Wait for generation
            await new Promise(resolve => setTimeout(resolve, 50));

            const canvas = qrContainer.querySelector('canvas');
            const img = qrContainer.querySelector('img');
            let dataUrl = '';

            if (canvas) {
                dataUrl = canvas.toDataURL(settings.format === 'png' ? 'image/png' : 'image/jpeg');
            } else if (img) {
                dataUrl = img.src;
            }

            // Cleanup
            document.body.removeChild(qrContainer);

            if (!dataUrl || dataUrl === 'data:,') throw new Error('Failed to generate QR code image');

            // Send to server for storage
            const requestData = {
                ...qrData,
                ...settings,
                image_data: dataUrl
            };

            const response = await fetch('generate.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (result.success) {
                // Use the client-generated URL for immediate display
                if (!result.url) result.url = dataUrl;

                this.displayQR(result);
                this.currentQRData = result;
                this.enableDownload();

                console.log('QR code saved to database with ID:', result.id);
            } else {
                this.showQRError(result.error || 'Failed to save QR code');
            }
        } catch (error) {
            console.error('Error generating QR code:', error);
            this.showQRError('Generation error occurred');
        } finally {
            this.hideQRLoading();
        }
    }

    showQRLoading() {
        const placeholder = document.getElementById('qr-placeholder');
        const loading = document.getElementById('qr-loading');
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
        document.querySelectorAll('[data-style]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === settings.dotStyle);
        });

        document.querySelectorAll('[data-corner]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.corner === settings.cornerStyle);
        });

        // Update settings object
        this.customizationSettings = {
            ...this.customizationSettings,
            ...settings
        };
    }

    initColorPresets() {
        const presetColors = document.querySelectorAll('.preset-color');
        presetColors.forEach(preset => {
            preset.addEventListener('click', () => {
                const fgColor = preset.dataset.fg;
                const bgColor = preset.dataset.bg;

                document.getElementById('custom-fg-color').value = fgColor;
                document.getElementById('custom-bg-color').value = bgColor;

                this.customizationSettings.fgColor = fgColor;
                this.customizationSettings.bgColor = bgColor;

                this.updateCustomPreview();
            });
        });

        // Color picker change handlers
        document.getElementById('custom-fg-color').addEventListener('change', (e) => {
            this.customizationSettings.fgColor = e.target.value;
            this.updateCustomPreview();
        });

        document.getElementById('custom-bg-color').addEventListener('change', (e) => {
            this.customizationSettings.bgColor = e.target.value;
            this.updateCustomPreview();
        });
    }

    initStyleOptions() {
        document.querySelectorAll('[data-style]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-style]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.customizationSettings.dotStyle = btn.dataset.style;
                this.updateCustomPreview();
            });
        });

        document.querySelectorAll('[data-corner]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-corner]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.customizationSettings.cornerStyle = btn.dataset.corner;
                this.updateCustomPreview();
            });
        });
    }

    initLogoUpload() {
        const logoUpload = document.getElementById('logo-upload');
        const logoFile = document.getElementById('logo-file');
        const uploadBtn = document.getElementById('upload-logo-btn');

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                logoFile.click();
            });
        }

        if (logoFile) {
            logoFile.addEventListener('change', (e) => {
                this.handleLogoUpload(e.target.files[0]);
            });
        }

        // Logo controls
        const logoSize = document.getElementById('logo-size');
        const logoOpacity = document.getElementById('logo-opacity');
        const removeLogoBtn = document.getElementById('remove-logo-btn');

        if (logoSize) {
            logoSize.addEventListener('input', (e) => {
                document.getElementById('logo-size-display').textContent = e.target.value + '%';
                this.updateCustomPreview();
            });
        }

        if (logoOpacity) {
            logoOpacity.addEventListener('input', (e) => {
                document.getElementById('logo-opacity-display').textContent = e.target.value + '%';
                this.updateCustomPreview();
            });
        }

        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', () => {
                this.removeLogo();
            });
        }
    }

    handleLogoUpload(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showToast('Please upload a valid image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.customizationSettings.logo = e.target.result;
            this.showLogoControls();
            this.updateCustomPreview();
            this.showToast('Logo uploaded successfully', 'success');
        };
        reader.readAsDataURL(file);
    }

    showLogoControls() {
        const logoControls = document.getElementById('logo-controls');
        const logoUpload = document.getElementById('logo-upload');

        if (logoControls) logoControls.style.display = 'block';
        if (logoUpload) logoUpload.classList.add('has-logo');
    }

    removeLogo() {
        this.customizationSettings.logo = null;

        const logoControls = document.getElementById('logo-controls');
        const logoUpload = document.getElementById('logo-upload');
        const logoFile = document.getElementById('logo-file');

        if (logoControls) logoControls.style.display = 'none';
        if (logoUpload) logoUpload.classList.remove('has-logo');
        if (logoFile) logoFile.value = '';

        this.updateCustomPreview();
        this.showToast('Logo removed', 'info');
    }

    initSliders() {
        const sizeSlider = document.getElementById('custom-size');
        const marginSlider = document.getElementById('custom-margin');

        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                document.getElementById('size-display').textContent = e.target.value + 'px';
                this.customizationSettings.size = parseInt(e.target.value);
                this.updateCustomPreview();
            });
        }

        if (marginSlider) {
            marginSlider.addEventListener('input', (e) => {
                document.getElementById('margin-display').textContent = e.target.value + 'px';
                this.customizationSettings.margin = parseInt(e.target.value);
                this.updateCustomPreview();
            });
        }
    }

    initExportOptions() {
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportCustomQR();
            });
        }

        // Size presets
        document.querySelectorAll('.size-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.dataset.size;
                document.getElementById('custom-size').value = size;
                document.getElementById('size-display').textContent = size + 'px';
                this.customizationSettings.size = parseInt(size);
                this.updateCustomPreview();
            });
        });
    }

    initPresetManager() {
        const savePresetBtn = document.getElementById('save-preset-btn');
        if (savePresetBtn) {
            savePresetBtn.addEventListener('click', () => {
                this.saveCurrentPreset();
            });
        }

        // Preset items
        document.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadPreset(item);
            });
        });
    }

    updateCustomPreview() {
        const testData = document.getElementById('test-data')?.value || 'https://qrforge.example.com';
        const previewContainer = document.getElementById('custom-qr-preview');

        if (!previewContainer) return;

        // Create QR code data
        const typeNumber = 0; // Auto detection
        const errorCorrectionLevel = this.customizationSettings.ecc || 'M';
        const qr = qrcode(typeNumber, errorCorrectionLevel);
        qr.addData(testData);
        qr.make();

        const moduleCount = qr.getModuleCount();
        const size = this.customizationSettings.size || 200;
        const margin = this.customizationSettings.margin || 4;

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions
        // We want the QR code to fit within the size, including margin
        // But for high quality, we might want to render larger and scale down via CSS
        // For now, let's render at requested size
        canvas.width = size;
        canvas.height = size;

        const cellSize = (size - (margin * 2)) / moduleCount;

        // Fill background
        ctx.fillStyle = this.customizationSettings.bgColor;
        ctx.fillRect(0, 0, size, size);

        // Draw modules
        ctx.fillStyle = this.customizationSettings.fgColor;

        const dotStyle = this.customizationSettings.dotStyle;
        const cornerStyle = this.customizationSettings.cornerStyle;

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = margin + col * cellSize;
                    const y = margin + row * cellSize;

                    // Check if this module is part of a position detection pattern (corners)
                    const isCorner = (row < 7 && col < 7) ||
                        (row < 7 && col >= moduleCount - 7) ||
                        (row >= moduleCount - 7 && col < 7);

                    if (isCorner) {
                        this.drawCornerModule(ctx, x, y, cellSize, cornerStyle, row, col, moduleCount);
                    } else {
                        this.drawDotModule(ctx, x, y, cellSize, dotStyle);
                    }
                }
            }
        }

        // Draw Logo if exists
        if (this.customizationSettings.logo) {
            const img = new Image();
            img.onload = () => {
                const logoSizePercent = parseInt(document.getElementById('logo-size')?.value || 20) / 100;
                const logoSize = size * logoSizePercent;
                const logoX = (size - logoSize) / 2;
                const logoY = (size - logoSize) / 2;

                // Draw white background for logo
                ctx.fillStyle = this.customizationSettings.bgColor;
                // Optional: make logo background rounded or match style
                ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);

                ctx.globalAlpha = parseInt(document.getElementById('logo-opacity')?.value || 100) / 100;
                ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
                ctx.globalAlpha = 1.0;

                // Update preview with canvas
                previewContainer.innerHTML = '';
                previewContainer.appendChild(canvas);
                canvas.style.maxWidth = '100%';
                canvas.style.height = 'auto';
            };
            img.src = this.customizationSettings.logo;
        } else {
            // Update preview with canvas immediately
            previewContainer.innerHTML = '';
            previewContainer.appendChild(canvas);
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
        }
    }

    drawDotModule(ctx, x, y, size, style) {
        switch (style) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'rounded':
                ctx.beginPath();
                const r = size * 0.25;
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + size - r, y);
                ctx.quadraticCurveTo(x + size, y, x + size, y + r);
                ctx.lineTo(x + size, y + size - r);
                ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
                ctx.lineTo(x + r, y + size);
                ctx.quadraticCurveTo(x, y + size, x, y + size - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.fill();
                break;
            case 'square':
            default:
                ctx.fillRect(x, y, size, size);
                break;
        }
    }

    drawCornerModule(ctx, x, y, size, style, row, col, count) {
        // For simplicity, we'll treat corner modules similar to dots but maybe force square if 'square'
        // or support specific corner shapes.
        // A full implementation would detect the 7x7 zones and draw custom shapes.
        // For now, let's map cornerStyle to the module shape in the corner zones.

        if (style === 'dot') {
            this.drawDotModule(ctx, x, y, size, 'circle');
        } else if (style === 'circle') {
            // For 'circle' corners, we might want the outer ring to be smooth.
            // But drawing module by module, 'rounded' or 'circle' is best approximation without complex path merging.
            this.drawDotModule(ctx, x, y, size, 'rounded');
        } else {
            ctx.fillRect(x, y, size, size);
        }
    }

    saveCurrentPreset() {
        const presetName = prompt('Enter a name for this preset:');
        if (presetName) {
            const presets = JSON.parse(localStorage.getItem('qr_presets') || '{}');
            presets[presetName] = this.customizationSettings;
            localStorage.setItem('qr_presets', JSON.stringify(presets));
            this.showToast(`Preset "${presetName}" saved successfully`, 'success');
            // Ideally we would update the UI list here
        }
    }

    loadPreset(presetItem) {
        // This is a placeholder for the UI interaction
        // In a full implementation, we'd read from the clicked item's data
        // For now, let's just show how to load from storage if we had a name
        // const presets = JSON.parse(localStorage.getItem('qr_presets') || '{}');
        // const settings = presets[presetName];
        // if (settings) { ... }

        // Since the UI is static in the HTML, we'll just simulate loading "Brand Style" etc.
        // based on the text content or index
        const name = presetItem.querySelector('.font-medium').textContent;

        if (name === 'Brand Style') {
            this.customizationSettings = {
                ...this.customizationSettings,
                fgColor: '#7c9885',
                bgColor: '#ffffff',
                dotStyle: 'square',
                cornerStyle: 'square'
            };
        } else if (name === 'Minimalist') {
            this.customizationSettings = {
                ...this.customizationSettings,
                fgColor: '#000000',
                bgColor: '#ffffff',
                dotStyle: 'square',
                cornerStyle: 'square'
            };
        } else if (name === 'Creative') {
            this.customizationSettings = {
                ...this.customizationSettings,
                fgColor: '#d4a574',
                bgColor: '#ffffff',
                dotStyle: 'circle',
                cornerStyle: 'dot'
            };
        }

        // Update UI to match
        document.getElementById('custom-fg-color').value = this.customizationSettings.fgColor;
        document.getElementById('custom-bg-color').value = this.customizationSettings.bgColor;

        this.updateCustomPreview();
        this.showToast(`Preset "${name}" loaded`, 'success');
    }

    async exportCustomQR() {
        const previewContainer = document.getElementById('custom-qr-preview');
        const canvas = previewContainer.querySelector('canvas');

        if (!canvas) {
            this.showToast('No QR code to export', 'error');
            return;
        }

        const format = document.getElementById('export-format')?.value || 'png';
        const quality = document.getElementById('export-quality')?.value || 'normal';

        // Handle resolution scaling based on quality
        // For now, we just export the current canvas

        const link = document.createElement('a');
        link.download = `custom-qr.${format}`;

        if (format === 'png') {
            link.href = canvas.toDataURL('image/png');
        } else if (format === 'jpeg') {
            link.href = canvas.toDataURL('image/jpeg', 0.9);
        } else {
            // SVG not supported by canvas toDataURL directly without library
            // Fallback to PNG
            link.href = canvas.toDataURL('image/png');
            link.download = `custom-qr.png`;
            this.showToast('SVG export requires additional libraries, downloading as PNG', 'warning');
        }

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showToast('QR code exported successfully!', 'success');
    }

    // Utility Functions
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

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform translate-x-full transition-transform duration-300`;

        // Set color based on type
        switch (type) {
            case 'success':
                toast.classList.add('bg-green-500');
                break;
            case 'error':
                toast.classList.add('bg-red-500');
                break;
            case 'warning':
                toast.classList.add('bg-yellow-500');
                break;
            default:
                toast.classList.add('bg-blue-500');
        }

        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Animate out and remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QRForge();
});

// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations when page is not visible
        anime.running.forEach(animation => animation.pause());
    } else {
        // Resume animations when page becomes visible
        anime.running.forEach(animation => animation.play());
    }
});

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Service worker registration for offline support (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker implementation would go here
        console.log('QRForge: Ready for offline capabilities');
    });
}