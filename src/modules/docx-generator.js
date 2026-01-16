/**
 * DOCX Report Generator for Capstone Evaluations
 *
 * Generates evaluation reports following Ibec branding and structure requirements
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
  Footer,
  Header,
  convertInchesToTwip,
  ShadingType,
  VerticalAlign,
  Packer
} from 'docx';
import { writeFile } from 'fs/promises';
import { IBEC_RULES, validateReportContent } from '../config/ibec-rules.js';
import { FRAMEWORK_VERSION, getPerformanceBand, EBIA } from '../config/evaluation-framework.js';

// Color constants
const BRAND_ORANGE = 'F47920';
const BRAND_ORANGE_LIGHT = 'FFF3E8';
const WHITE = 'FFFFFF';
const BLACK = '000000';
const GRAY_LIGHT = 'F5F5F5';
const GREEN_DARK = '2E7D32';
const GREEN_LIGHT = '4CAF50';
const YELLOW = 'FFC107';
const ORANGE = 'FF9800';
const RED = 'F44336';

/**
 * Get color for performance band
 */
function getBandColor(band) {
  const colors = {
    'EXCEPTIONAL': GREEN_DARK,
    'STRONG': GREEN_LIGHT,
    'DEVELOPING': YELLOW,
    'BASIC': ORANGE,
    'INSUFFICIENT': RED
  };
  return colors[band] || BLACK;
}

/**
 * Create a styled heading
 */
function createHeading(text, level = 1) {
  const sizes = { 1: 32, 2: 26, 3: 22 };
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: sizes[level] || 22,
        font: 'Calibri',
        color: level === 1 ? BRAND_ORANGE : BLACK
      })
    ],
    spacing: { before: 240, after: 120 },
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
  });
}

/**
 * Create a standard paragraph
 */
function createParagraph(text, options = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: options.size || 22,
        font: 'Calibri',
        bold: options.bold || false,
        italics: options.italics || false,
        color: options.color || BLACK
      })
    ],
    spacing: { after: options.spacing || 120 },
    alignment: options.alignment || AlignmentType.LEFT
  });
}

/**
 * Create a bullet point
 */
function createBullet(text, level = 0) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        font: 'Calibri'
      })
    ],
    bullet: { level },
    spacing: { after: 60 }
  });
}

/**
 * Create a styled table
 */
function createTable(headers, rows, options = {}) {
  const tableRows = [];

  // Header row
  if (headers && headers.length > 0) {
    tableRows.push(
      new TableRow({
        children: headers.map(header =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: header,
                    bold: true,
                    size: 22,
                    font: 'Calibri',
                    color: WHITE
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ],
            shading: { fill: BRAND_ORANGE, type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER
          })
        ),
        tableHeader: true
      })
    );
  }

  // Data rows
  for (const row of rows) {
    tableRows.push(
      new TableRow({
        children: row.map((cell, index) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: String(cell.text || cell),
                    size: 22,
                    font: 'Calibri',
                    bold: cell.bold || false,
                    color: cell.color || BLACK
                  })
                ],
                alignment: cell.alignment || (index === 0 ? AlignmentType.LEFT : AlignmentType.CENTER)
              })
            ],
            shading: cell.shading ? { fill: cell.shading, type: ShadingType.CLEAR } : undefined,
            verticalAlign: VerticalAlign.CENTER
          })
        )
      })
    );
  }

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
    }
  });
}

/**
 * Create score display with color coding
 */
function createScoreDisplay(score, maxScore = 5) {
  const band = getPerformanceBand(score);
  return {
    text: `${score.toFixed(2)}/${maxScore.toFixed(2)}`,
    color: getBandColor(band.label),
    bold: true
  };
}

/**
 * Generate the complete evaluation report
 */
export async function generateEvaluationReport(evaluation, outputPath) {
  const {
    participantName,
    projectTitle,
    cohort,
    projectOverview,
    intentions,
    outcomes,
    categoryScores,
    categoryEvidence,
    fullScore,
    fullBand,
    quadrantScore,
    quadrantBand,
    ebiaAssessment,
    scalabilityAssessment,
    operatingModelImplications,
    recommendations,
    keyStrength,
    priorityDevelopment,
    finalVerdict
  } = evaluation;

  const sections = [];

  // ===== SECTION 1: HEADER & ASSESSMENT SUMMARY =====
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'IBEC AI PROGRAMME',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: BRAND_ORANGE
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Capstone Project Evaluation',
          bold: true,
          size: 36,
          font: 'Calibri'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Framework ${FRAMEWORK_VERSION}`,
          size: 20,
          font: 'Calibri',
          italics: true,
          color: '666666'
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 }
    })
  );

  // Participant info table
  sections.push(
    createTable(null, [
      [{ text: 'Participant:', bold: true }, participantName],
      [{ text: 'Project Title:', bold: true }, projectTitle],
      [{ text: 'Cohort:', bold: true }, cohort || 'N/A'],
      [{ text: 'Evaluation Date:', bold: true }, new Date().toLocaleDateString('en-GB')]
    ])
  );

  // Assessment summary box
  sections.push(
    new Paragraph({ children: [], spacing: { after: 240 } }),
    createHeading('Assessment Summary', 2)
  );

  sections.push(
    createTable(
      ['Metric', 'Score', 'Band'],
      [
        [
          'Full Assessment',
          createScoreDisplay(fullScore),
          { text: fullBand, color: getBandColor(fullBand), bold: true }
        ],
        [
          'Quadrant Score',
          createScoreDisplay(quadrantScore),
          { text: quadrantBand, color: getBandColor(quadrantBand), bold: true }
        ],
        [
          'EBIA Score',
          { text: `${ebiaAssessment.aggregate.toFixed(0)}/100`, bold: true },
          { text: EBIA.getBand(ebiaAssessment.aggregate).label, color: getBandColor(EBIA.getBand(ebiaAssessment.aggregate).label), bold: true }
        ]
      ]
    )
  );

  // ===== SECTION 2: PROJECT OVERVIEW =====
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading('Project Overview', 1),
    createParagraph(projectOverview)
  );

  // ===== SECTION 3: INTENTIONS VS OUTCOMES =====
  sections.push(
    createHeading('Intentions vs Outcomes', 1),
    createHeading('Stated Intentions', 2),
    createParagraph(intentions),
    createHeading('Achieved Outcomes', 2),
    createParagraph(outcomes)
  );

  // ===== SECTION 4: SEVEN-CATEGORY ASSESSMENT =====
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading('Seven-Category Assessment', 1)
  );

  const categories = [
    { name: 'Cognitive Architecture', weight: '17.5%' },
    { name: 'Prompt Proficiency', weight: '17.5%' },
    { name: 'Quality Assurance', weight: '17.5%' },
    { name: 'Value Creation', weight: '17.5%' },
    { name: 'Reflective Practice', weight: '12.5%' },
    { name: 'Submission Quality', weight: '5.0%' },
    { name: 'Innovation', weight: '12.5%' }
  ];

  for (const cat of categories) {
    const score = categoryScores[cat.name] || 0;
    const evidence = categoryEvidence[cat.name] || 'No evidence documented';
    const band = getPerformanceBand(score);

    sections.push(
      createHeading(`${cat.name} (${cat.weight})`, 2),
      createTable(
        ['Score', 'Band'],
        [[
          createScoreDisplay(score),
          { text: band.label, color: getBandColor(band.label), bold: true }
        ]]
      ),
      new Paragraph({ children: [], spacing: { after: 60 } }),
      createParagraph(evidence, { spacing: 180 })
    );
  }

  // ===== SECTION 5: QUADRANT ANALYSIS =====
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading('Quadrant Analysis', 1),
    createParagraph(
      'The quadrant score represents the average of the four core competency categories: ' +
      'Cognitive Architecture, Prompt Proficiency, Quality Assurance, and Value Creation.'
    ),
    new Paragraph({ children: [], spacing: { after: 120 } }),
    createTable(
      ['Category', 'Score', 'Contribution'],
      [
        ['Cognitive Architecture', createScoreDisplay(categoryScores['Cognitive Architecture'] || 0), '25%'],
        ['Prompt Proficiency', createScoreDisplay(categoryScores['Prompt Proficiency'] || 0), '25%'],
        ['Quality Assurance', createScoreDisplay(categoryScores['Quality Assurance'] || 0), '25%'],
        ['Value Creation', createScoreDisplay(categoryScores['Value Creation'] || 0), '25%'],
        [{ text: 'Quadrant Total', bold: true }, createScoreDisplay(quadrantScore), { text: quadrantBand, bold: true, color: getBandColor(quadrantBand) }]
      ]
    )
  );

  // ===== SECTION 6: EBIA IMPACT ASSESSMENT =====
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading('Evidence-Based Impact Assessment (EBIA)', 1),
    createParagraph(
      'Each impact claim is assessed based on Evidence Strength (1-5) and Impact Magnitude (1-5). ' +
      'The claim score is calculated as: Evidence × Magnitude × 4.'
    )
  );

  if (ebiaAssessment.claims && ebiaAssessment.claims.length > 0) {
    const ebiaRows = ebiaAssessment.claims.map(claim => [
      claim.description,
      String(claim.evidenceStrength),
      String(claim.impactMagnitude),
      { text: String(claim.score), bold: true }
    ]);

    ebiaRows.push([
      { text: 'AGGREGATE SCORE', bold: true },
      '',
      '',
      { text: `${ebiaAssessment.aggregate.toFixed(0)}/100`, bold: true, color: getBandColor(EBIA.getBand(ebiaAssessment.aggregate).label) }
    ]);

    sections.push(
      createTable(
        ['Impact Claim', 'Evidence (1-5)', 'Magnitude (1-5)', 'Score'],
        ebiaRows
      )
    );
  }

  // ===== SECTION 7: SCALABILITY ASSESSMENT =====
  sections.push(
    createHeading('Scalability Assessment', 1),
    createParagraph(scalabilityAssessment)
  );

  // ===== SECTION 8: OPERATING MODEL IMPLICATIONS =====
  sections.push(
    createHeading('Operating Model Implications', 1),
    createParagraph(operatingModelImplications)
  );

  // ===== SECTION 9: SUMMARY & RECOMMENDATIONS =====
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading('Summary & Recommendations', 1),
    createHeading('Key Strength', 2),
    createParagraph(keyStrength),
    createHeading('Priority Development Area', 2),
    createParagraph(priorityDevelopment),
    createHeading('Recommendations', 2)
  );

  for (const rec of recommendations) {
    sections.push(createBullet(rec));
  }

  // Peer learning (generic as per Ibec rules)
  sections.push(
    createHeading('Peer Learning Opportunity', 2),
    createParagraph(
      'Colleague to be identified following full cohort analysis. ' +
      'This participant would benefit from connecting with peers who demonstrate strength in their development area.'
    )
  );

  // ===== SECTION 10: FINAL VERDICT =====
  sections.push(
    new Paragraph({ children: [new PageBreak()] }),
    createHeading('Final Verdict', 1),
    new Paragraph({
      children: [
        new TextRun({
          text: finalVerdict,
          size: 24,
          font: 'Calibri'
        })
      ],
      spacing: { after: 240 },
      shading: { fill: BRAND_ORANGE_LIGHT, type: ShadingType.CLEAR },
      border: {
        top: { style: BorderStyle.SINGLE, size: 6, color: BRAND_ORANGE },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_ORANGE },
        left: { style: BorderStyle.SINGLE, size: 6, color: BRAND_ORANGE },
        right: { style: BorderStyle.SINGLE, size: 6, color: BRAND_ORANGE }
      }
    })
  );

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27), // A4 width
              height: convertInchesToTwip(11.69) // A4 height
            },
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1)
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${participantName} - Capstone Evaluation`,
                    size: 18,
                    font: 'Calibri',
                    color: '999999'
                  })
                ],
                alignment: AlignmentType.RIGHT
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: IBEC_RULES.FOOTER_TEXT,
                    size: 18,
                    font: 'Calibri',
                    italics: true,
                    color: '666666'
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          })
        },
        children: sections
      }
    ]
  });

  // Generate buffer
  const buffer = await Packer.toBuffer(doc);

  // Write to file
  await writeFile(outputPath, buffer);

  return outputPath;
}

/**
 * Validate evaluation data before generating report
 */
export function validateEvaluationData(evaluation) {
  const requiredFields = [
    'participantName',
    'projectTitle',
    'projectOverview',
    'categoryScores',
    'fullScore',
    'fullBand',
    'quadrantScore',
    'quadrantBand',
    'ebiaAssessment',
    'recommendations',
    'finalVerdict'
  ];

  const missing = requiredFields.filter(field => !evaluation[field]);

  if (missing.length > 0) {
    return {
      isValid: false,
      missing,
      message: `Missing required fields: ${missing.join(', ')}`
    };
  }

  return { isValid: true };
}

export default {
  generateEvaluationReport,
  validateEvaluationData
};
