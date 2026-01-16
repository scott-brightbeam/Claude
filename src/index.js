#!/usr/bin/env node
/**
 * Capstone Evaluation Batch Processor
 *
 * Main entry point for processing capstone submissions from Google Drive
 * or local folder and generating evaluation reports.
 *
 * Usage:
 *   node src/index.js --process --local=./submissions  # Process from local folder
 *   node src/index.js --process --credentials=./creds.json  # With Google Drive
 *   node src/index.js --test                       # Run with test data
 */

import { existsSync } from 'fs';
import { mkdir, appendFile, writeFile, readFile } from 'fs/promises';
import path from 'path';

import { createDriveClient, SOURCE_FOLDER_ID } from './modules/google-drive.js';
import { createLocalProcessor } from './modules/local-files.js';
import { evaluateSubmission } from './modules/evaluator.js';
import { generateEvaluationReport, validateEvaluationData } from './modules/docx-generator.js';
import { generateSummaryWorkbook } from './modules/excel-generator.js';
import { validateReportContent, autoFixContent } from './config/ibec-rules.js';

// Configuration
const OUTPUT_DIR = process.env.OUTPUT_DIR || `${process.env.HOME}/Downloads/Capstone_Evaluations_${formatDate(new Date())}`;
const TEMP_DIR = '/tmp/capstone_processing';

/**
 * Format date as YYYYMMDD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Initialize output directories and logging
 */
async function initializeOutput() {
  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Create temp directory
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }

  // Initialize error log
  const errorLogPath = path.join(OUTPUT_DIR, 'error_log.txt');
  await writeFile(errorLogPath, `Capstone Evaluation Error Log - ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`);

  // Initialize processing log
  const processLogPath = path.join(OUTPUT_DIR, 'processing_log.txt');
  await writeFile(processLogPath, `Capstone Evaluation Processing Log - ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`);

  return { errorLogPath, processLogPath };
}

/**
 * Log an error
 */
async function logError(errorLogPath, participantName, error) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ERROR: ${participantName} - ${error}\n`;
  await appendFile(errorLogPath, logEntry);
  console.error(logEntry.trim());
}

/**
 * Log progress
 */
async function logProgress(processLogPath, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  await appendFile(processLogPath, logEntry);
  console.log(message);
}

/**
 * Process a single participant
 */
async function processParticipant(driveClient, participant, outputDir, logs, stats) {
  const { name, mainDoc, supportingDocs } = participant;
  const { errorLogPath, processLogPath } = logs;

  try {
    // Fetch all content
    const content = await driveClient.fetchParticipantContent(participant, TEMP_DIR);

    if (!content.mainContent && content.supportingContent.length === 0) {
      throw new Error('No content could be extracted from files');
    }

    // Combine all content
    let combinedContent = content.mainContent;
    for (const support of content.supportingContent) {
      combinedContent += `\n\n--- Supporting Document: ${support.name} ---\n\n${support.content}`;
    }

    // Evaluate submission
    const evaluation = evaluateSubmission(name, combinedContent, content.filesProcessed);

    // Validate evaluation data
    const validation = validateEvaluationData(evaluation);
    if (!validation.isValid) {
      await logError(errorLogPath, name, `Validation failed: ${validation.message}`);
      evaluation.processingNotes = `Warning: ${validation.message}`;
    }

    // Generate DOCX report
    const sanitizedName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const reportPath = path.join(outputDir, `${sanitizedName}_Capstone_Evaluation.docx`);

    await generateEvaluationReport(evaluation, reportPath);

    // Log success
    await logProgress(processLogPath, `Completed: ${name} - ${evaluation.fullScore.toFixed(2)}/5.00 [${evaluation.fullBand}]`);

    stats.successful++;
    return evaluation;

  } catch (error) {
    await logError(errorLogPath, name, error.message);
    stats.errors++;

    // Return partial evaluation for summary
    return {
      participantName: name,
      projectTitle: 'Error during processing',
      fullScore: 0,
      fullBand: 'ERROR',
      quadrantScore: 0,
      quadrantBand: 'ERROR',
      categoryScores: {},
      ebiaScore: 0,
      keyStrength: 'N/A',
      priorityDevelopment: 'N/A',
      filesProcessed: 0,
      processingNotes: error.message
    };
  }
}

/**
 * Main batch processing function
 */
async function processBatch(credentialsPath) {
  console.log('\n' + '='.repeat(60));
  console.log('CAPSTONE EVALUATION BATCH PROCESSOR');
  console.log('='.repeat(60) + '\n');

  // Initialize
  const logs = await initializeOutput();
  const stats = { total: 0, successful: 0, errors: 0 };
  const evaluations = [];

  // Initialize Google Drive client
  const driveClient = createDriveClient();

  // Authenticate
  if (credentialsPath) {
    console.log('Authenticating with Google Drive...');
    await driveClient.authenticate(credentialsPath);
  } else {
    // Check for credentials in default locations
    const defaultPaths = [
      './credentials.json',
      './service-account.json',
      path.join(process.env.HOME, '.config/capstone-eval/credentials.json')
    ];

    let authenticated = false;
    for (const credPath of defaultPaths) {
      if (existsSync(credPath)) {
        console.log(`Found credentials at: ${credPath}`);
        await driveClient.authenticate(credPath);
        authenticated = true;
        break;
      }
    }

    if (!authenticated) {
      console.error('\nNo credentials found. Please provide credentials using:');
      console.error('  --credentials=<path-to-service-account.json>\n');
      console.error('Or place credentials.json in the project root.\n');
      process.exit(1);
    }
  }

  // Phase 1: Index all files
  console.log('\n--- PHASE 1: INDEXING FILES ---\n');
  const files = await driveClient.listAllFiles(SOURCE_FOLDER_ID);
  const participants = driveClient.groupFilesByParticipant(files);

  const participantNames = Object.keys(participants);
  stats.total = participantNames.length;

  console.log(`Found ${stats.total} participants to process\n`);
  await logProgress(logs.processLogPath, `Starting batch processing of ${stats.total} participants`);

  // Phase 2: Process each participant
  console.log('\n--- PHASE 2: PROCESSING SUBMISSIONS ---\n');

  for (let i = 0; i < participantNames.length; i++) {
    const name = participantNames[i];
    const participant = participants[name];

    console.log(`\nProcessing [${i + 1}/${stats.total}]: ${name}`);

    const evaluation = await processParticipant(driveClient, participant, OUTPUT_DIR, logs, stats);
    evaluations.push(evaluation);

    // Progress report every 10 participants
    if ((i + 1) % 10 === 0) {
      console.log(`\n--- Progress: ${i + 1}/${stats.total} complete (${stats.errors} errors) ---\n`);
    }
  }

  // Phase 3: Generate cohort summary
  console.log('\n--- PHASE 3: GENERATING SUMMARY SPREADSHEET ---\n');

  const validEvaluations = evaluations.filter(e => e.fullBand !== 'ERROR');
  const summaryPath = path.join(OUTPUT_DIR, `Cohort_Summary_${formatDate(new Date())}.xlsx`);

  await generateSummaryWorkbook(validEvaluations, summaryPath, { errors: stats.errors });
  console.log(`Summary spreadsheet generated: ${summaryPath}`);

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('BATCH PROCESSING COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal participants: ${stats.total}`);
  console.log(`Successful: ${stats.successful}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  console.log('='.repeat(60) + '\n');

  await logProgress(logs.processLogPath, `\nBATCH COMPLETE: ${stats.successful}/${stats.total} successful, ${stats.errors} errors`);

  return { stats, evaluations, outputDir: OUTPUT_DIR };
}

/**
 * Process with manual credentials input (for CLI use)
 */
async function processWithManualCredentials(credentialsJson) {
  const credentials = JSON.parse(credentialsJson);
  const tempCredPath = path.join(TEMP_DIR, 'temp_credentials.json');

  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }

  await writeFile(tempCredPath, JSON.stringify(credentials));
  return await processBatch(tempCredPath);
}

/**
 * Test mode - process with sample data
 */
async function runTestMode() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST MODE - Generating sample evaluation');
  console.log('='.repeat(60) + '\n');

  // Initialize output
  const logs = await initializeOutput();

  // Sample content
  const sampleContent = `
Project Title: AI-Assisted Financial Report Generation
Cohort: Q4 2024

Executive Summary
This capstone project demonstrates the application of AI to automate quarterly financial report generation,
achieving significant time savings and improved accuracy.

Objectives
The primary objective was to reduce the time spent on quarterly financial report compilation from
3 days to less than 4 hours while maintaining or improving accuracy.

Methodology
I used a systematic approach with clear prompt engineering following the Role-Brief-Style-Format structure:
- Role: Financial analyst specializing in quarterly reporting
- Brief: Generate comprehensive financial narrative from raw data
- Style: Professional, concise, suitable for board presentation
- Format: Structured report with executive summary, detailed analysis, and recommendations

I provided extensive context including previous reports, company style guides, and specific KPIs to track.

Quality Assurance
Exhaustive validation was performed including:
- Cross-referencing all generated figures with source data
- Review by finance team lead
- Comparison with manually-produced previous reports
- Error correction and iteration through 3 rounds of refinement

Human in the Loop was maintained throughout, with final approval required before any figures were published.

Results and Impact
- Reduced report generation time by 85% (from 24 hours to 3.5 hours)
- Improved accuracy: zero errors in Q4 report vs. average of 2.3 errors in previous quarters
- Board-level presentation received positive feedback
- Stakeholder satisfaction increased

Reflection
This project transformed my approach to routine analytical work. I learned that AI is most effective
when provided with comprehensive context and clear structure. The key insight was that quality
assurance becomes more important, not less, when using AI assistance.

I plan to apply these learnings to other reporting processes and help colleagues adopt similar approaches.
`;

  // Run evaluation
  const evaluation = evaluateSubmission('Test Participant', sampleContent, 1);

  console.log('\nEvaluation Results:');
  console.log(`  Full Score: ${evaluation.fullScore.toFixed(2)}/5.00 [${evaluation.fullBand}]`);
  console.log(`  Quadrant Score: ${evaluation.quadrantScore.toFixed(2)}/5.00 [${evaluation.quadrantBand}]`);
  console.log(`  Key Strength: ${evaluation.keyStrength}`);
  console.log(`  Priority Development: ${evaluation.priorityDevelopment}`);

  console.log('\nCategory Scores:');
  for (const [cat, score] of Object.entries(evaluation.categoryScores)) {
    console.log(`  ${cat}: ${score.toFixed(2)}`);
  }

  // Generate test report
  const reportPath = path.join(OUTPUT_DIR, 'Test_Participant_Capstone_Evaluation.docx');
  await generateEvaluationReport(evaluation, reportPath);
  console.log(`\nTest report generated: ${reportPath}`);

  // Generate test summary
  const summaryPath = path.join(OUTPUT_DIR, `Test_Summary_${formatDate(new Date())}.xlsx`);
  await generateSummaryWorkbook([evaluation], summaryPath, { errors: 0 });
  console.log(`Test summary generated: ${summaryPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60) + '\n');

  return { evaluation, reportPath, summaryPath };
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    process: false,
    test: false,
    credentials: null,
    local: null,
    help: false
  };

  for (const arg of args) {
    if (arg === '--process') options.process = true;
    else if (arg === '--test') options.test = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--credentials=')) {
      options.credentials = arg.split('=')[1];
    }
    else if (arg.startsWith('--local=')) {
      options.local = arg.split('=')[1];
    }
  }

  return options;
}

/**
 * Show help
 */
function showHelp() {
  console.log(`
Capstone Evaluation Batch Processor
====================================

Usage:
  node src/index.js [options]

Options:
  --process                Process all submissions
  --local=<folder>         Process from local folder (recommended)
  --credentials=<path>     Path to Google service account JSON file
  --test                   Run with sample data (no Google Drive required)
  --help, -h               Show this help message

Examples:
  node src/index.js --test
  node src/index.js --process --local=./submissions
  node src/index.js --process --local="~/Downloads/Capstone_Submissions"
  node src/index.js --process --credentials=./service-account.json

Environment Variables:
  OUTPUT_DIR              Override default output directory

For more information, see the README.md file.
`);
}

/**
 * Process from local folder
 */
async function processLocalBatch(localPath) {
  console.log('\n' + '='.repeat(60));
  console.log('CAPSTONE EVALUATION BATCH PROCESSOR (LOCAL MODE)');
  console.log('='.repeat(60) + '\n');

  // Expand home directory if needed
  if (localPath.startsWith('~')) {
    localPath = localPath.replace('~', process.env.HOME);
  }

  // Resolve to absolute path
  localPath = path.resolve(localPath);

  if (!existsSync(localPath)) {
    console.error(`Error: Folder not found: ${localPath}`);
    process.exit(1);
  }

  console.log(`Source folder: ${localPath}`);

  // Initialize
  const logs = await initializeOutput();
  const stats = { total: 0, successful: 0, errors: 0 };
  const evaluations = [];

  // Initialize local file processor
  const processor = createLocalProcessor(localPath);

  // Phase 1: Index all files
  console.log('\n--- PHASE 1: INDEXING FILES ---\n');
  const files = await processor.listAllFiles();
  const participants = processor.groupFilesByParticipant(files);

  const participantNames = Object.keys(participants);
  stats.total = participantNames.length;

  console.log(`Found ${stats.total} participants to process\n`);
  await logProgress(logs.processLogPath, `Starting batch processing of ${stats.total} participants from local folder`);

  // Phase 2: Process each participant
  console.log('\n--- PHASE 2: PROCESSING SUBMISSIONS ---\n');

  for (let i = 0; i < participantNames.length; i++) {
    const name = participantNames[i];
    const participant = participants[name];

    console.log(`\nProcessing [${i + 1}/${stats.total}]: ${name}`);

    try {
      // Fetch content
      const content = await processor.fetchParticipantContent(participant);

      if (!content.mainContent && content.supportingContent.length === 0) {
        throw new Error('No content could be extracted from files');
      }

      // Combine all content
      let combinedContent = content.mainContent;
      for (const support of content.supportingContent) {
        combinedContent += `\n\n--- Supporting Document: ${support.name} ---\n\n${support.content}`;
      }

      // Evaluate submission
      const evaluation = evaluateSubmission(name, combinedContent, content.filesProcessed);

      // Generate DOCX report
      const sanitizedName = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const reportPath = path.join(OUTPUT_DIR, `${sanitizedName}_Capstone_Evaluation.docx`);
      await generateEvaluationReport(evaluation, reportPath);

      // Log success
      await logProgress(logs.processLogPath, `Completed: ${name} - ${evaluation.fullScore.toFixed(2)}/5.00 [${evaluation.fullBand}]`);
      console.log(`  Score: ${evaluation.fullScore.toFixed(2)}/5.00 [${evaluation.fullBand}]`);

      stats.successful++;
      evaluations.push(evaluation);

    } catch (error) {
      await logError(logs.errorLogPath, name, error.message);
      console.error(`  Error: ${error.message}`);
      stats.errors++;

      evaluations.push({
        participantName: name,
        projectTitle: 'Error during processing',
        fullScore: 0,
        fullBand: 'ERROR',
        quadrantScore: 0,
        quadrantBand: 'ERROR',
        categoryScores: {},
        ebiaScore: 0,
        keyStrength: 'N/A',
        priorityDevelopment: 'N/A',
        filesProcessed: 0,
        processingNotes: error.message
      });
    }

    // Progress report every 10 participants
    if ((i + 1) % 10 === 0) {
      console.log(`\n--- Progress: ${i + 1}/${stats.total} complete (${stats.errors} errors) ---\n`);
    }
  }

  // Phase 3: Generate cohort summary
  console.log('\n--- PHASE 3: GENERATING SUMMARY SPREADSHEET ---\n');

  const validEvaluations = evaluations.filter(e => e.fullBand !== 'ERROR');
  const summaryPath = path.join(OUTPUT_DIR, `Cohort_Summary_${formatDate(new Date())}.xlsx`);

  await generateSummaryWorkbook(validEvaluations, summaryPath, { errors: stats.errors });
  console.log(`Summary spreadsheet generated: ${summaryPath}`);

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('BATCH PROCESSING COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal participants: ${stats.total}`);
  console.log(`Successful: ${stats.successful}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  console.log('='.repeat(60) + '\n');

  await logProgress(logs.processLogPath, `\nBATCH COMPLETE: ${stats.successful}/${stats.total} successful, ${stats.errors} errors`);

  return { stats, evaluations, outputDir: OUTPUT_DIR };
}

// Main execution
const options = parseArgs();

if (options.help) {
  showHelp();
} else if (options.test) {
  runTestMode().catch(console.error);
} else if (options.process) {
  if (options.local) {
    // Process from local folder
    processLocalBatch(options.local).catch(console.error);
  } else if (options.credentials) {
    // Process from Google Drive with credentials
    processBatch(options.credentials).catch(console.error);
  } else {
    // Try default Google Drive credentials or show local option
    console.log('No source specified.');
    console.log('\nFor local processing (recommended):');
    console.log('  node src/index.js --process --local="~/Downloads/Capstone_Submissions"');
    console.log('\nFor Google Drive processing:');
    console.log('  node src/index.js --process --credentials=./credentials.json');
  }
} else {
  console.log('No action specified. Use --help for usage information.');
  console.log('Quick start: node src/index.js --test');
}

// Export for programmatic use
export {
  processBatch,
  processLocalBatch,
  processWithManualCredentials,
  runTestMode,
  initializeOutput,
  OUTPUT_DIR
};
