#!/usr/bin/env node
/**
 * Sample Report Generator
 *
 * Generates a sample evaluation report for demonstration and testing purposes
 */

import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';

import { generateEvaluationReport } from './modules/docx-generator.js';
import { generateSummaryWorkbook } from './modules/excel-generator.js';
import { EBIA } from './config/evaluation-framework.js';

// Sample evaluation data
const sampleEvaluation = {
  participantName: 'Sarah O\'Connor',
  projectTitle: 'AI-Assisted Quarterly Financial Reporting Automation',
  cohort: 'Q4 2024',
  projectOverview: `This capstone project demonstrates the strategic application of AI to transform
quarterly financial report generation. The participant successfully reduced report compilation time
by 85% while improving accuracy and stakeholder satisfaction. The project showcases sophisticated
cognitive delegation, strong prompt engineering practices, and rigorous quality assurance processes.`,
  intentions: `The primary objective was to reduce the time spent on quarterly financial report
compilation from 3 days to less than 4 hours while maintaining or improving accuracy. Secondary
objectives included improving consistency across reports and freeing up analyst time for higher-value
strategic work.`,
  outcomes: `All objectives were achieved and exceeded. Report generation time reduced by 85%
(from 24 hours to 3.5 hours). Zero errors in Q4 report compared to an average of 2.3 errors in
previous quarters. Board-level presentation received positive feedback from CFO. The methodology
has been documented for team-wide adoption.`,
  categoryScores: {
    'Cognitive Architecture': 4.75,
    'Prompt Proficiency': 4.50,
    'Quality Assurance': 5.00,
    'Value Creation': 4.85,
    'Reflective Practice': 4.25,
    'Submission Quality': 4.40,
    'Innovation': 4.00
  },
  categoryEvidence: {
    'Cognitive Architecture': `Exceptional cognitive delegation demonstrated through synthesis of
12 source documents including financial statements, market data, and previous reports. The
participant strategically divided tasks between AI (data synthesis, initial drafting) and human
(validation, strategic interpretation), showing sophisticated understanding of AI capabilities.`,
    'Prompt Proficiency': `Strong implementation of the Role-Brief-Style-Format framework with
evidence of systematic prompt iteration. Outputs suggest masterful prompting with exceptional
clarity and precision. Context provision was comprehensive including company style guides,
previous reports, and specific KPI requirements.`,
    'Quality Assurance': `Exhaustive multi-stage validation process documented with error
correction through three rounds of refinement. Cross-referencing all figures with source data,
review by finance team lead, and comparison with previous reports. Exemplary Human in the Loop
implementation with clear decision points throughout.`,
    'Value Creation': `Transformational business impact with board-level significance. 85% time
reduction quantified and validated. Zero-error achievement represents significant quality
improvement. Stakeholder value demonstrated through CFO feedback and team adoption plans.`,
    'Reflective Practice': `Strong learning depth with clear personal growth demonstrated. The
participant articulated transformative insights about AI effectiveness with context provision.
Clear, actionable plans for applying learning to other reporting processes and mentoring colleagues.`,
    'Submission Quality': `Comprehensive documentation with all required elements plus valuable
extras. Well-organized with clear section structure. Strong evidence documentation with
traceability to source materials.`,
    'Innovation': `Creative application of AI to a traditionally manual process. While the
approach builds on established practices, the implementation shows original thinking in prompt
design and validation methodology. Some boundary pushing evident in scope of automation attempted.`
  },
  fullScore: 4.58,
  fullBand: 'EXCEPTIONAL',
  quadrantScore: 4.78,
  quadrantBand: 'EXCEPTIONAL',
  ebiaAssessment: {
    claims: [
      {
        description: 'Reduced report generation time by 85%',
        evidenceStrength: 5,
        impactMagnitude: 5,
        score: 100
      },
      {
        description: 'Zero errors vs 2.3 average in previous quarters',
        evidenceStrength: 5,
        impactMagnitude: 4,
        score: 80
      },
      {
        description: 'Board-level presentation received positive feedback',
        evidenceStrength: 4,
        impactMagnitude: 5,
        score: 80
      },
      {
        description: 'Methodology documented for team-wide adoption',
        evidenceStrength: 4,
        impactMagnitude: 4,
        score: 64
      }
    ],
    aggregate: 81
  },
  scalabilityAssessment: `This approach demonstrates high scalability potential. The systematic
methodology and clear documentation suggest this could be replicated across multiple teams and
use cases with minimal adaptation. The prompt templates and validation frameworks are particularly
well-suited for team-wide adoption, and the participant has already begun documentation for
knowledge transfer.`,
  operatingModelImplications: `High cognitive delegation capability suggests potential for
expanded AI integration in complex analytical work across the finance function. Strong validation
practices indicate readiness for AI deployment in quality-critical processes including regulatory
reporting. Demonstrated value creation supports business case for further AI investment. Advanced
prompting skills suggest potential for internal training/mentoring role in AI capability building.`,
  recommendations: [
    'Continue to apply and refine AI-assisted approaches in daily work, expanding to other reporting cycles.',
    'Document and share the validation framework developed for this project through a shared prompt repository.',
    'Consider presenting the methodology at the next finance team meeting to support peer learning.',
    'Experiment with applying similar approaches to budget forecasting processes.',
    'Maintain Human in the Loop principles in all AI-assisted workflows, ensuring appropriate oversight for all financial outputs.'
  ],
  keyStrength: 'Quality Assurance',
  priorityDevelopment: 'Innovation',
  finalVerdict: `Sarah O'Connor has demonstrated exceptional performance in their capstone project
"AI-Assisted Quarterly Financial Reporting Automation", achieving an overall score of 4.58/5.00.
This submission exemplifies outstanding AI capability development, particularly in Quality Assurance.
The work shows transformational potential and provides an excellent model for peer learning. The
rigorous validation methodology and significant business impact make this a standout submission
that could serve as a reference for other participants.`,
  filesProcessed: 3,
  processingNotes: ''
};

// Second sample for spreadsheet testing
const sampleEvaluation2 = {
  participantName: 'Michael Chen',
  projectTitle: 'Customer Service Response Optimization with AI',
  cohort: 'Q4 2024',
  projectOverview: 'Applied AI to improve customer service response times and quality.',
  intentions: 'Reduce average response time and improve customer satisfaction scores.',
  outcomes: 'Achieved 40% reduction in response time with maintained satisfaction levels.',
  categoryScores: {
    'Cognitive Architecture': 3.75,
    'Prompt Proficiency': 3.50,
    'Quality Assurance': 4.00,
    'Value Creation': 3.80,
    'Reflective Practice': 3.25,
    'Submission Quality': 3.60,
    'Innovation': 3.40
  },
  categoryEvidence: {
    'Cognitive Architecture': 'Good delegation of routine response drafting to AI.',
    'Prompt Proficiency': 'Basic RBSF structure implemented with room for refinement.',
    'Quality Assurance': 'Solid validation process with supervisor review.',
    'Value Creation': 'Clear efficiency gains with quantified time savings.',
    'Reflective Practice': 'Adequate reflection on learning journey.',
    'Submission Quality': 'Complete documentation with clear organization.',
    'Innovation': 'Straightforward application with some creative elements.'
  },
  fullScore: 3.62,
  fullBand: 'STRONG',
  quadrantScore: 3.76,
  quadrantBand: 'STRONG',
  ebiaAssessment: {
    claims: [
      {
        description: '40% reduction in response time',
        evidenceStrength: 4,
        impactMagnitude: 4,
        score: 64
      }
    ],
    aggregate: 64
  },
  scalabilityAssessment: 'Good scalability potential with some refinement needed.',
  operatingModelImplications: 'Supports case for AI in customer service functions.',
  recommendations: [
    'Continue developing prompt engineering skills.',
    'Document successful response templates.',
    'Maintain quality oversight processes.'
  ],
  keyStrength: 'Quality Assurance',
  priorityDevelopment: 'Reflective Practice',
  finalVerdict: 'Michael Chen has demonstrated strong performance with solid fundamentals.',
  filesProcessed: 2,
  processingNotes: ''
};

// Third sample for variety
const sampleEvaluation3 = {
  participantName: 'Emma Williams',
  projectTitle: 'Marketing Content Generation Pipeline',
  cohort: 'Q4 2024',
  projectOverview: 'Built an AI-assisted content generation workflow for marketing materials.',
  intentions: 'Accelerate content production while maintaining brand voice.',
  outcomes: 'Doubled content output with consistent brand alignment.',
  categoryScores: {
    'Cognitive Architecture': 4.25,
    'Prompt Proficiency': 4.75,
    'Quality Assurance': 3.80,
    'Value Creation': 4.20,
    'Reflective Practice': 4.50,
    'Submission Quality': 4.00,
    'Innovation': 4.60
  },
  categoryEvidence: {
    'Cognitive Architecture': 'Strategic delegation of content ideation and drafting.',
    'Prompt Proficiency': 'Excellent prompt engineering with sophisticated templates.',
    'Quality Assurance': 'Good review process though could be more systematic.',
    'Value Creation': 'Clear productivity gains with quality maintenance.',
    'Reflective Practice': 'Deep reflection with transferable insights.',
    'Submission Quality': 'Well-documented with good evidence.',
    'Innovation': 'Novel approach to brand voice calibration with AI.'
  },
  fullScore: 4.30,
  fullBand: 'STRONG',
  quadrantScore: 4.25,
  quadrantBand: 'STRONG',
  ebiaAssessment: {
    claims: [
      {
        description: 'Doubled content output',
        evidenceStrength: 4,
        impactMagnitude: 4,
        score: 64
      },
      {
        description: 'Maintained brand consistency',
        evidenceStrength: 3,
        impactMagnitude: 4,
        score: 48
      }
    ],
    aggregate: 56
  },
  scalabilityAssessment: 'High scalability with well-documented templates.',
  operatingModelImplications: 'Model for marketing AI adoption across organization.',
  recommendations: [
    'Strengthen QA processes for content accuracy.',
    'Share prompt templates with marketing team.',
    'Continue innovative experimentation.'
  ],
  keyStrength: 'Prompt Proficiency',
  priorityDevelopment: 'Quality Assurance',
  finalVerdict: 'Emma Williams has demonstrated strong performance with exceptional innovation.',
  filesProcessed: 4,
  processingNotes: ''
};

async function generateSamples() {
  const outputDir = `${process.env.HOME}/Downloads/Capstone_Evaluations_Sample`;

  // Create output directory
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  console.log('\n' + '='.repeat(60));
  console.log('SAMPLE REPORT GENERATOR');
  console.log('='.repeat(60) + '\n');

  // Generate individual reports
  const evaluations = [sampleEvaluation, sampleEvaluation2, sampleEvaluation3];

  for (const evaluation of evaluations) {
    const sanitizedName = evaluation.participantName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const reportPath = path.join(outputDir, `${sanitizedName}_Capstone_Evaluation.docx`);

    await generateEvaluationReport(evaluation, reportPath);
    console.log(`Generated: ${reportPath}`);
    console.log(`  Score: ${evaluation.fullScore.toFixed(2)}/5.00 [${evaluation.fullBand}]`);
  }

  // Generate summary spreadsheet
  const summaryPath = path.join(outputDir, 'Cohort_Summary_Sample.xlsx');
  await generateSummaryWorkbook(evaluations, summaryPath, { errors: 0 });
  console.log(`\nGenerated summary: ${summaryPath}`);

  console.log('\n' + '='.repeat(60));
  console.log(`All samples generated in: ${outputDir}`);
  console.log('='.repeat(60) + '\n');
}

generateSamples().catch(console.error);
