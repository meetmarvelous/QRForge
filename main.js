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
        try {
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
        } catch (error) {
            console.error('Critical initialization error:', error);
            document.body.innerHTML = '<div style="padding: 20px; color: red;"><h1>Critical Error</h1><p>' + error.message + '</p><pre>' + error.stack + '</pre></div>';
            document.body.style.opacity = '1';
        }
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
        this.initFormatControl();
        this.initDownloadButton();

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

        // Add input event listeners for live preview with typing indicator
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea');
            const activeType = form.id.replace('-form', '');
            const typingIndicator = document.getElementById(activeType + '-typing');
            let typingTimeout;

            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    // Show typing indicator
                    if (typingIndicator) {
                        typingIndicator.classList.add('visible');
                    }
                    input.classList.add('typing');

                    // Clear previous timeout
                    clearTimeout(typingTimeout);

                    // Set new timeout for generation
                    typingTimeout = setTimeout(() => {
                        // Hide typing indicator
                        if (typingIndicator) {
                            typingIndicator.classList.remove('visible');
                        }
                        input.classList.remove('typing');
                        this.generateQR();
                    }, 1500);
                });
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

    initFormatControl() {
        const formatSelect = document.getElementById('format-select');
        if (formatSelect) {
            formatSelect.addEventListener('change', () => {
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

    async generateQR() {
        const data = this.getQRData();
        const settings = this.getQRSettings();

        if (!data) return;

        // Show loading state
        const loading = document.getElementById('qr-loading');
        const image = document.getElementById('qr-image');
        const placeholder = document.getElementById('qr-placeholder');

        if (loading) loading.style.display = 'block';
        if (image) image.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';

        try {
            // 1. Generate QR Data
            const typeNumber = 0;
            const errorCorrectionLevel = 'H';
            const qr = qrcode(typeNumber, errorCorrectionLevel);

            const qrString = this.generateQRString(data.type, data.data);
            if (!qrString) {
                // If no data, show placeholder
                if (loading) loading.style.display = 'none';
                if (placeholder) placeholder.style.display = 'block';
                return;
            }

            qr.addData(qrString);
            qr.make();

            // 2. Render Preview (Always PNG/Canvas)
            const moduleCount = qr.getModuleCount();
            const pixelSize = Math.max(2, Math.floor(settings.size / moduleCount));
            const margin = 4;
            const canvasSize = (moduleCount + 2 * margin) * pixelSize;

            const canvas = document.createElement('canvas');
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const ctx = canvas.getContext('2d');

            // Fill background
            ctx.fillStyle = settings.bg_color;
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            // Draw modules
            ctx.fillStyle = settings.fg_color;
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(
                            (col + margin) * pixelSize,
                            (row + margin) * pixelSize,
                            pixelSize,
                            pixelSize
                        );
                    }
                }
            }

            const previewDataUrl = canvas.toDataURL('image/png');

            // 3. Update Preview UI
            if (image) {
                image.src = previewDataUrl;
                image.style.display = 'block';
            }
            if (loading) loading.style.display = 'none';

            // 4. Prepare Download Data
            let downloadData = previewDataUrl;
            if (settings.format === 'svg') {
                const svgTag = qr.createSvgTag({
                    cellColor: (cell, row, col) => {
                        return cell ? settings.fg_color : settings.bg_color;
                    },
                    cellSize: pixelSize,
                    margin: margin,
                    scalable: true
                });
                // Convert SVG string to base64
                const svgBlob = new Blob([svgTag], { type: 'image/svg+xml;charset=utf-8' });
                const reader = new FileReader();
                downloadData = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(svgBlob);
                });
            } else if (settings.format === 'jpeg') {
                downloadData = canvas.toDataURL('image/jpeg');
            }

            // 5. Store Data for Download
            this.currentQRData = {
                url: downloadData,
                filename: `qr-code.${settings.format === 'jpeg' ? 'jpg' : settings.format}`
            };

            // Enable download button
            this.enableDownload();

        } catch (error) {
            console.error('Generation error:', error);
            this.showQRError(error.message || 'Failed to generate QR code');
            if (loading) loading.style.display = 'none';
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
                const email = data.input || data.address || data.email || '';
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
                const smsPhone = data.phone || data.input || '';
                const smsMsg = data.message || '';
                if (!smsPhone) return '';
                return `SMSTO:${smsPhone}:${smsMsg}`;
            default:
                return '';
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
            // improved CSV parsing for quoted fields
            const columns = [];
            let inQuotes = false;
            let currentValue = '';

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    columns.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            columns.push(currentValue.trim());

            if (columns[0]) { // Ensure first column has data
                this.batchData.push({
                    data: columns[0].replace(/^"|"$/g, ''), // Remove surrounding quotes
                    label: (columns[1] || '').replace(/^"|"$/g, ''),
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
                'L': 'L',
                'M': 'M',
                'Q': 'Q',
                'H': 'H'
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
                    // Generate QR using qrcode-generator
                    const typeNumber = 0;
                    const errorCorrectionLevel = eccMap[ecc] || 'H';
                    const qr = qrcode(typeNumber, errorCorrectionLevel);
                    qr.addData(item.data);
                    qr.make();

                    const moduleCount = qr.getModuleCount();
                    const pixelSize = Math.max(2, Math.floor(size / moduleCount));
                    const margin = 4;
                    const canvasSize = (moduleCount + 2 * margin) * pixelSize;

                    const canvas = document.createElement('canvas');
                    canvas.width = canvasSize;
                    canvas.height = canvasSize;
                    const ctx = canvas.getContext('2d');

                    // Fill background
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvasSize, canvasSize);

                    // Draw modules
                    ctx.fillStyle = "#000000";
                    for (let row = 0; row < moduleCount; row++) {
                        for (let col = 0; col < moduleCount; col++) {
                            if (qr.isDark(row, col)) {
                                ctx.fillRect(
                                    (col + margin) * pixelSize,
                                    (row + margin) * pixelSize,
                                    pixelSize,
                                    pixelSize
                                );
                            }
                        }
                    }

                    let dataUrl = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg');

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
                    console.error(`Error processing item ${i}:`, err);
                    errors++;
                    results.push({
                        success: false,
                        data: item.data,
                        error: err.message
                    });
                }

                // Small delay to prevent UI freezing
                if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Generate zip
            if (completed > 0) {
                const content = await zip.generateAsync({ type: "blob" });
                const url = window.URL.createObjectURL(content);

                const a = document.createElement('a');
                a.href = url;
                a.download = `qr_batch_${new Date().toISOString().slice(0, 10)}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                this.showToast(`Processed ${completed} QR codes (Errors: ${errors})`, 'success');

                // Final progress update
                if (progressFill) progressFill.style.width = '100%';
                if (progressPercentage) progressPercentage.textContent = '100%';
                if (progressStatus) progressStatus.textContent = 'Processing complete';
            } else {
                this.showToast(`Batch processing failed. Errors: ${errors}`, 'error');
            }

        } catch (err) {
            console.error(err);
            this.showToast('Batch processing error: ' + err.message, 'error');
        } finally {
            if (processLoading) processLoading.style.display = 'none';
            if (processText) processText.style.display = 'inline';
            if (processBtn) processBtn.disabled = false;
        }
    }

    // Customize Page Functions
    initCustomize() {
        this.initCustomizationControls();
        this.updateCustomPreview();
    }

    initCustomizationControls() {
        const inputs = [
            'test-data', 'custom-size', 'custom-margin',
            'custom-fg-color', 'custom-bg-color',
            'logo-size', 'logo-opacity'
        ];

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.updateCustomPreview());
                el.addEventListener('change', () => this.updateCustomPreview());
            }
        });

        // Bind export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.downloadCustomQR());
        }

        // Bind style options
        document.querySelectorAll('.style-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                const group = e.target.parentElement;
                group.querySelectorAll('.style-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
                this.updateCustomPreview();
            });
        });

        // Bind template cards
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.applyTemplate(e.currentTarget.dataset.template);
            });
        });

        // Bind color presets
        document.querySelectorAll('.preset-color').forEach(preset => {
            preset.addEventListener('click', (e) => {
                const fg = e.target.dataset.fg;
                const bg = e.target.dataset.bg;

                const fgInput = document.getElementById('custom-fg-color');
                const bgInput = document.getElementById('custom-bg-color');

                if (fgInput) fgInput.value = fg;
                if (bgInput) bgInput.value = bg;

                this.updateCustomPreview();
            });
        });

        // Bind logo upload
        const uploadBtn = document.getElementById('upload-logo-btn');
        const fileInput = document.getElementById('logo-file');
        const removeLogoBtn = document.getElementById('remove-logo-btn');

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.logoImage = new Image();
                        this.logoImage.onload = () => {
                            document.getElementById('logo-controls').style.display = 'block';
                            document.getElementById('logo-upload').style.display = 'none';
                            this.updateCustomPreview();
                        };
                        this.logoImage.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', () => {
                this.logoImage = null;
                document.getElementById('logo-controls').style.display = 'none';
                document.getElementById('logo-upload').style.display = 'block';
                if (fileInput) fileInput.value = '';
                this.updateCustomPreview();
            });
        }
    }

    applyTemplate(templateName) {
        const templates = {
            classic: { fg: '#000000', bg: '#ffffff', dot: 'square', corner: 'square' },
            modern: { fg: '#4F46E5', bg: '#ffffff', dot: 'rounded', corner: 'circle' },
            elegant: { fg: '#1F2937', bg: '#F3F4F6', dot: 'circle', corner: 'square' },
            vibrant: { fg: '#EC4899', bg: '#ffffff', dot: 'square', corner: 'dot' }
        };

        const template = templates[templateName];
        if (!template) return;

        // Apply colors
        const fgInput = document.getElementById('custom-fg-color');
        const bgInput = document.getElementById('custom-bg-color');
        if (fgInput) fgInput.value = template.fg;
        if (bgInput) bgInput.value = template.bg;

        // Apply styles
        document.querySelectorAll('.style-option').forEach(opt => opt.classList.remove('active'));

        const dotOpt = document.querySelector(`.style-option[data-style="${template.dot}"]`);
        if (dotOpt) dotOpt.classList.add('active');

        const cornerOpt = document.querySelector(`.style-option[data-corner="${template.corner}"]`);
        if (cornerOpt) cornerOpt.classList.add('active');

        this.updateCustomPreview();
    }

    async updateCustomPreview() {
        const previewContainer = document.getElementById('custom-qr-preview');
        if (!previewContainer) return;

        const text = document.getElementById('test-data')?.value || "https://example.com";
        const size = parseInt(document.getElementById('custom-size')?.value || 300);
        const margin = parseInt(document.getElementById('custom-margin')?.value || 4);
        const fgColor = document.getElementById('custom-fg-color')?.value || "#000000";
        const bgColor = document.getElementById('custom-bg-color')?.value || "#ffffff";

        // Update display values
        const sizeDisplay = document.getElementById('size-display');
        if (sizeDisplay) sizeDisplay.textContent = `${size}px`;

        const marginDisplay = document.getElementById('margin-display');
        if (marginDisplay) marginDisplay.textContent = `${margin}px`;

        previewContainer.innerHTML = '';

        try {
            // Generate QR using qrcode-generator
            const typeNumber = 0;
            const qr = qrcode(typeNumber, 'H');
            qr.addData(text);
            qr.make();

            const moduleCount = qr.getModuleCount();
            const pixelSize = Math.max(2, Math.floor(size / moduleCount));
            const canvasSize = (moduleCount + 2 * margin) * pixelSize;

            const canvas = document.createElement('canvas');
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const ctx = canvas.getContext('2d');

            // Fill background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvasSize, canvasSize);

            // Draw modules
            ctx.fillStyle = fgColor;

            // Get style settings
            const dotStyle = document.querySelector('.style-option[data-style].active')?.dataset.style || 'square';
            const cornerStyle = document.querySelector('.style-option[data-corner].active')?.dataset.corner || 'square';

            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        const x = (col + margin) * pixelSize;
                        const y = (row + margin) * pixelSize;

                        if (dotStyle === 'circle') {
                            ctx.beginPath();
                            ctx.arc(x + pixelSize / 2, y + pixelSize / 2, pixelSize / 2, 0, Math.PI * 2);
                            ctx.fill();
                        } else if (dotStyle === 'rounded') {
                            ctx.beginPath();
                            ctx.roundRect(x, y, pixelSize, pixelSize, pixelSize * 0.3);
                            ctx.fill();
                        } else {
                            ctx.fillRect(x, y, pixelSize, pixelSize);
                        }
                    }
                }
            }

            // Draw logo if exists
            if (this.logoImage) {
                const logoSizePercent = parseInt(document.getElementById('logo-size')?.value || 20) / 100;
                const logoOpacity = parseInt(document.getElementById('logo-opacity')?.value || 100) / 100;

                const logoW = canvasSize * logoSizePercent;
                const logoH = (this.logoImage.height / this.logoImage.width) * logoW;
                const logoX = (canvasSize - logoW) / 2;
                const logoY = (canvasSize - logoH) / 2;

                ctx.globalAlpha = logoOpacity;
                ctx.drawImage(this.logoImage, logoX, logoY, logoW, logoH);
                ctx.globalAlpha = 1.0;
            }

            previewContainer.appendChild(canvas);
        } catch (e) {
            console.error(e);
            previewContainer.innerHTML = '<div class="text-red-500 p-4">Error generating QR code: ' + e.message + '</div>';
        }
    }

    downloadCustomQR() {
        const canvas = document.querySelector('#custom-qr-preview canvas');
        if (canvas) {
            const format = document.getElementById('export-format')?.value || 'png';
            const link = document.createElement('a');
            link.download = `custom-qr.${format}`;

            if (format === 'jpeg') {
                link.href = canvas.toDataURL('image/jpeg');
            } else {
                link.href = canvas.toDataURL('image/png');
            }

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showToast('QR Code downloaded', 'success');
        } else {
            this.showToast('No QR Code to download', 'error');
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
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QRForge();
});