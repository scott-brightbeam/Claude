/**
 * Ibec AI Programme Compliance Rules
 *
 * Critical constraints and requirements for evaluation reports
 */

export const IBEC_RULES = {
  // Branding
  BRAND_COLOR: '#F47920', // Orange
  BRAND_COLOR_SECONDARY: '#333333',
  FONT_FAMILY: 'Calibri',

  // Document settings
  PAGE_SIZE: 'A4',
  MARGIN_INCHES: 1,

  // Required footer
  FOOTER_TEXT: 'Prepared with AI assistance and reviewed by Ibec staff',

  // Framework reference
  FRAMEWORK_VERSION: 'v4.0',

  // Prompt structure
  PROMPT_FRAMEWORK: 'Role - Brief - Style - Format',
};

/**
 * Terms that MUST NOT appear in reports
 */
export const PROHIBITED_TERMS = [
  {
    term: 'central prompt repository',
    replacement: 'shared prompt repository',
    reason: 'Use "shared" not "central" for prompt repository recommendations'
  },
  {
    term: 'Copilot',
    replacement: null,
    reason: 'No Copilot recommendations allowed'
  },
  {
    term: '1:1 coaching',
    replacement: null,
    reason: 'No 1:1 coaching recommendations allowed'
  },
  {
    term: 'one-to-one coaching',
    replacement: null,
    reason: 'No 1:1 coaching recommendations allowed'
  },
  {
    term: 'change champion',
    replacement: null,
    reason: 'No change champions suggestions allowed'
  },
  {
    term: 'Anthropic documentation',
    replacement: 'Google documentation',
    reason: 'Only Google documentation should be referenced'
  },
  {
    term: 'OpenAI documentation',
    replacement: 'Google documentation',
    reason: 'Only Google documentation should be referenced'
  },
  {
    term: 'document first',
    replacement: null,
    reason: 'No "document first" approach recommendations'
  }
];

/**
 * Content rules for peer learning recommendations
 */
export const PEER_LEARNING_RULES = {
  // Never include specific colleague names
  prohibitNamedColleagues: true,
  // Generic placeholder text for peer learning
  genericPeerText: 'Colleague to be identified following full cohort analysis',
  // No cohort rankings or comparisons
  prohibitRankings: true
};

/**
 * Required elements that MUST appear in reports
 */
export const REQUIRED_ELEMENTS = [
  {
    element: 'Framework version reference',
    checkPattern: /framework.*v4\.0|v4\.0.*framework/i,
    location: 'Header or methodology section'
  },
  {
    element: 'Footer disclaimer',
    checkPattern: /Prepared with AI assistance and reviewed by Ibec staff/,
    location: 'Document footer'
  },
  {
    element: 'Human in the Loop principle',
    checkPattern: /human.*(in|the).*loop|human oversight/i,
    location: 'Quality Assurance section or recommendations'
  },
  {
    element: 'RBSF prompt structure mention',
    checkPattern: /Role.*Brief.*Style.*Format|RBSF/i,
    location: 'Prompt Proficiency section'
  }
];

/**
 * Validate report content against Ibec rules
 * @param {string} content - Full report text content
 * @returns {Object} Validation result with issues array
 */
export function validateReportContent(content) {
  const issues = [];
  const warnings = [];

  // Check for prohibited terms
  for (const rule of PROHIBITED_TERMS) {
    const regex = new RegExp(rule.term, 'gi');
    if (regex.test(content)) {
      if (rule.replacement) {
        warnings.push({
          type: 'prohibited_term',
          term: rule.term,
          suggestion: `Replace with: "${rule.replacement}"`,
          reason: rule.reason
        });
      } else {
        issues.push({
          type: 'prohibited_term',
          term: rule.term,
          reason: rule.reason
        });
      }
    }
  }

  // Check for required elements
  for (const req of REQUIRED_ELEMENTS) {
    if (!req.checkPattern.test(content)) {
      issues.push({
        type: 'missing_required',
        element: req.element,
        location: req.location
      });
    }
  }

  // Check for named colleagues (simple name pattern detection)
  const namePatterns = [
    /peer learning with (?!Colleague)[A-Z][a-z]+ [A-Z][a-z]+/g,
    /recommend (?!Colleague)[A-Z][a-z]+ [A-Z][a-z]+ for/g,
    /connect with (?!Colleague)[A-Z][a-z]+ [A-Z][a-z]+/g
  ];

  for (const pattern of namePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'named_colleague',
        matches: matches,
        reason: 'Specific colleague names should not appear in peer learning recommendations'
      });
    }
  }

  // Check for cohort rankings
  const rankingPatterns = [
    /ranked? #?\d+ (in|of|out of)/gi,
    /top \d+ (in|of) (the )?cohort/gi,
    /\d+(st|nd|rd|th) (place|position|ranking)/gi,
    /cohort comparison/gi,
    /compared to (other )?participants/gi
  ];

  for (const pattern of rankingPatterns) {
    if (pattern.test(content)) {
      issues.push({
        type: 'cohort_ranking',
        reason: 'No cohort rankings or comparisons allowed'
      });
      break;
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    summary: issues.length === 0
      ? 'Report passes all compliance checks'
      : `Found ${issues.length} compliance issue(s) and ${warnings.length} warning(s)`
  };
}

/**
 * Auto-fix common compliance issues in text
 * @param {string} content - Text content to fix
 * @returns {string} Fixed content
 */
export function autoFixContent(content) {
  let fixed = content;

  for (const rule of PROHIBITED_TERMS) {
    if (rule.replacement) {
      const regex = new RegExp(rule.term, 'gi');
      fixed = fixed.replace(regex, rule.replacement);
    }
  }

  return fixed;
}

/**
 * Compliance checklist for manual review
 */
export const COMPLIANCE_CHECKLIST = [
  { id: 1, item: 'No named colleagues in peer learning recommendations', critical: true },
  { id: 2, item: 'No cohort rankings or comparisons', critical: true },
  { id: 3, item: '"Shared prompt repository" not "central"', critical: false },
  { id: 4, item: 'Role - Brief - Style - Format for prompts', critical: false },
  { id: 5, item: 'Only Google documentation referenced', critical: true },
  { id: 6, item: 'No Copilot recommendations', critical: true },
  { id: 7, item: 'No 1:1 coaching recommendations', critical: true },
  { id: 8, item: 'No change champions suggestions', critical: true },
  { id: 9, item: 'Human in the Loop principle noted', critical: false },
  { id: 10, item: 'Footer included', critical: true },
  { id: 11, item: 'Framework v4.0 referenced', critical: false }
];

export default {
  IBEC_RULES,
  PROHIBITED_TERMS,
  PEER_LEARNING_RULES,
  REQUIRED_ELEMENTS,
  COMPLIANCE_CHECKLIST,
  validateReportContent,
  autoFixContent
};
