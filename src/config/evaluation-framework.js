/**
 * Ibec AI Programme Capstone Evaluation Framework v4.0
 *
 * Seven-category assessment framework for evaluating AI capability demonstrations
 */

export const FRAMEWORK_VERSION = '4.0';

/**
 * Performance Band Thresholds
 */
export const PERFORMANCE_BANDS = {
  EXCEPTIONAL: { min: 4.50, max: 5.00, label: 'EXCEPTIONAL', color: '#2E7D32' },
  STRONG: { min: 3.50, max: 4.49, label: 'STRONG', color: '#4CAF50' },
  DEVELOPING: { min: 2.50, max: 3.49, label: 'DEVELOPING', color: '#FFC107' },
  BASIC: { min: 1.50, max: 2.49, label: 'BASIC', color: '#FF9800' },
  INSUFFICIENT: { min: 1.00, max: 1.49, label: 'INSUFFICIENT', color: '#F44336' }
};

/**
 * Get performance band for a given score
 */
export function getPerformanceBand(score) {
  if (score >= 4.50) return PERFORMANCE_BANDS.EXCEPTIONAL;
  if (score >= 3.50) return PERFORMANCE_BANDS.STRONG;
  if (score >= 2.50) return PERFORMANCE_BANDS.DEVELOPING;
  if (score >= 1.50) return PERFORMANCE_BANDS.BASIC;
  return PERFORMANCE_BANDS.INSUFFICIENT;
}

/**
 * Evaluation Categories with weights and sub-criteria
 */
export const EVALUATION_CATEGORIES = {
  COGNITIVE_ARCHITECTURE: {
    id: 1,
    name: 'Cognitive Architecture',
    shortName: 'Cat 1: Cognitive Architecture',
    weight: 0.175,
    description: 'What they delegated - assessment of task delegation and AI utilization',
    subCriteria: [
      {
        id: 'task_complexity',
        name: 'Task Complexity',
        weight: 0.25,
        description: 'Complexity of tasks delegated to AI',
        rubric: {
          5: 'Transformative complexity - 11+ document synthesis, multi-system integration',
          4: 'High complexity - significant cognitive load transferred to AI',
          3: 'Moderate complexity - standard business tasks delegated',
          2: 'Basic complexity - simple, routine tasks only',
          1: 'Minimal - trivial tasks with little cognitive delegation'
        }
      },
      {
        id: 'delegation_strategy',
        name: 'Delegation Strategy',
        weight: 0.25,
        description: 'Strategic approach to human-AI task division',
        rubric: {
          5: 'Exceptional strategic division with clear rationale for each delegation',
          4: 'Strong strategy with thoughtful task allocation',
          3: 'Reasonable delegation with some strategic thinking',
          2: 'Ad-hoc delegation without clear strategy',
          1: 'No discernible delegation strategy'
        }
      },
      {
        id: 'scope_ambition',
        name: 'Scope & Ambition',
        weight: 0.25,
        description: 'Breadth and ambition of the project scope',
        rubric: {
          5: 'Transformational scope affecting multiple business areas',
          4: 'Ambitious scope with significant organizational impact',
          3: 'Reasonable scope with clear boundaries',
          2: 'Limited scope with minimal stretch',
          1: 'Trivial scope with no ambition'
        }
      },
      {
        id: 'ai_capability_utilization',
        name: 'AI Capability Utilization',
        weight: 0.25,
        description: 'Effective use of AI capabilities',
        rubric: {
          5: 'Full utilization of multiple AI capabilities in novel ways',
          4: 'Strong utilization across several AI capabilities',
          3: 'Moderate utilization of core AI capabilities',
          2: 'Basic utilization of limited AI features',
          1: 'Minimal or ineffective AI utilization'
        }
      }
    ]
  },

  PROMPT_PROFICIENCY: {
    id: 2,
    name: 'Prompt Proficiency',
    shortName: 'Cat 2: Prompt Proficiency',
    weight: 0.175,
    description: 'How they communicated - prompt engineering quality (infer from output quality if prompts undocumented)',
    subCriteria: [
      {
        id: 'prompt_structure',
        name: 'Prompt Structure (Role-Brief-Style-Format)',
        weight: 0.30,
        description: 'Use of RBSF framework in prompts',
        rubric: {
          5: 'Consistent RBSF structure with sophisticated variations',
          4: 'Strong RBSF implementation with minor gaps',
          3: 'Basic RBSF structure present',
          2: 'Partial RBSF elements only',
          1: 'No structured prompt approach'
        }
      },
      {
        id: 'context_provision',
        name: 'Context Provision',
        weight: 0.25,
        description: 'Quality and relevance of context provided',
        rubric: {
          5: 'Exceptional context with all necessary background and constraints',
          4: 'Strong context provision with relevant details',
          3: 'Adequate context for task completion',
          2: 'Insufficient context affecting output quality',
          1: 'No meaningful context provided'
        }
      },
      {
        id: 'iteration_refinement',
        name: 'Iteration & Refinement',
        weight: 0.25,
        description: 'Evidence of prompt refinement and iteration',
        rubric: {
          5: 'Systematic iteration with documented improvements',
          4: 'Clear evidence of thoughtful refinement',
          3: 'Some iteration demonstrated',
          2: 'Minimal refinement attempted',
          1: 'No iteration or refinement'
        }
      },
      {
        id: 'output_quality_inference',
        name: 'Output Quality (Inferred Proficiency)',
        weight: 0.20,
        description: 'Prompt proficiency inferred from output quality when prompts undocumented',
        rubric: {
          5: 'Outputs suggest masterful prompting - exceptional clarity and precision',
          4: 'Outputs suggest strong prompting skills',
          3: 'Outputs suggest adequate prompting',
          2: 'Outputs suggest basic prompting skills',
          1: 'Outputs suggest poor prompting or none'
        }
      }
    ]
  },

  QUALITY_ASSURANCE: {
    id: 3,
    name: 'Quality Assurance',
    shortName: 'Cat 3: Quality Assurance',
    weight: 0.175,
    description: 'How they validated - verification and quality control processes',
    subCriteria: [
      {
        id: 'validation_process',
        name: 'Validation Process',
        weight: 0.30,
        description: 'Systematic approach to validating AI outputs',
        rubric: {
          5: 'Exhaustive multi-stage validation with documented error correction',
          4: 'Strong validation process with clear checkpoints',
          3: 'Adequate validation with basic checks',
          2: 'Minimal validation performed',
          1: 'No validation process evident'
        }
      },
      {
        id: 'error_identification',
        name: 'Error Identification',
        weight: 0.25,
        description: 'Ability to identify and document AI errors',
        rubric: {
          5: 'Comprehensive error identification with root cause analysis',
          4: 'Strong error detection and documentation',
          3: 'Basic error identification',
          2: 'Limited error awareness',
          1: 'No error identification'
        }
      },
      {
        id: 'correction_iteration',
        name: 'Correction & Iteration',
        weight: 0.25,
        description: 'Process for correcting identified errors',
        rubric: {
          5: 'Systematic correction process with learning loop',
          4: 'Effective correction with some process documentation',
          3: 'Basic correction attempts',
          2: 'Minimal correction effort',
          1: 'No corrections made'
        }
      },
      {
        id: 'human_in_loop',
        name: 'Human in the Loop Principle',
        weight: 0.20,
        description: 'Application of human oversight principle',
        rubric: {
          5: 'Exemplary human oversight with clear decision points',
          4: 'Strong human-in-the-loop implementation',
          3: 'Adequate human oversight',
          2: 'Limited human oversight',
          1: 'No human oversight evident'
        }
      }
    ]
  },

  VALUE_CREATION: {
    id: 4,
    name: 'Value Creation',
    shortName: 'Cat 4: Value Creation',
    weight: 0.175,
    description: 'Business impact - measurable value delivered',
    subCriteria: [
      {
        id: 'business_impact',
        name: 'Business Impact',
        weight: 0.30,
        description: 'Tangible business value created',
        rubric: {
          5: 'Transformational impact - board-level significance, strategic value',
          4: 'Significant impact - measurable organizational benefit',
          3: 'Moderate impact - clear team/department value',
          2: 'Limited impact - minor improvements',
          1: 'No measurable impact'
        }
      },
      {
        id: 'efficiency_gains',
        name: 'Efficiency Gains',
        weight: 0.25,
        description: 'Time/resource savings achieved',
        rubric: {
          5: 'Exceptional efficiency gains with quantified savings',
          4: 'Strong efficiency improvements documented',
          3: 'Moderate efficiency gains',
          2: 'Minor efficiency improvements',
          1: 'No efficiency gains demonstrated'
        }
      },
      {
        id: 'stakeholder_value',
        name: 'Stakeholder Value',
        weight: 0.25,
        description: 'Value delivered to stakeholders',
        rubric: {
          5: 'Multiple stakeholder groups significantly benefited',
          4: 'Clear stakeholder value with evidence',
          3: 'Some stakeholder benefit demonstrated',
          2: 'Limited stakeholder consideration',
          1: 'No stakeholder value evident'
        }
      },
      {
        id: 'sustainability',
        name: 'Sustainability',
        weight: 0.20,
        description: 'Long-term sustainability of value created',
        rubric: {
          5: 'Highly sustainable with replication potential',
          4: 'Sustainable with clear maintenance path',
          3: 'Reasonably sustainable',
          2: 'Limited sustainability',
          1: 'One-time value only'
        }
      }
    ]
  },

  REFLECTIVE_PRACTICE: {
    id: 5,
    name: 'Reflective Practice',
    shortName: 'Cat 5: Reflective Practice',
    weight: 0.125,
    description: 'Learning quality - depth of reflection and learning',
    subCriteria: [
      {
        id: 'learning_depth',
        name: 'Learning Depth',
        weight: 0.35,
        description: 'Depth of learning demonstrated',
        rubric: {
          5: 'Profound learning with transferable insights',
          4: 'Deep learning with clear personal growth',
          3: 'Adequate learning demonstrated',
          2: 'Surface-level learning only',
          1: 'No learning evident'
        }
      },
      {
        id: 'self_awareness',
        name: 'Self-Awareness',
        weight: 0.30,
        description: 'Awareness of own strengths and development areas',
        rubric: {
          5: 'Exceptional self-awareness with honest assessment',
          4: 'Strong self-awareness demonstrated',
          3: 'Adequate self-reflection',
          2: 'Limited self-awareness',
          1: 'No self-reflection'
        }
      },
      {
        id: 'future_application',
        name: 'Future Application',
        weight: 0.35,
        description: 'Plans for applying learning in future',
        rubric: {
          5: 'Clear, actionable plans for future AI integration',
          4: 'Strong future application ideas',
          3: 'Some future plans outlined',
          2: 'Vague future intentions',
          1: 'No future application considered'
        }
      }
    ]
  },

  SUBMISSION_QUALITY: {
    id: 6,
    name: 'Submission Quality',
    shortName: 'Cat 6: Submission Quality',
    weight: 0.05,
    description: 'Documentation completeness - quality of submission materials',
    subCriteria: [
      {
        id: 'documentation_completeness',
        name: 'Documentation Completeness',
        weight: 0.35,
        description: 'Completeness of required documentation',
        rubric: {
          5: 'All required elements plus valuable extras',
          4: 'All required elements present',
          3: 'Most required elements present',
          2: 'Several elements missing',
          1: 'Major gaps in documentation'
        }
      },
      {
        id: 'clarity_organization',
        name: 'Clarity & Organization',
        weight: 0.35,
        description: 'Clarity and logical organization',
        rubric: {
          5: 'Exceptionally clear and well-organized',
          4: 'Clear and logically organized',
          3: 'Reasonably clear organization',
          2: 'Some organizational issues',
          1: 'Poorly organized or unclear'
        }
      },
      {
        id: 'evidence_documentation',
        name: 'Evidence Documentation',
        weight: 0.30,
        description: 'Quality of evidence provided (separate from prompt proficiency)',
        rubric: {
          5: 'Comprehensive evidence with clear traceability',
          4: 'Strong evidence documentation',
          3: 'Adequate evidence provided',
          2: 'Limited evidence',
          1: 'No supporting evidence'
        }
      }
    ]
  },

  INNOVATION: {
    id: 7,
    name: 'Innovation',
    shortName: 'Cat 7: Innovation',
    weight: 0.125,
    description: 'Boundary-pushing - creativity and novel approaches',
    subCriteria: [
      {
        id: 'novelty',
        name: 'Novelty',
        weight: 0.35,
        description: 'Originality of approach or application',
        rubric: {
          5: 'Highly novel approach with unique insights',
          4: 'Creative approach with original elements',
          3: 'Some novel aspects',
          2: 'Largely conventional approach',
          1: 'No novelty demonstrated'
        }
      },
      {
        id: 'boundary_pushing',
        name: 'Boundary Pushing',
        weight: 0.35,
        description: 'Willingness to push beyond comfort zone',
        rubric: {
          5: 'Significant boundary pushing with calculated risks',
          4: 'Clear boundary pushing evident',
          3: 'Some stretching beyond comfort zone',
          2: 'Stayed within safe boundaries',
          1: 'No boundary pushing'
        }
      },
      {
        id: 'creative_problem_solving',
        name: 'Creative Problem Solving',
        weight: 0.30,
        description: 'Creative approaches to challenges',
        rubric: {
          5: 'Exceptional creative solutions to complex problems',
          4: 'Creative problem-solving demonstrated',
          3: 'Some creative approaches',
          2: 'Conventional problem-solving only',
          1: 'No creative approaches'
        }
      }
    ]
  }
};

/**
 * Calculate category score from sub-criteria scores
 * @param {Object} subScores - Object with sub-criteria IDs as keys and scores (1-5) as values
 * @param {Object} category - Category definition from EVALUATION_CATEGORIES
 * @returns {number} Weighted category score (1-5)
 */
export function calculateCategoryScore(subScores, category) {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const criterion of category.subCriteria) {
    const score = subScores[criterion.id];
    if (score !== undefined && score !== null) {
      weightedSum += score * criterion.weight;
      totalWeight += criterion.weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight * (totalWeight / 1) : 0;
}

/**
 * Calculate full assessment score from all category scores
 * @param {Object} categoryScores - Object with category names as keys and scores as values
 * @returns {number} Weighted full assessment score (1-5)
 */
export function calculateFullAssessmentScore(categoryScores) {
  const categories = Object.values(EVALUATION_CATEGORIES);
  let weightedSum = 0;

  for (const category of categories) {
    const score = categoryScores[category.name];
    if (score !== undefined && score !== null) {
      weightedSum += score * category.weight;
    }
  }

  return weightedSum;
}

/**
 * Calculate quadrant score (first four categories only)
 * @param {Object} categoryScores - Object with category names as keys and scores as values
 * @returns {number} Quadrant score (1-5)
 */
export function calculateQuadrantScore(categoryScores) {
  const quadrantCategories = [
    'Cognitive Architecture',
    'Prompt Proficiency',
    'Quality Assurance',
    'Value Creation'
  ];

  let sum = 0;
  let count = 0;

  for (const catName of quadrantCategories) {
    const score = categoryScores[catName];
    if (score !== undefined && score !== null) {
      sum += score;
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

/**
 * EBIA (Evidence-Based Impact Assessment) calculation
 */
export const EBIA = {
  /**
   * Calculate individual claim score
   * @param {number} evidenceStrength - 1-5 rating of evidence strength
   * @param {number} impactMagnitude - 1-5 rating of impact magnitude
   * @returns {number} Claim score (4-100)
   */
  calculateClaimScore(evidenceStrength, impactMagnitude) {
    return evidenceStrength * impactMagnitude * 4;
  },

  /**
   * Calculate aggregate EBIA score from multiple claims
   * @param {Array} claims - Array of {evidenceStrength, impactMagnitude} objects
   * @returns {number} Average EBIA score
   */
  calculateAggregate(claims) {
    if (!claims || claims.length === 0) return 0;

    const scores = claims.map(claim =>
      this.calculateClaimScore(claim.evidenceStrength, claim.impactMagnitude)
    );

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  },

  /**
   * Get EBIA band from aggregate score
   * @param {number} score - EBIA aggregate score
   * @returns {Object} Band information
   */
  getBand(score) {
    if (score >= 80) return { label: 'EXCEPTIONAL', color: '#2E7D32' };
    if (score >= 60) return { label: 'STRONG', color: '#4CAF50' };
    if (score >= 40) return { label: 'DEVELOPING', color: '#FFC107' };
    if (score >= 20) return { label: 'BASIC', color: '#FF9800' };
    return { label: 'INSUFFICIENT', color: '#F44336' };
  }
};

export default {
  FRAMEWORK_VERSION,
  PERFORMANCE_BANDS,
  EVALUATION_CATEGORIES,
  EBIA,
  getPerformanceBand,
  calculateCategoryScore,
  calculateFullAssessmentScore,
  calculateQuadrantScore
};
