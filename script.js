// Configuration
const GEMINI_API_KEY = 'AIzaSyBWz7mkRcaQH23Car5MWoHepbrpHVEo_wc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Alternative API endpoints to try
const ALTERNATIVE_ENDPOINTS = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
];

// Global variables
let currentFile = null;
let auditResults = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Atrax Smart Contract Auditor...');
    initializeTabs();
    initializeFileUpload();
    initializeDragAndDrop();
    console.log('Application initialized successfully');
});

// Tab functionality
function initializeTabs() {
    console.log('Initializing tabs...');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    console.log(`Found ${tabBtns.length} tab buttons and ${tabPanels.length} tab panels`);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            console.log(`Switching to tab: ${targetTab}`);
            
            // Remove active class from all tabs and panels
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            btn.classList.add('active');
            const targetPanel = document.getElementById(`${targetTab}-tab`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            } else {
                console.error(`Tab panel not found: ${targetTab}-tab`);
            }
        });
    });
    console.log('Tabs initialized successfully');
}

// File upload functionality
function initializeFileUpload() {
    console.log('Initializing file upload...');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    if (!fileInput) {
        console.error('File input element not found');
        return;
    }
    
    if (!uploadArea) {
        console.error('Upload area element not found');
        return;
    }

    fileInput.addEventListener('change', handleFileSelect);
    console.log('File input change listener added');

    uploadArea.addEventListener('click', () => {
        console.log('Upload area clicked');
        fileInput.click();
    });
    console.log('Upload area click listener added');
    console.log('File upload initialized successfully');
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect({ target: { files: files } });
        }
    });
}

// Handle file selection
function handleFileSelect(event) {
    console.log('File selected:', event.target.files);
    const file = event.target.files[0];
    if (file && file.name.endsWith('.sol')) {
        console.log('Valid .sol file selected:', file.name);
        currentFile = file;
        displayFileInfo(file);
    } else {
        console.log('Invalid file selected:', file ? file.name : 'no file');
        alert('Please select a valid .sol file');
    }
}

// Display file information
function displayFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    
    fileName.textContent = file.name;
    fileInfo.style.display = 'block';
}

// Remove file
function removeFile() {
    currentFile = null;
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// Fetch contract from URL
async function fetchFromUrl() {
    const urlInput = document.getElementById('urlInput');
    const urlStatus = document.getElementById('urlStatus');
    const url = urlInput.value.trim();

    if (!url) {
        showUrlStatus('Please enter a valid URL', 'error');
        return;
    }

    showUrlStatus('Fetching contract...', 'info');
    
    try {
        // For GitHub URLs, we'll need to handle raw content
        let fetchUrl = url;
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
            fetchUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch contract');
        }

        const content = await response.text();
        
        // Check if it looks like Solidity code
        if (content.includes('pragma solidity') || content.includes('contract ')) {
            // Store the content in the code input
            document.getElementById('codeInput').value = content;
            showUrlStatus('Contract fetched successfully!', 'success');
            
            // Switch to code tab
            document.querySelector('[data-tab="code"]').click();
        } else {
            throw new Error('The URL does not contain valid Solidity code');
        }
    } catch (error) {
        showUrlStatus(`Error: ${error.message}`, 'error');
    }
}

// Show URL status
function showUrlStatus(message, type) {
    const urlStatus = document.getElementById('urlStatus');
    urlStatus.textContent = message;
    urlStatus.className = `url-status ${type}`;
    urlStatus.style.display = 'block';
}

// Start audit process
async function startAudit() {
    console.log('Starting audit process...');
    const auditBtn = document.getElementById('auditBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    
    console.log('Elements found:', { auditBtn: !!auditBtn, loadingSection: !!loadingSection, resultsSection: !!resultsSection });
    
    // Get contract code
    let contractCode = '';
    
    if (currentFile) {
        console.log('Using uploaded file:', currentFile.name);
        contractCode = await readFileContent(currentFile);
    } else {
        const codeInput = document.getElementById('codeInput');
        if (codeInput) {
            const codeValue = codeInput.value.trim();
            console.log('Code input length:', codeValue.length);
            if (codeValue) {
                contractCode = codeValue;
            } else {
                alert('Please provide a contract to audit');
                return;
            }
        } else {
            console.error('Code input element not found');
            alert('Please provide a contract to audit');
            return;
        }
    }

    if (!contractCode) {
        alert('No contract code found');
        return;
    }

    // Show loading section
    auditBtn.disabled = true;
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';

    try {
        // Get selected audit options
        const auditOptions = getAuditOptions();
        
        // Start audit with progress updates
        auditResults = await performAudit(contractCode, auditOptions);
        
        // Display results
        displayAuditResults(auditResults);
        
        // Hide loading and show results
        loadingSection.style.display = 'none';
        resultsSection.style.display = 'block';
        
    } catch (error) {
        console.error('Audit failed:', error);
        alert('Audit failed: ' + error.message);
        loadingSection.style.display = 'none';
    } finally {
        auditBtn.disabled = false;
    }
}

// Read file content
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

// Get selected audit options
function getAuditOptions() {
    const options = {};
    const checkboxes = document.querySelectorAll('.option-item input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        const optionName = checkbox.id.replace('Check', '');
        options[optionName] = checkbox.checked;
    });
    
    return options;
}

// Perform audit using Gemini API
async function performAudit(contractCode, options) {
    const progressFill = document.getElementById('progressFill');
    const loadingText = document.getElementById('loadingText');
    
    // Update progress
    updateProgress(10, 'Analyzing contract structure...');
    
    // Prepare audit prompt
    const auditPrompt = createAuditPrompt(contractCode, options);
    
    updateProgress(30, 'Sending request to AI auditor...');
    
    try {
        // Try multiple API endpoints
        let lastError = null;
        for (const endpoint of ALTERNATIVE_ENDPOINTS) {
        try {
            updateProgress(35, `Trying endpoint: ${endpoint.split('/').pop()}`);
            const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: auditPrompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error Response for ${endpoint}:`, errorText);
                lastError = new Error(`API request failed: ${response.status} - ${errorText}`);
                continue; // Try next endpoint
            }

            updateProgress(70, 'Processing audit results...');
            
            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                lastError = new Error('Invalid response from AI service');
                continue; // Try next endpoint
            }

            const auditText = data.candidates[0].content.parts[0].text;
            
            updateProgress(90, 'Formatting results...');
            
            // Parse the audit results
            const parsedResults = parseAuditResults(auditText);
            
            updateProgress(100, 'Audit complete!');
            
            return parsedResults;
            
        } catch (error) {
            console.error(`Error with endpoint ${endpoint}:`, error);
            lastError = error;
            continue; // Try next endpoint
        }
    }
    
    // If all endpoints failed, throw the last error
    throw lastError || new Error('All API endpoints failed');
    
    } catch (error) {
        console.error('Audit API error:', error);
        
        // Fallback to mock audit for testing
        if (error.message.includes('404') || error.message.includes('API request failed')) {
            console.log('Using fallback mock audit...');
            updateProgress(70, 'Using fallback analysis...');
            return generateMockAuditResults(contractCode, options);
        }
        
        throw new Error('Failed to perform audit: ' + error.message);
    }
}

// Create audit prompt
function createAuditPrompt(contractCode, options) {
    const enabledOptions = Object.entries(options)
        .filter(([key, value]) => value)
        .map(([key]) => key)
        .join(', ');

    return `You are a professional smart contract auditor. Please analyze the following Solidity contract and provide a comprehensive security audit report.

Contract Code:
\`\`\`solidity
${contractCode}
\`\`\`

Please focus on these audit aspects: ${enabledOptions}

Provide your analysis in the following JSON format:
{
  "summary": {
    "totalIssues": number,
    "critical": number,
    "high": number,
    "medium": number,
    "low": number,
    "overallScore": number
  },
  "categories": [
    {
      "name": "Security Vulnerabilities",
      "issues": [
        {
          "title": "Issue title",
          "severity": "critical|high|medium|low",
          "description": "Detailed description of the issue",
          "location": "File:line or function name",
          "recommendation": "How to fix this issue"
        }
      ]
    }
  ]
}

Please be thorough and identify real security issues, gas optimizations, best practices violations, and code quality problems. Rate severity based on potential impact:
- Critical: Can lead to loss of funds or complete contract compromise
- High: Significant security risk or major functionality issues
- Medium: Moderate security concern or optimization opportunity
- Low: Minor issues or style improvements

Focus on actual vulnerabilities and provide actionable recommendations.`;
}

// Update progress
function updateProgress(percentage, text) {
    const progressFill = document.getElementById('progressFill');
    const loadingText = document.getElementById('loadingText');
    
    progressFill.style.width = `${percentage}%`;
    loadingText.textContent = text;
}

// Generate mock audit results for testing
function generateMockAuditResults(contractCode, options) {
    updateProgress(90, 'Generating mock audit results...');
    
    // Analyze the contract code for common patterns
    const issues = [];
    
    // Check for common vulnerabilities
    if (contractCode.includes('call{value:')) {
        issues.push({
            title: "Potential Reentrancy Vulnerability",
            severity: "critical",
            description: "The contract uses low-level call with value transfer which can be vulnerable to reentrancy attacks.",
            location: "Function with call{value:}",
            recommendation: "Use the Checks-Effects-Interactions pattern and consider using ReentrancyGuard."
        });
    }
    
    if (contractCode.includes('block.timestamp')) {
        issues.push({
            title: "Timestamp Dependency",
            severity: "medium",
            description: "The contract relies on block.timestamp which can be manipulated by miners.",
            location: "Function using block.timestamp",
            recommendation: "Avoid using block.timestamp for critical logic or use block numbers instead."
        });
    }
    
    if (contractCode.includes('msg.sender') && !contractCode.includes('onlyOwner')) {
        issues.push({
            title: "Missing Access Control",
            severity: "high",
            description: "Functions may lack proper access control mechanisms.",
            location: "Functions without access modifiers",
            recommendation: "Implement proper access control using modifiers like onlyOwner or role-based access."
        });
    }
    
    if (contractCode.includes('pragma solidity ^0.8.0')) {
        issues.push({
            title: "Solidity Version",
            severity: "low",
            description: "Using Solidity 0.8.0+ which has built-in overflow protection.",
            location: "Pragma statement",
            recommendation: "Consider using the latest stable version for better security features."
        });
    }
    
    if (contractCode.includes('mapping') && !contractCode.includes('event')) {
        issues.push({
            title: "Missing Event Emissions",
            severity: "medium",
            description: "State changes should emit events for better transparency and off-chain monitoring.",
            location: "State-changing functions",
            recommendation: "Add appropriate event emissions for all state changes."
        });
    }
    
    if (contractCode.includes('require(') && contractCode.includes('string')) {
        issues.push({
            title: "Gas Optimization Opportunity",
            severity: "low",
            description: "Using string literals in require statements consumes more gas than custom errors.",
            location: "require() statements",
            recommendation: "Consider using custom errors instead of string messages for gas efficiency."
        });
    }
    
    // Calculate summary
    const summary = {
        totalIssues: issues.length,
        critical: issues.filter(i => i.severity === 'critical').length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
        overallScore: Math.max(0, 100 - (issues.length * 15))
    };
    
    updateProgress(100, 'Mock audit complete!');
    
    return {
        summary: summary,
        categories: [{
            name: 'Security Analysis (Mock)',
            issues: issues
        }]
    };
}

// Parse audit results
function parseAuditResults(auditText) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = auditText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // If no JSON found, create a structured response from the text
        return createStructuredResponse(auditText);
    } catch (error) {
        console.error('Failed to parse audit results:', error);
        return createStructuredResponse(auditText);
    }
}

// Create structured response from text
function createStructuredResponse(text) {
    // This is a fallback parser for when the AI doesn't return proper JSON
    const lines = text.split('\n');
    const issues = [];
    let currentIssue = null;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('Critical') || trimmed.includes('High') || trimmed.includes('Medium') || trimmed.includes('Low')) {
            if (currentIssue) {
                issues.push(currentIssue);
            }
            
            const severity = trimmed.includes('Critical') ? 'critical' : 
                           trimmed.includes('High') ? 'high' : 
                           trimmed.includes('Medium') ? 'medium' : 'low';
            
            currentIssue = {
                title: trimmed,
                severity: severity,
                description: '',
                location: 'Contract',
                recommendation: ''
            };
        } else if (currentIssue && trimmed) {
            if (!currentIssue.description) {
                currentIssue.description = trimmed;
            } else if (!currentIssue.recommendation) {
                currentIssue.recommendation = trimmed;
            }
        }
    }
    
    if (currentIssue) {
        issues.push(currentIssue);
    }
    
    return {
        summary: {
            totalIssues: issues.length,
            critical: issues.filter(i => i.severity === 'critical').length,
            high: issues.filter(i => i.severity === 'high').length,
            medium: issues.filter(i => i.severity === 'medium').length,
            low: issues.filter(i => i.severity === 'low').length,
            overallScore: Math.max(0, 100 - (issues.length * 10))
        },
        categories: [{
            name: 'Security Analysis',
            issues: issues
        }]
    };
}

// Display audit results
function displayAuditResults(results) {
    displayAuditSummary(results.summary);
    displayAuditDetails(results.categories);
}

// Display audit summary
function displayAuditSummary(summary) {
    const summaryContainer = document.getElementById('auditSummary');
    
    summaryContainer.innerHTML = `
        <h3>Audit Summary</h3>
        <div class="summary-grid">
            <div class="summary-item critical">
                <div class="icon"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="count">${summary.critical}</div>
                <div class="label">Critical Issues</div>
            </div>
            <div class="summary-item high">
                <div class="icon"><i class="fas fa-exclamation-circle"></i></div>
                <div class="count">${summary.high}</div>
                <div class="label">High Issues</div>
            </div>
            <div class="summary-item medium">
                <div class="icon"><i class="fas fa-exclamation"></i></div>
                <div class="count">${summary.medium}</div>
                <div class="label">Medium Issues</div>
            </div>
            <div class="summary-item low">
                <div class="icon"><i class="fas fa-info-circle"></i></div>
                <div class="count">${summary.low}</div>
                <div class="label">Low Issues</div>
            </div>
        </div>
        <div class="overall-score">
            <h4>Overall Security Score: ${summary.overallScore}/100</h4>
            <div class="score-bar">
                <div class="score-fill" style="width: ${summary.overallScore}%"></div>
            </div>
        </div>
    `;
}

// Display audit details
function displayAuditDetails(categories) {
    const detailsContainer = document.getElementById('auditDetails');
    
    detailsContainer.innerHTML = categories.map(category => `
        <div class="audit-category">
            <div class="category-header" onclick="toggleCategory(this)">
                <div class="category-title">
                    <i class="fas fa-folder"></i>
                    ${category.name}
                    <span class="category-count">${category.issues.length}</span>
                </div>
                <div class="category-toggle">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="category-content">
                ${category.issues.map(issue => `
                    <div class="issue-item ${issue.severity}">
                        <div class="issue-header">
                            <div class="issue-title">${issue.title}</div>
                            <div class="issue-severity ${issue.severity}">${issue.severity}</div>
                        </div>
                        <div class="issue-description">${issue.description}</div>
                        <div class="issue-location">${issue.location}</div>
                        <div class="issue-recommendation">
                            <div class="recommendation-title">Recommendation:</div>
                            <div class="recommendation-text">${issue.recommendation}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Toggle category visibility
function toggleCategory(header) {
    const content = header.nextElementSibling;
    const toggle = header.querySelector('.category-toggle');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        toggle.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        toggle.classList.add('expanded');
    }
}

// Download PDF report
async function downloadReport() {
    if (!auditResults) {
        alert('No audit results to download');
        return;
    }

    try {
        // Create PDF content
        const pdfContent = generatePDFContent(auditResults);
        
        // Try server-side PDF generation first, fallback to client-side
        try {
            await generateServerPDF(pdfContent);
        } catch (serverError) {
            console.log('Server PDF generation failed, using client-side fallback');
            await generateAndDownloadPDF(pdfContent);
        }
        
    } catch (error) {
        console.error('PDF generation failed:', error);
        alert('Failed to generate PDF: ' + error.message);
    }
}

// Generate PDF content
function generatePDFContent(results) {
    const timestamp = new Date().toLocaleString();
    const contractName = currentFile ? currentFile.name : 'Smart Contract';
    
    return {
        title: 'Smart Contract Security Audit Report',
        contractName: contractName,
        timestamp: timestamp,
        summary: results.summary,
        categories: results.categories,
        generatedBy: 'Atrax Smart Contract Auditor'
    };
}

// Generate server-side PDF
async function generateServerPDF(content) {
    const htmlContent = generateHTMLContent(content);
    const filename = `audit-report-${Date.now()}.pdf`;
    
    const response = await fetch('/generate-pdf', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            htmlContent: htmlContent,
            filename: filename
        })
    });
    
    if (!response.ok) {
        throw new Error('Server PDF generation failed');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Generate HTML content for PDF
function generateHTMLContent(content) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${content.title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
                .logo { font-size: 28px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
                .contract-info { background: #f8f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .summary { background: #f8f9ff; padding: 25px; border-radius: 10px; margin-bottom: 30px; }
                .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                .summary-item { text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .critical { border-left: 4px solid #dc3545; }
                .high { border-left: 4px solid #fd7e14; }
                .medium { border-left: 4px solid #ffc107; }
                .low { border-left: 4px solid #28a745; }
                .category { margin-bottom: 30px; page-break-inside: avoid; }
                .category-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 2px solid #e0e7ff; padding-bottom: 10px; }
                .issue { margin-bottom: 20px; padding: 20px; border-radius: 8px; page-break-inside: avoid; }
                .issue-title { font-weight: bold; margin-bottom: 10px; font-size: 16px; }
                .severity { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                .severity.critical { background: #dc3545; color: white; }
                .severity.high { background: #fd7e14; color: white; }
                .severity.medium { background: #ffc107; color: #333; }
                .severity.low { background: #28a745; color: white; }
                .issue-description { margin: 15px 0; }
                .issue-location { background: #e9ecef; padding: 8px 12px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 14px; margin: 10px 0; }
                .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin-top: 15px; }
                .recommendation-title { font-weight: bold; color: #0c5460; margin-bottom: 8px; }
                .overall-score { text-align: center; margin: 30px 0; }
                .score-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
                .score-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 10px; transition: width 0.3s ease; }
                .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e7ff; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🛡️ Atrax Smart Contract Auditor</div>
                <h1>${content.title}</h1>
                <div class="contract-info">
                    <p><strong>Contract:</strong> ${content.contractName}</p>
                    <p><strong>Generated:</strong> ${content.timestamp}</p>
                    <p><strong>Auditor:</strong> ${content.generatedBy}</p>
                </div>
            </div>
            
            <div class="summary">
                <h2>Executive Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item critical">
                        <div style="font-size: 32px; font-weight: bold; color: #dc3545;">${content.summary.critical}</div>
                        <div style="font-weight: 500;">Critical Issues</div>
                    </div>
                    <div class="summary-item high">
                        <div style="font-size: 32px; font-weight: bold; color: #fd7e14;">${content.summary.high}</div>
                        <div style="font-weight: 500;">High Issues</div>
                    </div>
                    <div class="summary-item medium">
                        <div style="font-size: 32px; font-weight: bold; color: #ffc107;">${content.summary.medium}</div>
                        <div style="font-weight: 500;">Medium Issues</div>
                    </div>
                    <div class="summary-item low">
                        <div style="font-size: 32px; font-weight: bold; color: #28a745;">${content.summary.low}</div>
                        <div style="font-weight: 500;">Low Issues</div>
                    </div>
                </div>
                <div class="overall-score">
                    <h3>Overall Security Score: ${content.summary.overallScore}/100</h3>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${content.summary.overallScore}%"></div>
                    </div>
                </div>
            </div>
            
            ${content.categories.map(category => `
                <div class="category">
                    <div class="category-title">${category.name}</div>
                    ${category.issues.map(issue => `
                        <div class="issue ${issue.severity}">
                            <div class="issue-title">${issue.title}</div>
                            <div style="margin-bottom: 15px;">
                                <span class="severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
                            </div>
                            <div class="issue-description">
                                <strong>Description:</strong> ${issue.description}
                            </div>
                            <div class="issue-location">
                                <strong>Location:</strong> ${issue.location}
                            </div>
                            <div class="recommendation">
                                <div class="recommendation-title">Recommendation:</div>
                                <div>${issue.recommendation}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            
            <div class="footer">
                <p>Report generated by ${content.generatedBy}</p>
                <p>This report is for informational purposes only and should not be considered as financial or legal advice.</p>
                <p>For professional smart contract auditing services, please contact Atrax Security.</p>
            </div>
        </body>
        </html>
    `;
}

// Generate and download PDF (client-side fallback)
async function generateAndDownloadPDF(content) {
    // For now, we'll create a simple HTML-based PDF
    // In a production environment, you'd use a proper PDF library like jsPDF or Puppeteer
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${content.title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { text-align: center; margin-bottom: 40px; }
                .logo { font-size: 24px; font-weight: bold; color: #667eea; }
                .summary { background: #f8f9ff; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
                .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                .summary-item { text-align: center; padding: 15px; background: white; border-radius: 8px; }
                .critical { border-left: 4px solid #dc3545; }
                .high { border-left: 4px solid #fd7e14; }
                .medium { border-left: 4px solid #ffc107; }
                .low { border-left: 4px solid #28a745; }
                .category { margin-bottom: 30px; }
                .category-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
                .issue { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
                .issue-title { font-weight: bold; margin-bottom: 10px; }
                .severity { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                .severity.critical { background: #dc3545; color: white; }
                .severity.high { background: #fd7e14; color: white; }
                .severity.medium { background: #ffc107; color: #333; }
                .severity.low { background: #28a745; color: white; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🛡️ Atrax Smart Contract Auditor</div>
                <h1>${content.title}</h1>
                <p><strong>Contract:</strong> ${content.contractName}</p>
                <p><strong>Generated:</strong> ${content.timestamp}</p>
            </div>
            
            <div class="summary">
                <h2>Executive Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item critical">
                        <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${content.summary.critical}</div>
                        <div>Critical Issues</div>
                    </div>
                    <div class="summary-item high">
                        <div style="font-size: 24px; font-weight: bold; color: #fd7e14;">${content.summary.high}</div>
                        <div>High Issues</div>
                    </div>
                    <div class="summary-item medium">
                        <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${content.summary.medium}</div>
                        <div>Medium Issues</div>
                    </div>
                    <div class="summary-item low">
                        <div style="font-size: 24px; font-weight: bold; color: #28a745;">${content.summary.low}</div>
                        <div>Low Issues</div>
                    </div>
                </div>
                <p><strong>Overall Security Score:</strong> ${content.summary.overallScore}/100</p>
            </div>
            
            ${content.categories.map(category => `
                <div class="category">
                    <div class="category-title">${category.name}</div>
                    ${category.issues.map(issue => `
                        <div class="issue ${issue.severity}">
                            <div class="issue-title">${issue.title}</div>
                            <div style="margin-bottom: 10px;">
                                <span class="severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
                            </div>
                            <p><strong>Description:</strong> ${issue.description}</p>
                            <p><strong>Location:</strong> ${issue.location}</p>
                            <p><strong>Recommendation:</strong> ${issue.recommendation}</p>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            
            <div style="margin-top: 50px; text-align: center; color: #666;">
                <p>Report generated by ${content.generatedBy}</p>
                <p>This report is for informational purposes only and should not be considered as financial or legal advice.</p>
            </div>
        </body>
        </html>
    `;
    
    // Create and download the HTML file (which can be converted to PDF by the browser)
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also provide instructions for PDF conversion
    alert('HTML report downloaded! To convert to PDF:\n1. Open the downloaded HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Select "Save as PDF" as the destination\n4. Click Save');
}
