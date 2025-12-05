# QRForge - Advanced QR Code Generator

A sophisticated, feature-rich QR code generation web application built with modern web technologies and PHP.

## Features

### 🎯 Core Generator
- **Real-time QR Code Generation** - See QR codes update instantly as you type
- **Multiple Data Types** - Support for URLs, text, email, phone, WiFi, SMS
- **Live Preview** - Dynamic preview with size and color adjustments
- **Error Correction Levels** - L (7%), M (15%), Q (25%), H (30%)
- **Color Customization** - Full control over foreground and background colors
- **Multiple Export Formats** - PNG, SVG, JPEG support

### 📊 Batch Processing
- **CSV Upload** - Drag-and-drop or browse for CSV files
- **Bulk Generation** - Generate hundreds of QR codes simultaneously
- **Progress Tracking** - Real-time progress with ETA estimation
- **Individual Downloads** - Download each QR code separately
- **ZIP Archive** - Bulk download all generated QR codes
- **Flexible Naming** - Customizable file naming patterns

### 🎨 Customization Studio
- **Template Gallery** - Pre-designed QR code styles
- **Advanced Styling** - Dot styles, corner variations, size controls
- **Logo Integration** - Upload and position logos within QR codes
- **Color Schemes** - Preset color palettes and custom colors
- **Export Options** - Multiple formats, quality settings, and sizes
- **Style Presets** - Save and load custom style configurations

### 🎭 Design Features
- **Modern UI** - Clean, professional interface with glass morphism effects
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Smooth Animations** - Powered by Anime.js for delightful interactions
- **Visual Feedback** - Loading states, progress indicators, and notifications
- **Accessibility** - Keyboard navigation and screen reader support

## Technology Stack

### Frontend
- **HTML5** - Semantic markup with modern features
- **Tailwind CSS** - Utility-first CSS framework
- **JavaScript ES6+** - Modern JavaScript with classes and modules
- **Anime.js** - Smooth animations and micro-interactions
- **Splitting.js** - Text animation effects

### Backend
- **PHP 7.4+** - Server-side QR code generation
- **phpqrcode** - Open-source QR code generation library
- **GD Library** - Image processing and manipulation
- **JSON API** - RESTful communication between frontend and backend

### Libraries & Dependencies
- **phpqrcode** - QR code generation (LGPL licensed)
- **Anime.js** - Animation library
- **Tailwind CSS** - Styling framework
- **Google Fonts** - Typography (Inter, Playfair Display, JetBrains Mono)

## Installation

### Requirements
- PHP 7.4 or higher
- GD Library extension for PHP
- Web server (Apache, Nginx, or PHP built-in server)
- Modern web browser

### Quick Start
1. Download or clone the project files
2. Ensure the `cache` directory is writable:
   ```bash
   chmod 777 cache/
   chmod 777 cache/batch/
   ```
3. Start the PHP development server:
   ```bash
   php -S localhost:8000
   ```
4. Open your browser and navigate to `http://localhost:8000`

### Production Deployment
1. Upload files to your web server
2. Set appropriate permissions for the cache directory
3. Configure your web server to serve the application
4. Consider implementing rate limiting for API endpoints

## Usage

### Basic QR Code Generation
1. Navigate to the Generator page
2. Select your data type (URL, text, email, etc.)
3. Enter your content in the form fields
4. Customize size, colors, and error correction level
5. Click "Generate & Download" to save your QR code

### Batch Processing
1. Navigate to the Batch Process page
2. Upload a CSV file with your data
3. Configure batch settings (size, format, naming)
4. Click "Start Batch Processing"
5. Download individual QR codes or the complete ZIP archive

### Customization
1. Navigate to the Customize page
2. Choose a template or start from scratch
3. Adjust colors, styles, and logo positioning
4. Preview your design in real-time
5. Export in your preferred format and quality

## CSV Format for Batch Processing

Your CSV file should contain:
- **First column**: The data to encode (URL, text, etc.)
- **Second column** (optional): Label for naming files
- **No header row** required

Example:
```csv
"https://example.com/page1","Product 1"
"https://example.com/page2","Product 2"
"Contact information here","Business Card"
```

## API Endpoints

### Generate Single QR Code
- **URL**: `/generate.php`
- **Method**: POST
- **Content-Type**: application/json
- **Body**: `{ "type": "url", "data": { "url": "https://example.com" }, "size": 200, "ecc": "M", "fg_color": "#000000", "bg_color": "#ffffff" }`

### Batch Processing
- **URL**: `/batch_process.php`
- **Method**: POST
- **Content-Type**: application/json
- **Body**: `{ "data": [{"data": "content1"}, {"data": "content2"}], "size": 200, "format": "png" }`

## Browser Compatibility

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## Performance Considerations

- **Batch Processing**: Large batches (>1000 items) may take significant time
- **Memory Usage**: Each QR code generation uses memory; monitor for large batches
- **File Storage**: Generated QR codes are stored temporarily in the cache directory
- **Image Sizes**: Larger QR codes consume more memory and processing time

## Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **File Type Restrictions**: Only CSV files accepted for batch processing
- **Path Traversal Protection**: File paths are sanitized and restricted
- **Content Type Headers**: Proper headers prevent XSS attacks
- **CORS Configuration**: Controlled cross-origin resource sharing

## Customization

### Styling
The application uses CSS custom properties for theming. Modify the `:root` variables in the HTML files to change colors:

```css
:root {
    --primary-dark: #1a1a1a;
    --primary-sage: #7c9885;
    --primary-cream: #f8f6f0;
    --accent-coral: #d4a574;
}
```

### Adding New Templates
Templates can be added by modifying the template selector in `customize.html` and updating the `applyTemplateSettings` method in `main.js`.

### Extending Data Types
New QR code data types can be added by:
1. Adding a new button to the data type selector
2. Creating a corresponding form in the HTML
3. Updating the `generateQRData` function in `generate.php`
4. Adding validation logic as needed

## Troubleshooting

### Common Issues

**QR codes not generating**
- Check PHP error logs for GD library issues
- Ensure cache directory has write permissions
- Verify that the phpqrcode library is properly included

**Batch processing fails**
- Check CSV file format and encoding
- Verify file upload limits in php.ini
- Monitor memory usage for large batches

**Styling issues**
- Clear browser cache and reload
- Check for CSS conflicts
- Verify all required fonts are loading

### Debug Mode
Enable PHP error reporting for debugging:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## License

This project is open source. The phpqrcode library used for QR code generation is licensed under LGPL. Please refer to individual library licenses for more details.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

## Support

For issues, feature requests, or questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

---

**QRForge** - Crafted with precision for modern developers.