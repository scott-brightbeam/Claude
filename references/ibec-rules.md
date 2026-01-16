# Ibec AI Programme Compliance Rules

## Overview

These rules ensure consistency, fairness, and compliance across all capstone evaluation reports. All generated reports MUST adhere to these constraints.

---

## PROHIBITED Content

### Never Include:

1. **Named Colleagues in Peer Learning**
   - ❌ "We recommend pairing with John Smith for peer learning"
   - ✅ "Colleague to be identified following full cohort analysis"

2. **Cohort Rankings or Comparisons**
   - ❌ "Ranked 3rd out of 150 participants"
   - ❌ "Performed better than 80% of cohort"
   - ❌ "Compared to other participants..."
   - ✅ Focus only on individual performance

3. **"Central Prompt Repository"**
   - ❌ "Contribute to the central prompt repository"
   - ✅ "Share prompts through a shared prompt repository"

4. **Copilot Recommendations**
   - ❌ "Consider using GitHub Copilot"
   - ❌ "Explore Copilot for code assistance"

5. **1:1 Coaching Recommendations**
   - ❌ "Recommend 1:1 coaching sessions"
   - ❌ "One-to-one coaching would benefit..."

6. **Change Champions Suggestions**
   - ❌ "Could serve as a change champion"
   - ❌ "Nominate as AI change champion"

7. **Non-Google Documentation References**
   - ❌ "Refer to Anthropic documentation"
   - ❌ "OpenAI's best practices guide"
   - ✅ "Google's AI documentation provides..."

8. **"Document First" Approach**
   - ❌ "Adopt a document-first approach"

---

## REQUIRED Content

### Always Include:

1. **Framework Version Reference**
   - Location: Header section or methodology
   - Text: "Framework v4.0" or "Evaluation Framework v4.0"

2. **Footer Disclaimer**
   - Location: Every page footer
   - Text: "Prepared with AI assistance and reviewed by Ibec staff"
   - Style: Centered, italic, gray

3. **Human in the Loop Principle**
   - Location: Quality Assurance section and/or Recommendations
   - Must reference human oversight requirement
   - Example: "Maintain Human in the Loop principles in all AI-assisted workflows"

4. **RBSF Prompt Structure Mention**
   - Location: Prompt Proficiency section
   - Reference: "Role - Brief - Style - Format" framework

5. **Generic Peer Learning Text**
   - Location: Peer Learning section
   - Text: "Colleague to be identified following full cohort analysis"

---

## Compliance Checklist

Before finalizing any report, verify:

| # | Requirement | Critical |
|---|-------------|----------|
| 1 | No named colleagues in peer learning recommendations | ✓ |
| 2 | No cohort rankings or comparisons | ✓ |
| 3 | "Shared prompt repository" not "central" | |
| 4 | Role - Brief - Style - Format referenced | |
| 5 | Only Google documentation referenced | ✓ |
| 6 | No Copilot recommendations | ✓ |
| 7 | No 1:1 coaching recommendations | ✓ |
| 8 | No change champions suggestions | ✓ |
| 9 | Human in the Loop principle noted | |
| 10 | Footer disclaimer included | ✓ |
| 11 | Framework v4.0 referenced | |

Items marked ✓ are critical and must pass.

---

## Auto-Correction Rules

The system should automatically correct:

| Find | Replace With |
|------|--------------|
| central prompt repository | shared prompt repository |
| Anthropic documentation | Google documentation |
| OpenAI documentation | Google documentation |

---

## Branding Guidelines

### Colors
- **Primary:** #F47920 (Orange)
- **Secondary:** #333333 (Dark Gray)
- **Text:** #000000 (Black)
- **Muted Text:** #666666 (Gray)
- **Borders:** #CCCCCC (Light Gray)

### Performance Band Colors
- **EXCEPTIONAL:** #2E7D32 (Dark Green)
- **STRONG:** #4CAF50 (Light Green)
- **DEVELOPING:** #FFC107 (Yellow)
- **BASIC:** #FF9800 (Orange)
- **INSUFFICIENT:** #F44336 (Red)

### Typography
- **Font Family:** Calibri
- **Headings:** Bold
- **Body:** Regular, 11pt
- **Tables:** 10pt

### Document Format
- **Page Size:** A4
- **Margins:** 1 inch all sides

---

## Validation Process

1. **Pre-Generation:** Validate input data completeness
2. **Content Generation:** Apply auto-correction rules
3. **Post-Generation:** Run compliance checklist
4. **Output:** Flag any unresolved issues in processing log

---

## Version Control

- Current Version: 1.0
- Last Updated: January 2025
- Approved By: Ibec AI Programme Team
