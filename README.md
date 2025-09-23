# Atrax Smart Contract Auditor

A professional web-based tool for analyzing and auditing smart contracts with AI-powered security analysis and comprehensive PDF report generation.

## Features

- **Multiple Input Methods**: Upload .sol files, paste code directly, or fetch from URLs
- **AI-Powered Analysis**: Uses Google's Gemini AI for comprehensive security analysis
- **Comprehensive Audit Categories**:
  - Security Vulnerabilities
  - Gas Optimization
  - Best Practices
  - Code Quality
  - Access Control
  - Reentrancy Protection
- **Professional PDF Reports**: Download detailed audit reports with professional styling
- **Real-time Progress**: Visual progress tracking during analysis
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (optional, for local development server)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser, or
3. For development, run:
   ```bash
   npm install
   npm start
   ```

### Usage

1. **Upload Contract**: Choose one of three methods:
   - **File Upload**: Drag and drop or browse for .sol files
   - **Code Input**: Paste your Solidity code directly
   - **URL Input**: Enter a GitHub or other URL to fetch contract code

2. **Configure Audit**: Select which audit aspects to analyze:
   - Security Vulnerabilities
   - Gas Optimization
   - Best Practices
   - Code Quality
   - Access Control
   - Reentrancy Protection

3. **Start Analysis**: Click "Start Audit" to begin the AI-powered analysis

4. **Review Results**: View the comprehensive audit results with:
   - Executive summary with security score
   - Detailed issue breakdown by severity
   - Specific recommendations for each issue

5. **Download Report**: Generate and download a professional PDF report

## API Configuration

The application uses Google's Gemini AI API for contract analysis. The API key is configured in `script.js`:

```javascript
const GEMINI_API_KEY = 'AIzaSyBWz7mkRcaQH23Car5MWoHepbrpHVEo_wc';
```

## Audit Categories

### Security Vulnerabilities
- Reentrancy attacks
- Integer overflow/underflow
- Access control issues
- Front-running vulnerabilities
- Denial of service attacks

### Gas Optimization
- Inefficient loops
- Unnecessary storage operations
- Redundant computations
- Memory vs storage usage

### Best Practices
- Solidity version compatibility
- Function visibility
- Event emission
- Error handling
- Code organization

### Code Quality
- Code readability
- Documentation
- Naming conventions
- Code structure

### Access Control
- Role-based permissions
- Ownership patterns
- Multi-signature requirements
- Time-locked functions

### Reentrancy Protection
- Checks-Effects-Interactions pattern
- Reentrancy guards
- State variable updates
- External call safety

## Report Structure

The generated PDF reports include:

1. **Executive Summary**
   - Overall security score (0-100)
   - Issue count by severity
   - High-level recommendations

2. **Detailed Analysis**
   - Issue-by-issue breakdown
   - Severity classification
   - Specific code locations
   - Actionable recommendations

3. **Professional Formatting**
   - Clean, readable layout
   - Color-coded severity levels
   - Timestamp and metadata

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Security Considerations

- All analysis is performed client-side
- Contract code is sent to Google's Gemini API for analysis
- No contract code is stored permanently
- API key is embedded in the client (consider server-side implementation for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Disclaimer

This tool is for educational and informational purposes only. It should not be considered as financial, legal, or security advice. Always consult with professional auditors for production smart contracts.
