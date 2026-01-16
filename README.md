# Capstone Evaluation Automation

Automated batch processor for evaluating Ibec AI Programme capstone submissions. This system fetches submissions from Google Drive, evaluates them against the v4.0 evaluation framework, generates individual DOCX reports, and produces cohort summary spreadsheets.

## Features

- **Batch Processing**: Process 150+ submissions automatically
- **Seven-Category Assessment**: Cognitive Architecture, Prompt Proficiency, Quality Assurance, Value Creation, Reflective Practice, Submission Quality, Innovation
- **EBIA Scoring**: Evidence-Based Impact Assessment for each submission
- **DOCX Reports**: Individual evaluation reports with Ibec branding
- **Excel Summary**: Cohort-level analytics with four worksheets:
  - Summary overview
  - Category breakdown with averages
  - Peer learning matrix
  - Statistics dashboard
- **Compliance Validation**: Automatic checking against Ibec rules

## Quick Start

### Prerequisites

- Node.js 18+
- Google Cloud service account with Drive API access

### Installation

```bash
npm install
```

### Generate Sample Reports (No Google Drive Required)

```bash
npm run generate-sample
# or
node src/generate-sample-report.js
```

This creates sample evaluation reports in `~/Downloads/Capstone_Evaluations_Sample/`

### Test Mode

```bash
npm run test
# or
node src/index.js --test
```

### Full Batch Processing

1. Set up Google Drive credentials (see Configuration below)
2. Run:

```bash
npm run process -- --credentials=./service-account.json
# or
node src/index.js --process --credentials=./path/to/credentials.json
```

## Configuration

### Google Drive Setup

1. Create a Google Cloud project
2. Enable the Google Drive API
3. Create a service account and download the JSON key
4. Share the source folder with the service account email

Place credentials in one of these locations:
- `./credentials.json`
- `./service-account.json`
- `~/.config/capstone-eval/credentials.json`

Or specify with `--credentials=<path>`

### Source Folder

Default folder ID: `1Z7GRBwSDQdCdJmxY7UVFaTYKMO55u807`

To change, edit `SOURCE_FOLDER_ID` in `src/modules/google-drive.js`

### Output Directory

Default: `~/Downloads/Capstone_Evaluations_YYYYMMDD/`

Override with environment variable:
```bash
OUTPUT_DIR=/custom/path node src/index.js --process
```

## Project Structure

```
├── src/
│   ├── index.js                 # Main batch processor
│   ├── generate-sample-report.js # Sample report generator
│   ├── config/
│   │   ├── evaluation-framework.js  # Scoring logic & categories
│   │   └── ibec-rules.js           # Compliance rules
│   └── modules/
│       ├── docx-generator.js    # DOCX report creation
│       ├── excel-generator.js   # Excel summary creation
│       ├── evaluator.js         # Submission evaluation logic
│       └── google-drive.js      # Google Drive integration
├── references/
│   ├── evaluation-framework.md  # Framework documentation
│   ├── report-structure.md      # Report template spec
│   └── ibec-rules.md           # Compliance documentation
├── output/                      # Default output directory
└── package.json
```

## Evaluation Framework

### Categories & Weights

| Category | Weight |
|----------|--------|
| Cognitive Architecture | 17.5% |
| Prompt Proficiency | 17.5% |
| Quality Assurance | 17.5% |
| Value Creation | 17.5% |
| Reflective Practice | 12.5% |
| Submission Quality | 5.0% |
| Innovation | 12.5% |

### Performance Bands

| Band | Score Range |
|------|-------------|
| EXCEPTIONAL | 4.50 - 5.00 |
| STRONG | 3.50 - 4.49 |
| DEVELOPING | 2.50 - 3.49 |
| BASIC | 1.50 - 2.49 |
| INSUFFICIENT | 1.00 - 1.49 |

See `references/evaluation-framework.md` for detailed scoring criteria.

## Output Files

For each participant:
- `[Name]_Capstone_Evaluation.docx` - Individual evaluation report

For the cohort:
- `Cohort_Summary_YYYYMMDD.xlsx` - Summary spreadsheet
- `error_log.txt` - Processing errors
- `processing_log.txt` - Progress log

## Compliance Rules

Reports automatically exclude:
- Named colleagues in peer learning
- Cohort rankings
- Copilot recommendations
- 1:1 coaching recommendations
- Change champion suggestions

Reports automatically include:
- Framework v4.0 reference
- Required footer
- Human in the Loop principles
- Generic peer learning text

See `references/ibec-rules.md` for full compliance documentation.

## API Usage

```javascript
import { processBatch } from './src/index.js';

// Process with credentials file
const result = await processBatch('./credentials.json');

// Access results
console.log(`Processed: ${result.stats.successful}/${result.stats.total}`);
console.log(`Output: ${result.outputDir}`);
```

## License

Proprietary - Ibec AI Programme
