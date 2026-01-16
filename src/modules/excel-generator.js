/**
 * Excel Summary Spreadsheet Generator
 *
 * Generates cohort summary workbook with four sheets:
 * 1. Summary - Overview of all participants
 * 2. Category Breakdown - Detailed category scores
 * 3. Peer Learning Matrix - For identifying learning pairs
 * 4. Statistics - Cohort-level analytics
 */

import ExcelJS from 'exceljs';
import { getPerformanceBand, EVALUATION_CATEGORIES } from '../config/evaluation-framework.js';

// Ibec brand colors
const BRAND_ORANGE = 'F47920';
const WHITE = 'FFFFFF';
const GREEN_DARK = '2E7D32';
const GREEN_LIGHT = '4CAF50';
const YELLOW = 'FFC107';
const ORANGE = 'FF9800';
const RED = 'F44336';

/**
 * Get fill color for performance band
 */
function getBandFill(band) {
  const colors = {
    'EXCEPTIONAL': GREEN_DARK,
    'STRONG': GREEN_LIGHT,
    'DEVELOPING': YELLOW,
    'BASIC': ORANGE,
    'INSUFFICIENT': RED
  };
  return colors[band] || 'CCCCCC';
}

/**
 * Get fill color for score value
 */
function getScoreFill(score) {
  if (score >= 4.50) return GREEN_DARK;
  if (score >= 3.50) return GREEN_LIGHT;
  if (score >= 2.50) return YELLOW;
  return RED;
}

/**
 * Apply header styling to a row
 */
function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_ORANGE }
    };
    cell.font = {
      bold: true,
      color: { argb: WHITE },
      name: 'Calibri',
      size: 11
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  row.height = 30;
}

/**
 * Apply data cell styling
 */
function styleDataCell(cell, options = {}) {
  cell.font = {
    name: 'Calibri',
    size: 10,
    bold: options.bold || false
  };
  cell.alignment = {
    horizontal: options.align || 'left',
    vertical: 'middle'
  };
  cell.border = {
    top: { style: 'thin', color: { argb: 'CCCCCC' } },
    left: { style: 'thin', color: { argb: 'CCCCCC' } },
    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
    right: { style: 'thin', color: { argb: 'CCCCCC' } }
  };

  if (options.fill) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.fill }
    };
    // White text on dark backgrounds
    if ([GREEN_DARK, RED, BRAND_ORANGE].includes(options.fill)) {
      cell.font.color = { argb: WHITE };
    }
  }
}

/**
 * Create Sheet 1: Summary
 */
function createSummarySheet(workbook, evaluations) {
  const sheet = workbook.addWorksheet('Summary', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  // Define columns
  sheet.columns = [
    { header: 'Participant Name', key: 'name', width: 25 },
    { header: 'Project Title', key: 'project', width: 40 },
    { header: 'Cohort', key: 'cohort', width: 12 },
    { header: 'Full Score', key: 'fullScore', width: 12 },
    { header: 'Full Band', key: 'fullBand', width: 14 },
    { header: 'Quadrant Score', key: 'quadrantScore', width: 14 },
    { header: 'Quadrant Band', key: 'quadrantBand', width: 14 },
    { header: 'EBIA Score', key: 'ebiaScore', width: 12 },
    { header: 'Key Strength', key: 'keyStrength', width: 35 },
    { header: 'Priority Development', key: 'priorityDev', width: 35 },
    { header: 'Files Processed', key: 'filesProcessed', width: 14 }
  ];

  // Style header row
  styleHeaderRow(sheet.getRow(1));

  // Sort evaluations by full score descending
  const sorted = [...evaluations].sort((a, b) => b.fullScore - a.fullScore);

  // Add data rows
  sorted.forEach((evalData) => {
    const row = sheet.addRow({
      name: evalData.participantName,
      project: evalData.projectTitle,
      cohort: evalData.cohort || 'N/A',
      fullScore: evalData.fullScore.toFixed(2),
      fullBand: evalData.fullBand,
      quadrantScore: evalData.quadrantScore.toFixed(2),
      quadrantBand: evalData.quadrantBand,
      ebiaScore: evalData.ebiaScore || 0,
      keyStrength: evalData.keyStrength,
      priorityDev: evalData.priorityDevelopment,
      filesProcessed: evalData.filesProcessed || 1
    });

    // Style each cell
    row.eachCell((cell, colNumber) => {
      const colKey = sheet.columns[colNumber - 1].key;
      let options = { align: 'left' };

      if (['fullScore', 'quadrantScore', 'ebiaScore', 'filesProcessed'].includes(colKey)) {
        options.align = 'center';
      }

      if (colKey === 'fullBand') {
        options.fill = getBandFill(evalData.fullBand);
        options.align = 'center';
        options.bold = true;
      }

      if (colKey === 'quadrantBand') {
        options.fill = getBandFill(evalData.quadrantBand);
        options.align = 'center';
        options.bold = true;
      }

      styleDataCell(cell, options);
    });
  });

  return sheet;
}

/**
 * Create Sheet 2: Category Breakdown
 */
function createCategoryBreakdownSheet(workbook, evaluations) {
  const sheet = workbook.addWorksheet('Category Breakdown', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  const categories = [
    'Cognitive Architecture',
    'Prompt Proficiency',
    'Quality Assurance',
    'Value Creation',
    'Reflective Practice',
    'Submission Quality',
    'Innovation'
  ];

  // Define columns
  sheet.columns = [
    { header: 'Participant Name', key: 'name', width: 25 },
    { header: 'Cat 1: Cognitive', key: 'cat1', width: 14 },
    { header: 'Cat 2: Prompting', key: 'cat2', width: 14 },
    { header: 'Cat 3: QA', key: 'cat3', width: 14 },
    { header: 'Cat 4: Value', key: 'cat4', width: 14 },
    { header: 'Cat 5: Reflection', key: 'cat5', width: 14 },
    { header: 'Cat 6: Submission', key: 'cat6', width: 14 },
    { header: 'Cat 7: Innovation', key: 'cat7', width: 14 },
    { header: 'Full Score', key: 'fullScore', width: 12 },
    { header: 'Quadrant Score', key: 'quadrantScore', width: 14 }
  ];

  // Style header row
  styleHeaderRow(sheet.getRow(1));

  // Add data rows
  evaluations.forEach((evalData) => {
    const scores = evalData.categoryScores || {};
    const row = sheet.addRow({
      name: evalData.participantName,
      cat1: (scores['Cognitive Architecture'] || 0).toFixed(2),
      cat2: (scores['Prompt Proficiency'] || 0).toFixed(2),
      cat3: (scores['Quality Assurance'] || 0).toFixed(2),
      cat4: (scores['Value Creation'] || 0).toFixed(2),
      cat5: (scores['Reflective Practice'] || 0).toFixed(2),
      cat6: (scores['Submission Quality'] || 0).toFixed(2),
      cat7: (scores['Innovation'] || 0).toFixed(2),
      fullScore: evalData.fullScore.toFixed(2),
      quadrantScore: evalData.quadrantScore.toFixed(2)
    });

    // Style with conditional formatting
    row.eachCell((cell, colNumber) => {
      const colKey = sheet.columns[colNumber - 1].key;
      let options = { align: 'center' };

      if (colKey === 'name') {
        options.align = 'left';
      }

      // Color code score columns
      if (colKey.startsWith('cat')) {
        const score = parseFloat(cell.value);
        if (!isNaN(score)) {
          options.fill = getScoreFill(score);
        }
      }

      styleDataCell(cell, options);
    });
  });

  // Add statistics rows
  sheet.addRow([]); // Empty row

  // Calculate averages
  const avgRow = sheet.addRow({
    name: 'AVERAGE',
    cat1: calculateAverage(evaluations, 'Cognitive Architecture').toFixed(2),
    cat2: calculateAverage(evaluations, 'Prompt Proficiency').toFixed(2),
    cat3: calculateAverage(evaluations, 'Quality Assurance').toFixed(2),
    cat4: calculateAverage(evaluations, 'Value Creation').toFixed(2),
    cat5: calculateAverage(evaluations, 'Reflective Practice').toFixed(2),
    cat6: calculateAverage(evaluations, 'Submission Quality').toFixed(2),
    cat7: calculateAverage(evaluations, 'Innovation').toFixed(2),
    fullScore: (evaluations.reduce((sum, e) => sum + e.fullScore, 0) / evaluations.length).toFixed(2),
    quadrantScore: (evaluations.reduce((sum, e) => sum + e.quadrantScore, 0) / evaluations.length).toFixed(2)
  });

  avgRow.eachCell((cell) => {
    styleDataCell(cell, { bold: true, align: 'center' });
  });

  // Calculate standard deviation
  const stdRow = sheet.addRow({
    name: 'STD DEV',
    cat1: calculateStdDev(evaluations, 'Cognitive Architecture').toFixed(2),
    cat2: calculateStdDev(evaluations, 'Prompt Proficiency').toFixed(2),
    cat3: calculateStdDev(evaluations, 'Quality Assurance').toFixed(2),
    cat4: calculateStdDev(evaluations, 'Value Creation').toFixed(2),
    cat5: calculateStdDev(evaluations, 'Reflective Practice').toFixed(2),
    cat6: calculateStdDev(evaluations, 'Submission Quality').toFixed(2),
    cat7: calculateStdDev(evaluations, 'Innovation').toFixed(2),
    fullScore: calculateStdDevField(evaluations, 'fullScore').toFixed(2),
    quadrantScore: calculateStdDevField(evaluations, 'quadrantScore').toFixed(2)
  });

  stdRow.eachCell((cell) => {
    styleDataCell(cell, { bold: true, align: 'center' });
  });

  return sheet;
}

/**
 * Create Sheet 3: Peer Learning Matrix
 */
function createPeerLearningSheet(workbook, evaluations) {
  const sheet = workbook.addWorksheet('Peer Learning Matrix', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  const categories = [
    'Cognitive Architecture',
    'Prompt Proficiency',
    'Quality Assurance',
    'Value Creation',
    'Reflective Practice',
    'Submission Quality',
    'Innovation'
  ];

  // Define columns
  sheet.columns = [
    { header: 'Participant Name', key: 'name', width: 25 },
    { header: 'Strongest Category', key: 'strongest', width: 22 },
    { header: 'Strongest Score', key: 'strongestScore', width: 14 },
    { header: 'Weakest Category', key: 'weakest', width: 22 },
    { header: 'Weakest Score', key: 'weakestScore', width: 14 },
    { header: 'Suggested Pairing Focus', key: 'pairingFocus', width: 30 }
  ];

  // Style header row
  styleHeaderRow(sheet.getRow(1));

  // Analyze each participant
  const analyzed = evaluations.map(evalItem => {
    const scores = evalItem.categoryScores || {};
    let strongest = { category: '', score: 0 };
    let weakest = { category: '', score: 5 };

    for (const cat of categories) {
      const score = scores[cat] || 0;
      if (score > strongest.score) {
        strongest = { category: cat, score };
      }
      if (score < weakest.score) {
        weakest = { category: cat, score };
      }
    }

    return {
      name: evalItem.participantName,
      strongest: strongest.category,
      strongestScore: strongest.score,
      weakest: weakest.category,
      weakestScore: weakest.score,
      pairingFocus: weakest.category // They need help in their weakest area
    };
  });

  // Sort by weakest category to group similar development needs
  analyzed.sort((a, b) => a.weakest.localeCompare(b.weakest));

  // Add rows
  analyzed.forEach(data => {
    const row = sheet.addRow({
      name: data.name,
      strongest: data.strongest,
      strongestScore: data.strongestScore.toFixed(2),
      weakest: data.weakest,
      weakestScore: data.weakestScore.toFixed(2),
      pairingFocus: data.pairingFocus
    });

    row.eachCell((cell, colNumber) => {
      const colKey = sheet.columns[colNumber - 1].key;
      let options = { align: 'left' };

      if (colKey === 'strongestScore') {
        options.fill = getScoreFill(data.strongestScore);
        options.align = 'center';
      }

      if (colKey === 'weakestScore') {
        options.fill = getScoreFill(data.weakestScore);
        options.align = 'center';
      }

      styleDataCell(cell, options);
    });
  });

  return sheet;
}

/**
 * Create Sheet 4: Statistics
 */
function createStatisticsSheet(workbook, evaluations, processingStats) {
  const sheet = workbook.addWorksheet('Statistics');

  const categories = [
    'Cognitive Architecture',
    'Prompt Proficiency',
    'Quality Assurance',
    'Value Creation',
    'Reflective Practice',
    'Submission Quality',
    'Innovation'
  ];

  // Title
  const titleRow = sheet.addRow(['COHORT STATISTICS']);
  titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: BRAND_ORANGE } };
  sheet.addRow([]);

  // Section: Overview
  sheet.addRow(['OVERVIEW']);
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 12 };

  sheet.addRow(['Total Participants Processed', evaluations.length]);
  sheet.addRow(['Processing Errors', processingStats?.errors || 0]);
  sheet.addRow(['Processing Date', new Date().toLocaleDateString('en-GB')]);
  sheet.addRow([]);

  // Section: Score Distribution
  sheet.addRow(['SCORE DISTRIBUTION BY BAND']);
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 12 };

  const bandCounts = {
    EXCEPTIONAL: 0,
    STRONG: 0,
    DEVELOPING: 0,
    BASIC: 0,
    INSUFFICIENT: 0
  };

  evaluations.forEach(e => {
    bandCounts[e.fullBand] = (bandCounts[e.fullBand] || 0) + 1;
  });

  Object.entries(bandCounts).forEach(([band, count]) => {
    const row = sheet.addRow([band, count, `${((count / evaluations.length) * 100).toFixed(1)}%`]);
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: getBandFill(band) }
    };
    if (['EXCEPTIONAL', 'INSUFFICIENT'].includes(band)) {
      row.getCell(1).font = { color: { argb: WHITE } };
    }
  });
  sheet.addRow([]);

  // Section: Category Averages
  sheet.addRow(['AVERAGE SCORES BY CATEGORY']);
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 12 };

  categories.forEach(cat => {
    const avg = calculateAverage(evaluations, cat);
    const row = sheet.addRow([cat, avg.toFixed(2)]);
    row.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: getScoreFill(avg) }
    };
  });
  sheet.addRow([]);

  // Section: Top/Bottom Scores
  sheet.addRow(['HIGHEST & LOWEST SCORES']);
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 12 };

  const sorted = [...evaluations].sort((a, b) => b.fullScore - a.fullScore);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  sheet.addRow(['Highest Score', highest?.participantName || 'N/A', highest?.fullScore?.toFixed(2) || 'N/A']);
  sheet.addRow(['Lowest Score', lowest?.participantName || 'N/A', lowest?.fullScore?.toFixed(2) || 'N/A']);
  sheet.addRow([]);

  // Section: Most Common Strengths/Weaknesses
  sheet.addRow(['MOST COMMON PATTERNS']);
  sheet.getRow(sheet.rowCount).font = { bold: true, size: 12 };

  const strengthCounts = {};
  const weaknessCounts = {};

  evaluations.forEach(e => {
    const scores = e.categoryScores || {};
    let strongest = { category: '', score: 0 };
    let weakest = { category: '', score: 5 };

    categories.forEach(cat => {
      const score = scores[cat] || 0;
      if (score > strongest.score) strongest = { category: cat, score };
      if (score < weakest.score) weakest = { category: cat, score };
    });

    strengthCounts[strongest.category] = (strengthCounts[strongest.category] || 0) + 1;
    weaknessCounts[weakest.category] = (weaknessCounts[weakest.category] || 0) + 1;
  });

  const topStrength = Object.entries(strengthCounts).sort((a, b) => b[1] - a[1])[0];
  const topWeakness = Object.entries(weaknessCounts).sort((a, b) => b[1] - a[1])[0];

  sheet.addRow(['Most Common Strength', topStrength?.[0] || 'N/A', `${topStrength?.[1] || 0} participants`]);
  sheet.addRow(['Most Common Development Area', topWeakness?.[0] || 'N/A', `${topWeakness?.[1] || 0} participants`]);

  // Auto-fit columns
  sheet.columns.forEach(col => {
    col.width = 30;
  });

  return sheet;
}

/**
 * Calculate average score for a category
 */
function calculateAverage(evaluations, category) {
  const scores = evaluations
    .map(e => e.categoryScores?.[category])
    .filter(s => s !== undefined && s !== null);

  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * Calculate standard deviation for a category
 */
function calculateStdDev(evaluations, category) {
  const scores = evaluations
    .map(e => e.categoryScores?.[category])
    .filter(s => s !== undefined && s !== null);

  if (scores.length === 0) return 0;

  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const squaredDiffs = scores.map(s => Math.pow(s - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length;

  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate standard deviation for a direct field
 */
function calculateStdDevField(evaluations, field) {
  const values = evaluations
    .map(e => e[field])
    .filter(v => v !== undefined && v !== null);

  if (values.length === 0) return 0;

  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length;

  return Math.sqrt(avgSquaredDiff);
}

/**
 * Generate the complete summary workbook
 */
export async function generateSummaryWorkbook(evaluations, outputPath, processingStats = {}) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Ibec AI Programme';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create all sheets
  createSummarySheet(workbook, evaluations);
  createCategoryBreakdownSheet(workbook, evaluations);
  createPeerLearningSheet(workbook, evaluations);
  createStatisticsSheet(workbook, evaluations, processingStats);

  // Save workbook
  await workbook.xlsx.writeFile(outputPath);

  return outputPath;
}

export default {
  generateSummaryWorkbook
};
