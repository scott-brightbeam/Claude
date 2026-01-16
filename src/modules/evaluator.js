/**
 * Capstone Evaluator Module
 *
 * Analyzes submission content and generates scores against the evaluation framework
 */

import {
  EVALUATION_CATEGORIES,
  EBIA,
  calculateCategoryScore,
  calculateFullAssessmentScore,
  calculateQuadrantScore,
  getPerformanceBand
} from '../config/evaluation-framework.js';

/**
 * Evaluation result structure
 */
export function createEmptyEvaluation(participantName) {
  return {
    participantName,
    projectTitle: '',
    cohort: '',
    projectOverview: '',
    intentions: '',
    outcomes: '',
    categoryScores: {},
    categoryEvidence: {},
    subCriteriaScores: {},
    fullScore: 0,
    fullBand: 'INSUFFICIENT',
    quadrantScore: 0,
    quadrantBand: 'INSUFFICIENT',
    ebiaAssessment: {
      claims: [],
      aggregate: 0
    },
    scalabilityAssessment: '',
    operatingModelImplications: '',
    recommendations: [],
    keyStrength: '',
    priorityDevelopment: '',
    finalVerdict: '',
    filesProcessed: 0,
    processingNotes: ''
  };
}

/**
 * Content analysis patterns for scoring
 */
const SCORING_PATTERNS = {
  // Cognitive Architecture indicators
  cognitiveArchitecture: {
    transformative: [
      /synthesiz(ed?|ing) (?:\d{2,}|\bten\b|\beleven\b|\btwelve\b|\bmultiple\b) documents?/i,
      /multi-?system integration/i,
      /complex workflow/i,
      /automated (?:entire|full|complete)/i
    ],
    high: [
      /significant cognitive load/i,
      /delegated (?:complex|multiple|significant)/i,
      /strategic use of ai/i
    ],
    moderate: [
      /used ai (?:to|for)/i,
      /created with ai/i,
      /generated (?:report|analysis|document)/i
    ]
  },

  // Prompt Proficiency indicators
  promptProficiency: {
    exceptional: [
      /role[:\s]+.+brief[:\s]+.+style[:\s]+.+format/i,
      /RBSF/i,
      /systematic prompt/i,
      /prompt iteration/i,
      /refined (?:my |the )?prompt/i
    ],
    strong: [
      /provided context/i,
      /specific instructions/i,
      /clear prompt/i
    ]
  },

  // Quality Assurance indicators
  qualityAssurance: {
    exceptional: [
      /exhaustive (?:review|validation|testing)/i,
      /error correction/i,
      /multiple rounds? of (?:review|validation)/i,
      /human (?:in the|in-the) loop/i
    ],
    strong: [
      /validated (?:output|results)/i,
      /checked (?:for accuracy|accuracy)/i,
      /reviewed (?:and corrected|for errors)/i
    ]
  },

  // Value Creation indicators
  valueCreation: {
    transformational: [
      /board[- ]level/i,
      /strategic (?:impact|value|decision)/i,
      /significant (?:time|cost) saving/i,
      /\d+%\s*(?:reduction|improvement|increase)/i,
      /\d+\s*hours?\s*saved/i
    ],
    strong: [
      /business impact/i,
      /improved (?:efficiency|productivity)/i,
      /stakeholder (?:value|benefit)/i
    ]
  },

  // Reflective Practice indicators
  reflectivePractice: {
    exceptional: [
      /profound (?:learning|insight)/i,
      /transformative learning/i,
      /changed (?:my |the )?approach/i
    ],
    strong: [
      /learned (?:that|how|to)/i,
      /realized/i,
      /insight/i,
      /reflection/i
    ]
  },

  // Innovation indicators
  innovation: {
    exceptional: [
      /novel (?:approach|solution|method)/i,
      /innovative/i,
      /first (?:time|ever)/i,
      /push(?:ed|ing) (?:the )?boundar/i
    ],
    moderate: [
      /creative/i,
      /new (?:way|approach|method)/i,
      /experiment(?:ed|ing)/i
    ]
  }
};

/**
 * Extract project metadata from content
 */
function extractMetadata(content, participantName) {
  const metadata = {
    projectTitle: '',
    cohort: ''
  };

  // Try to find project title
  const titlePatterns = [
    /project\s*(?:title)?[:\s]+["']?([^"'\n]+)["']?/i,
    /capstone[:\s]+["']?([^"'\n]+)["']?/i,
    /title[:\s]+["']?([^"'\n]+)["']?/i
  ];

  for (const pattern of titlePatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].length < 100) {
      metadata.projectTitle = match[1].trim();
      break;
    }
  }

  // Default title if not found
  if (!metadata.projectTitle) {
    metadata.projectTitle = `${participantName}'s Capstone Project`;
  }

  // Try to find cohort
  const cohortPatterns = [
    /cohort[:\s]+(\d+|[A-Za-z]+\s*\d*)/i,
    /group[:\s]+(\d+|[A-Za-z]+)/i
  ];

  for (const pattern of cohortPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      metadata.cohort = match[1].trim();
      break;
    }
  }

  return metadata;
}

/**
 * Extract project overview from content
 */
function extractProjectOverview(content) {
  // Look for overview, summary, or introduction sections
  const overviewPatterns = [
    /(?:project\s+)?overview[:\s]*\n+([\s\S]{100,800}?)(?:\n\n|\n[A-Z])/i,
    /(?:executive\s+)?summary[:\s]*\n+([\s\S]{100,800}?)(?:\n\n|\n[A-Z])/i,
    /introduction[:\s]*\n+([\s\S]{100,800}?)(?:\n\n|\n[A-Z])/i
  ];

  for (const pattern of overviewPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: use first 500 characters of content
  const cleanContent = content.replace(/[\n\r]+/g, ' ').trim();
  return cleanContent.substring(0, 500) + '...';
}

/**
 * Extract intentions and outcomes
 */
function extractIntentionsOutcomes(content) {
  let intentions = '';
  let outcomes = '';

  // Look for intentions/objectives
  const intentionPatterns = [
    /(?:objective|intention|aim|goal)s?[:\s]*\n+([\s\S]{100,600}?)(?:\n\n|\n[A-Z])/i,
    /what I (?:wanted|aimed|intended) to (?:achieve|do|accomplish)[:\s]*([\s\S]{50,400}?)(?:\n\n|\n[A-Z])/i
  ];

  for (const pattern of intentionPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      intentions = match[1].trim();
      break;
    }
  }

  // Look for outcomes/results
  const outcomePatterns = [
    /(?:outcome|result|achievement)s?[:\s]*\n+([\s\S]{100,600}?)(?:\n\n|\n[A-Z])/i,
    /what I (?:achieved|accomplished|delivered)[:\s]*([\s\S]{50,400}?)(?:\n\n|\n[A-Z])/i
  ];

  for (const pattern of outcomePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      outcomes = match[1].trim();
      break;
    }
  }

  // Defaults
  if (!intentions) {
    intentions = 'Intentions to be extracted from submission review.';
  }
  if (!outcomes) {
    outcomes = 'Outcomes to be assessed from submission evidence.';
  }

  return { intentions, outcomes };
}

/**
 * Score a category based on content analysis
 */
function scoreCategory(content, categoryName, patterns) {
  let score = 3.0; // Default to developing
  let evidence = [];

  const categoryPatterns = patterns[categoryName.toLowerCase().replace(/\s+/g, '')];
  if (!categoryPatterns) {
    return { score, evidence: 'Standard assessment applied.' };
  }

  // Check for exceptional indicators
  if (categoryPatterns.exceptional || categoryPatterns.transformative) {
    const exceptionalPatterns = categoryPatterns.exceptional || categoryPatterns.transformative;
    for (const pattern of exceptionalPatterns) {
      const match = content.match(pattern);
      if (match) {
        score = Math.min(score + 0.75, 5.0);
        evidence.push(`Strong indicator found: "${match[0]}"`);
      }
    }
  }

  // Check for transformational (if separate from exceptional)
  if (categoryPatterns.transformational) {
    for (const pattern of categoryPatterns.transformational) {
      const match = content.match(pattern);
      if (match) {
        score = Math.min(score + 0.5, 5.0);
        evidence.push(`Transformational indicator: "${match[0]}"`);
      }
    }
  }

  // Check for strong indicators
  if (categoryPatterns.strong || categoryPatterns.high) {
    const strongPatterns = categoryPatterns.strong || categoryPatterns.high;
    for (const pattern of strongPatterns) {
      const match = content.match(pattern);
      if (match) {
        score = Math.min(score + 0.25, 4.5);
        evidence.push(`Good indicator: "${match[0]}"`);
      }
    }
  }

  // Check for moderate indicators
  if (categoryPatterns.moderate) {
    for (const pattern of categoryPatterns.moderate) {
      const match = content.match(pattern);
      if (match) {
        score = Math.min(score + 0.1, 3.5);
      }
    }
  }

  return {
    score: Math.round(score * 100) / 100,
    evidence: evidence.length > 0 ? evidence.join('. ') : 'Standard assessment based on submission content.'
  };
}

/**
 * Analyze submission quality
 */
function analyzeSubmissionQuality(content, filesCount) {
  let score = 3.0;
  const evidence = [];

  // Check documentation completeness
  const contentLength = content.length;
  if (contentLength > 10000) {
    score += 0.5;
    evidence.push('Comprehensive documentation provided');
  } else if (contentLength > 5000) {
    score += 0.25;
    evidence.push('Good documentation length');
  } else if (contentLength < 2000) {
    score -= 0.5;
    evidence.push('Limited documentation provided');
  }

  // Check for multiple files
  if (filesCount > 5) {
    score += 0.5;
    evidence.push(`Multiple supporting documents (${filesCount} files)`);
  } else if (filesCount > 2) {
    score += 0.25;
    evidence.push(`Supporting documents provided (${filesCount} files)`);
  }

  // Check for structure indicators
  const structurePatterns = [
    /(?:section|chapter)\s*\d/i,
    /(?:appendix|annex)/i,
    /table of contents/i,
    /executive summary/i
  ];

  for (const pattern of structurePatterns) {
    if (pattern.test(content)) {
      score = Math.min(score + 0.15, 5.0);
    }
  }

  return {
    score: Math.round(Math.max(1, Math.min(5, score)) * 100) / 100,
    evidence: evidence.length > 0 ? evidence.join('. ') : 'Standard submission quality.'
  };
}

/**
 * Extract and score EBIA claims
 */
function extractEBIAClaims(content) {
  const claims = [];

  // Look for impact statements with numbers
  const impactPatterns = [
    /saved?\s+(\d+)\s*(?:hours?|days?|weeks?)/gi,
    /(\d+)%\s*(?:reduction|improvement|increase|faster|more efficient)/gi,
    /reduced\s+(?:time|cost|effort)\s+by\s+(\d+)/gi,
    /improved\s+(?:efficiency|productivity|quality)\s+(?:by\s+)?(\d+)/gi
  ];

  for (const pattern of impactPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const evidenceStrength = 4; // Quantified claim
      const impactMagnitude = parseInt(match[1]) > 50 ? 5 : parseInt(match[1]) > 20 ? 4 : 3;

      claims.push({
        description: match[0],
        evidenceStrength,
        impactMagnitude,
        score: EBIA.calculateClaimScore(evidenceStrength, impactMagnitude)
      });
    }
  }

  // Look for qualitative impact statements
  const qualitativePatterns = [
    /significant (?:impact|improvement|benefit)/i,
    /transformed (?:the |our )?(?:process|workflow|approach)/i,
    /stakeholder (?:satisfaction|approval|praise)/i,
    /board[- ]level (?:presentation|approval|recognition)/i
  ];

  for (const pattern of qualitativePatterns) {
    if (pattern.test(content)) {
      claims.push({
        description: content.match(pattern)[0],
        evidenceStrength: 3, // Qualitative claim
        impactMagnitude: 4,
        score: EBIA.calculateClaimScore(3, 4)
      });
    }
  }

  // Ensure at least one claim for calculation
  if (claims.length === 0) {
    claims.push({
      description: 'General project completion',
      evidenceStrength: 2,
      impactMagnitude: 2,
      score: EBIA.calculateClaimScore(2, 2)
    });
  }

  const aggregate = EBIA.calculateAggregate(claims);

  return { claims, aggregate };
}

/**
 * Generate scalability assessment
 */
function generateScalabilityAssessment(content, categoryScores) {
  const avgScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length;

  if (avgScore >= 4.5) {
    return 'This approach demonstrates high scalability potential. The systematic methodology and clear documentation suggest this could be replicated across multiple teams and use cases with minimal adaptation.';
  } else if (avgScore >= 3.5) {
    return 'The approach shows good scalability potential with some modifications. Key processes are documented and could be adapted for other contexts with moderate effort.';
  } else if (avgScore >= 2.5) {
    return 'Scalability is possible but would require significant documentation and process refinement before broader adoption.';
  } else {
    return 'The current approach has limited scalability. Further development of methodology and documentation would be needed before expansion.';
  }
}

/**
 * Generate operating model implications
 */
function generateOperatingModelImplications(content, categoryScores) {
  const implications = [];

  if (categoryScores['Cognitive Architecture'] >= 4.0) {
    implications.push('High cognitive delegation capability suggests potential for expanded AI integration in complex analytical work.');
  }

  if (categoryScores['Quality Assurance'] >= 4.0) {
    implications.push('Strong validation practices indicate readiness for AI deployment in quality-critical processes.');
  }

  if (categoryScores['Value Creation'] >= 4.0) {
    implications.push('Demonstrated value creation supports business case for further AI investment in this area.');
  }

  if (categoryScores['Prompt Proficiency'] >= 4.0) {
    implications.push('Advanced prompting skills suggest potential for internal training/mentoring role.');
  }

  if (implications.length === 0) {
    implications.push('The project provides a foundation for AI integration with opportunities for capability development in key areas.');
  }

  return implications.join(' ');
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(categoryScores, keyStrength, priorityDev) {
  const recommendations = [];

  // Always recommend continued practice
  recommendations.push('Continue to apply and refine AI-assisted approaches in daily work.');

  // Strength-based recommendation
  if (keyStrength.includes('Cognitive') || keyStrength.includes('Architecture')) {
    recommendations.push('Consider sharing complex task delegation strategies with colleagues through a shared prompt repository.');
  } else if (keyStrength.includes('Value') || keyStrength.includes('Creation')) {
    recommendations.push('Document and share value measurement approaches to help others quantify AI benefits.');
  } else if (keyStrength.includes('Quality') || keyStrength.includes('Assurance')) {
    recommendations.push('Help develop team validation frameworks based on demonstrated QA practices.');
  }

  // Development-based recommendation
  if (priorityDev.includes('Prompt') || priorityDev.includes('Proficiency')) {
    recommendations.push('Focus on implementing the Role-Brief-Style-Format prompt structure consistently.');
  } else if (priorityDev.includes('Reflective') || priorityDev.includes('Practice')) {
    recommendations.push('Establish a regular reflection practice to document learnings from each AI interaction.');
  } else if (priorityDev.includes('Innovation')) {
    recommendations.push('Experiment with applying AI to one new use case outside normal work scope.');
  }

  // Always include Human in the Loop
  recommendations.push('Maintain Human in the Loop principles in all AI-assisted workflows, ensuring appropriate oversight for decision-making.');

  return recommendations;
}

/**
 * Main evaluation function
 */
export function evaluateSubmission(participantName, content, filesProcessed = 1) {
  const evaluation = createEmptyEvaluation(participantName);
  evaluation.filesProcessed = filesProcessed;

  // Extract metadata
  const metadata = extractMetadata(content, participantName);
  evaluation.projectTitle = metadata.projectTitle;
  evaluation.cohort = metadata.cohort;

  // Extract content sections
  evaluation.projectOverview = extractProjectOverview(content);
  const { intentions, outcomes } = extractIntentionsOutcomes(content);
  evaluation.intentions = intentions;
  evaluation.outcomes = outcomes;

  // Score each category
  const categoryNames = [
    'Cognitive Architecture',
    'Prompt Proficiency',
    'Quality Assurance',
    'Value Creation',
    'Reflective Practice',
    'Submission Quality',
    'Innovation'
  ];

  const categoryMapping = {
    'Cognitive Architecture': 'cognitiveArchitecture',
    'Prompt Proficiency': 'promptProficiency',
    'Quality Assurance': 'qualityAssurance',
    'Value Creation': 'valueCreation',
    'Reflective Practice': 'reflectivePractice',
    'Innovation': 'innovation'
  };

  for (const catName of categoryNames) {
    if (catName === 'Submission Quality') {
      const result = analyzeSubmissionQuality(content, filesProcessed);
      evaluation.categoryScores[catName] = result.score;
      evaluation.categoryEvidence[catName] = result.evidence;
    } else {
      const patternKey = categoryMapping[catName];
      const result = scoreCategory(content, patternKey, SCORING_PATTERNS);
      evaluation.categoryScores[catName] = result.score;
      evaluation.categoryEvidence[catName] = result.evidence;
    }
  }

  // Calculate aggregate scores
  evaluation.fullScore = calculateFullAssessmentScore(evaluation.categoryScores);
  evaluation.fullBand = getPerformanceBand(evaluation.fullScore).label;

  evaluation.quadrantScore = calculateQuadrantScore(evaluation.categoryScores);
  evaluation.quadrantBand = getPerformanceBand(evaluation.quadrantScore).label;

  // EBIA assessment
  evaluation.ebiaAssessment = extractEBIAClaims(content);

  // Identify strengths and development areas
  const sortedCategories = Object.entries(evaluation.categoryScores)
    .sort((a, b) => b[1] - a[1]);

  evaluation.keyStrength = sortedCategories[0][0];
  evaluation.priorityDevelopment = sortedCategories[sortedCategories.length - 1][0];

  // Generate assessments
  evaluation.scalabilityAssessment = generateScalabilityAssessment(content, evaluation.categoryScores);
  evaluation.operatingModelImplications = generateOperatingModelImplications(content, evaluation.categoryScores);
  evaluation.recommendations = generateRecommendations(
    evaluation.categoryScores,
    evaluation.keyStrength,
    evaluation.priorityDevelopment
  );

  // Final verdict
  evaluation.finalVerdict = generateFinalVerdict(evaluation);

  return evaluation;
}

/**
 * Generate final verdict paragraph
 */
function generateFinalVerdict(evaluation) {
  const { participantName, fullScore, fullBand, keyStrength, priorityDevelopment, projectTitle } = evaluation;

  let verdict = `${participantName} has demonstrated ${fullBand.toLowerCase()} performance in their capstone project "${projectTitle}", achieving an overall score of ${fullScore.toFixed(2)}/5.00. `;

  if (fullBand === 'EXCEPTIONAL') {
    verdict += `This submission exemplifies outstanding AI capability development, particularly in ${keyStrength}. The work shows transformational potential and provides an excellent model for peer learning.`;
  } else if (fullBand === 'STRONG') {
    verdict += `This submission demonstrates solid AI capability across all assessed dimensions, with particular strength in ${keyStrength}. With continued focus on ${priorityDevelopment}, there is clear potential for exceptional performance.`;
  } else if (fullBand === 'DEVELOPING') {
    verdict += `This submission shows emerging AI capability with a good foundation to build upon. Further development in ${priorityDevelopment}, building on the strength shown in ${keyStrength}, will support continued growth.`;
  } else if (fullBand === 'BASIC') {
    verdict += `This submission demonstrates foundational AI engagement. Focused development in ${priorityDevelopment}, supported by the competence shown in ${keyStrength}, will help advance capability.`;
  } else {
    verdict += `This submission indicates early-stage AI engagement. Structured support and practice, particularly in ${priorityDevelopment}, will be beneficial for capability development.`;
  }

  return verdict;
}

export default {
  evaluateSubmission,
  createEmptyEvaluation
};
