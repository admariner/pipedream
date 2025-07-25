import {
  COMPLEXITY_OPTIONS,
  OWASP_OPTIONS,
  PRIORITY_OPTIONS,
  SCORING_SYSTEM_OPTIONS,
  SEVERITY_ONLY_SEVERITY_OPTIONS,
  SEVERITY_OPTIONS,
} from "../../common/constants.mjs";
import { parseObject } from "../../common/utils.mjs";
import securityReporter from "../../security_reporter.app.mjs";

export default {
  key: "security_reporter-create-finding",
  name: "Create Security Finding",
  description: "Creates a new security finding. [See the documentation](https://trial3.securityreporter.app/api-documentation)",
  version: "0.1.0",
  type: "action",
  props: {
    securityReporter,
    assessmentId: {
      propDefinition: [
        securityReporter,
        "assessmentId",
      ],
    },
    title: {
      type: "string",
      label: "Title",
      description: "Title of the finding. Must not be greater than 191 characters.",
    },
    targets: {
      propDefinition: [
        securityReporter,
        "targets",
        ({ assessmentId }) => ({
          assessmentId,
        }),
      ],
    },
    assessmentSectionId: {
      propDefinition: [
        securityReporter,
        "assessmentSectionId",
        ({ assessmentId }) => ({
          assessmentId,
        }),
      ],
      reloadProps: true,
    },
    isVulnerability: {
      type: "boolean",
      label: "Is Vulnerability",
      description: "Whether the finding is for a vulnerability (and has associated severity metrics).",
      reloadProps: true,
    },
    foundAt: {
      type: "string",
      label: "Found At",
      description: "The date when the finding was found. Format: `YYYY-MM-DDTHH:MM:SS`.",
      optional: true,
    },
    priority: {
      type: "string",
      label: "Priority",
      description: "How urgent resolving this finding is. Must be a valid priority.",
      options: PRIORITY_OPTIONS,
      optional: true,
    },
    complexity: {
      type: "string",
      label: "Complexity",
      description: "How complex resolving this finding is. Must be a valid complexity.",
      options: COMPLEXITY_OPTIONS,
      optional: true,
    },
    action: {
      type: "string",
      label: "Action",
      description: "The recommended action (under 500 characters) to resolve this finding. **Example: Update ...**",
      optional: true,
    },
    description: {
      type: "string",
      label: "Description",
      description: "The description of the finding. **Example: There is ...**",
    },
    risk: {
      type: "string",
      label: "Risk",
      description: "The risk associated with the finding. **Example: A hacker could ...**",
      optional: true,
    },
    recommendation: {
      type: "string",
      label: "Recommendation",
      description: "The recommendation for the finding. **Example: Update ...**",
      optional: true,
    },
    proof: {
      type: "string",
      label: "Proof",
      description: "The proof for the finding. **Example: See attached ...**",
      optional: true,
    },
    references: {
      type: "string",
      label: "References",
      description: "The references for the finding. **Example: - https://owasp.org/Top10/A03_2021-Injection/`\n - https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/**",
      optional: true,
    },
    draftDocuments: {
      type: "string[]",
      label: "Draft Documents",
      description: "Document IDs of uploaded draft documents.",
      optional: true,
    },
    draftDocumentsFile: {
      type: "string[]",
      label: "Draft Document File Paths or URLs",
      description: "One or more files to upload. For each entry, provide either a file URL or a path to a file in the `/tmp` directory (for example, `/tmp/myFile.txt`)",
      optional: true,
    },
    resolvers: {
      propDefinition: [
        securityReporter,
        "resolvers",
        ({ assessmentId }) => ({
          assessmentId,
        }),
      ],
      optional: true,
    },
    userGroups: {
      propDefinition: [
        securityReporter,
        "userGroups",
        ({ assessmentId }) => ({
          assessmentId,
        }),
      ],
      optional: true,
    },
    classifications: {
      type: "string[]",
      label: "Classifications",
      description: "An array with classifications by classification system. You can use any combination of CWE, CAPEC or VRT classifications. Note that classifications are ignored if their system is not set in the assessment.",
      optional: true,
    },
    SMScoringSystem: {
      type: "string",
      label: "Severity Metrics Scoring System",
      description: "The scoring system you want to use. [See the documentation](https://trial3.securityreporter.app/api-documentation#scoring-systems) for further information.",
      options: SCORING_SYSTEM_OPTIONS,
      reloadProps: true,
    },
  },
  async additionalProps() {
    const props = {
      severity: {
        type: "string",
        label: "Severity",
        description: "The severity of the finding. Determined from severity metrics otherwise. Must be a valid severity.",
        options: SEVERITY_OPTIONS,
        optional: !this.isVulnerability,
      },
    };
    switch (this.SMScoringSystem) {
    case "owasp":
      props.severityMetricsImpact = {
        type: "string",
        label: "Severity Metrics Impact",
        description: "The impact metric.",
        options: OWASP_OPTIONS,
      };
      props.severityMetricsLikelihood = {
        type: "string",
        label: "Severity Metrics Likelihood",
        description: "The likelihood metric.",
        options: OWASP_OPTIONS,
      };
      break;
    case "cvss_v3_1":
      props.cvssString = {
        type: "string",
        label: "Severity Metrics CVSS String",
        description: "The Common Vulnerability Scoring System uses a combination of eight [base metrics](https://www.first.org/cvss/v3.1/specification-document#Base-Metrics) to compute the base severity score. Currently only the base metrics are supported. A calculator to transform base metrics into a severity score can be found [here](https://www.first.org/cvss/calculator/3.1). Manual calculations are not needed as the severity_score and severity of a model will be automatically computed upon save.",
      };
      break;
    case "severity_only":
      props.severityOnlySeverity = {
        type: "string",
        label: "Severity Metrics Severity",
        description: "Severity only is the simplest scoring system. It simply sets the severity directly without any underlying math.",
        options: SEVERITY_ONLY_SEVERITY_OPTIONS,
      };
    }
    return props;
  },
  async run({ $ }) {
    const fileIds = await this.securityReporter.prepareFiles({
      draftDocumentsFile: this.draftDocumentsFile,
      draftDocuments: this.draftDocuments,
    });

    const response = await this.securityReporter.createSecurityFinding({
      $,
      assessmentId: this.assessmentId,
      data: {
        title: this.title,
        targets: parseObject(this.targets),
        assessment_section_id: this.assessmentSectionId,
        is_vulnerability: this.isVulnerability,
        severity_metrics: {
          impact: this.severityMetricsImpact && parseInt(this.severityMetricsImpact),
          likelihood: this.severityMetricsLikelihood && parseInt(this.severityMetricsLikelihood),
          cvss_string: this.cvssString,
          severity: this.severityOnlySeverity && parseInt(this.severityOnlySeverity),
          scoring_system: this.SMScoringSystem,
        },
        severity: this.severity && parseInt(this.severity),
        found_at: this.foundAt,
        priority: this.priority && parseInt(this.priority),
        complexity: this.complexity && parseInt(this.complexity),
        action: this.action,
        description: this.description,
        risk: this.risk,
        recommendation: this.recommendation,
        proof: this.proof,
        references: this.references,
        draft_documents: fileIds,
        resolvers: parseObject(this.resolvers),
        user_groups: parseObject(this.userGroups),
        classifications: parseObject(this.classifications),
      },
    });

    $.export("$summary", `Successfully created security finding with title: ${this.title}`);
    return response;
  },
};
