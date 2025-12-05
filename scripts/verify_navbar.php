<?php
$files = [
    'index.html',
    'customize.html',
    'batch.html'
];

$errors = [];

foreach ($files as $file) {
    echo "Checking $file...\n";
    if (!file_exists($file)) {
        $errors[] = "File not found: $file";
        continue;
    }

    $content = file_get_contents($file);
    echo "Read " . strlen($content) . " bytes from $file\n";
    
    // Check for mobile menu button
    if (strpos($content, 'id="mobile-menu-btn"') === false) {
        $errors[] = "Mobile menu button missing in $file";
    }

    // Check for mobile menu container
    if (strpos($content, 'id="mobile-menu"') === false) {
        $errors[] = "Mobile menu container missing in $file";
    }

    // Check for hidden classes
    if (strpos($content, 'hidden md:hidden') === false) {
        $errors[] = "Mobile menu hidden classes missing in $file";
    }
}

// Check main.js for toggle logic
$jsFile = 'main.js';
echo "Checking $jsFile...\n";
if (file_exists($jsFile)) {
    $jsContent = file_get_contents($jsFile);
    echo "Read " . strlen($jsContent) . " bytes from $jsFile\n";

    if (strpos($jsContent, 'initMobileMenu') === false) {
        $errors[] = "initMobileMenu method missing in main.js";
    }
    if (strpos($jsContent, 'mobile-menu-btn') === false) {
        $errors[] = "mobile-menu-btn selection missing in main.js";
    }
} else {
    $errors[] = "main.js not found";
}

if (empty($errors)) {
    echo "Verification Successful: All files have the correct responsive navbar structure and logic.\n";
} else {
    echo "Verification Failed:\n";
    foreach ($errors as $error) {
        echo "- $error\n";
    }
}
?>
