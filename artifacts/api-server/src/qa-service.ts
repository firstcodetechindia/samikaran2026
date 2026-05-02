import { db } from "./db";
import { 
  qaTestSuites, qaTestCases, qaTestRuns, qaTestResults, 
  qaDefects, qaReleaseCandidates, qaReleaseEvaluations, 
  qaCoverageSuggestions, qaTesterPerformance,
  InsertQaTestSuite, InsertQaTestCase, InsertQaTestRun,
  InsertQaDefect, InsertQaReleaseCandidate
} from "@workspace/db";
import { eq, desc, and, sql, count, gte, lte, isNull, or, inArray } from "drizzle-orm";
import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      throw new Error("AI_INTEGRATIONS_OPENAI_API_KEY is required for AI coverage suggestions");
    }
    openaiClient = new OpenAI({ 
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return openaiClient;
}

export interface ReleaseReadinessResult {
  score: number;
  decision: 'GO' | 'NO_GO' | 'CONDITIONAL';
  confidence: number;
  isBlocked: boolean;
  blockingReasons: Array<{ reason: string; severity: string; module: string; defectId?: string }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskSummary: string;
  metrics: {
    testPassRate: number;
    criticalBugs: number;
    highBugs: number;
    mediumBugs: number;
    lowBugs: number;
    blockedTests: number;
    regressionCoverage: number;
  };
  moduleRisks: Array<{ module: string; riskLevel: string; issues: number; testCoverage: number }>;
}

export class QAService {
  private static generateId(prefix: string): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${dateStr}-${random}`;
  }

  // ==================
  // TEST SUITES
  // ==================
  
  static async getTestSuites() {
    return await db.select().from(qaTestSuites).orderBy(desc(qaTestSuites.createdAt));
  }

  static async getTestSuiteById(id: number) {
    const [suite] = await db.select().from(qaTestSuites).where(eq(qaTestSuites.id, id));
    return suite;
  }

  static async createTestSuite(data: InsertQaTestSuite) {
    const [suite] = await db.insert(qaTestSuites).values(data).returning();
    return suite;
  }

  static async updateTestSuite(id: number, data: Partial<InsertQaTestSuite>) {
    const [suite] = await db.update(qaTestSuites)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(qaTestSuites.id, id))
      .returning();
    return suite;
  }

  static async deleteTestSuite(id: number) {
    await db.delete(qaTestSuites).where(eq(qaTestSuites.id, id));
  }

  // ==================
  // TEST CASES
  // ==================

  static async getTestCases(filters?: { suiteId?: number; module?: string; priority?: string }) {
    let query = db.select().from(qaTestCases);
    
    if (filters?.suiteId) {
      query = query.where(eq(qaTestCases.suiteId, filters.suiteId)) as typeof query;
    }
    if (filters?.module) {
      query = query.where(eq(qaTestCases.module, filters.module)) as typeof query;
    }
    if (filters?.priority) {
      query = query.where(eq(qaTestCases.priority, filters.priority)) as typeof query;
    }
    
    return await query.orderBy(desc(qaTestCases.createdAt));
  }

  static async getTestCaseById(id: number) {
    const [testCase] = await db.select().from(qaTestCases).where(eq(qaTestCases.id, id));
    return testCase;
  }

  static async createTestCase(data: InsertQaTestCase) {
    const testCaseId = this.generateId('TC');
    const [testCase] = await db.insert(qaTestCases)
      .values({ ...data, testCaseId })
      .returning();
    
    if (data.suiteId) {
      await db.update(qaTestSuites)
        .set({ totalCases: sql`total_cases + 1`, updatedAt: new Date() })
        .where(eq(qaTestSuites.id, data.suiteId));
    }
    
    return testCase;
  }

  static async updateTestCase(id: number, data: Partial<InsertQaTestCase>) {
    const [testCase] = await db.update(qaTestCases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(qaTestCases.id, id))
      .returning();
    return testCase;
  }

  static async deleteTestCase(id: number) {
    const [testCase] = await db.select().from(qaTestCases).where(eq(qaTestCases.id, id));
    if (testCase?.suiteId) {
      await db.update(qaTestSuites)
        .set({ totalCases: sql`total_cases - 1`, updatedAt: new Date() })
        .where(eq(qaTestSuites.id, testCase.suiteId));
    }
    await db.delete(qaTestCases).where(eq(qaTestCases.id, id));
  }

  // ==================
  // TEST RUNS
  // ==================

  static async getTestRuns(filters?: { status?: string; releaseVersion?: string }) {
    let query = db.select().from(qaTestRuns);
    
    if (filters?.status) {
      query = query.where(eq(qaTestRuns.status, filters.status)) as typeof query;
    }
    if (filters?.releaseVersion) {
      query = query.where(eq(qaTestRuns.releaseVersion, filters.releaseVersion)) as typeof query;
    }
    
    return await query.orderBy(desc(qaTestRuns.createdAt));
  }

  static async getTestRunById(id: number) {
    const [run] = await db.select().from(qaTestRuns).where(eq(qaTestRuns.id, id));
    return run;
  }

  static async createTestRun(data: InsertQaTestRun) {
    const runId = this.generateId('RUN');
    const [run] = await db.insert(qaTestRuns)
      .values({ ...data, runId, status: 'pending' })
      .returning();
    return run;
  }

  static async startTestRun(id: number, executedBy: string) {
    const [run] = await db.update(qaTestRuns)
      .set({ status: 'in_progress', startedAt: new Date(), executedBy, updatedAt: new Date() })
      .where(eq(qaTestRuns.id, id))
      .returning();
    return run;
  }

  static async completeTestRun(id: number) {
    const results = await db.select().from(qaTestResults).where(eq(qaTestResults.runId, id));
    
    const passedCount = results.filter(r => r.status === 'passed').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    const blockedCount = results.filter(r => r.status === 'blocked').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const total = results.length;
    const passRate = total > 0 ? (passedCount / total) * 100 : 0;
    
    const [run] = await db.update(qaTestRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        passedCount,
        failedCount,
        blockedCount,
        skippedCount,
        passRate,
        updatedAt: new Date()
      })
      .where(eq(qaTestRuns.id, id))
      .returning();
    return run;
  }

  // ==================
  // TEST RESULTS
  // ==================

  static async getTestResults(runId: number) {
    return await db.select().from(qaTestResults)
      .where(eq(qaTestResults.runId, runId))
      .orderBy(qaTestResults.executedAt);
  }

  static async submitTestResult(data: {
    runId: number;
    testCaseId: number;
    status: string;
    actualResult?: string;
    errorMessage?: string;
    executedBy: string;
    notes?: string;
    executionTime?: number;
  }) {
    const [result] = await db.insert(qaTestResults)
      .values({
        runId: data.runId,
        testCaseId: data.testCaseId,
        status: data.status,
        actualResult: data.actualResult,
        errorMessage: data.errorMessage,
        executedBy: data.executedBy,
        notes: data.notes,
        executionTime: data.executionTime
      })
      .returning();
    return result;
  }

  // ==================
  // DEFECTS
  // ==================

  static async getDefects(filters?: { status?: string; severity?: string; module?: string }) {
    let query = db.select().from(qaDefects);
    
    if (filters?.status) {
      query = query.where(eq(qaDefects.status, filters.status)) as typeof query;
    }
    if (filters?.severity) {
      query = query.where(eq(qaDefects.severity, filters.severity)) as typeof query;
    }
    if (filters?.module) {
      query = query.where(eq(qaDefects.module, filters.module)) as typeof query;
    }
    
    return await query.orderBy(desc(qaDefects.createdAt));
  }

  static async getDefectById(id: number) {
    const [defect] = await db.select().from(qaDefects).where(eq(qaDefects.id, id));
    return defect;
  }

  static async createDefect(data: InsertQaDefect) {
    const defectId = this.generateId('BUG');
    
    const isDeploymentBlocker = data.severity === 'critical' || 
      data.module?.toLowerCase().includes('payment') ||
      data.module?.toLowerCase().includes('exam') ||
      data.module?.toLowerCase().includes('security');
    
    const [defect] = await db.insert(qaDefects)
      .values({ 
        ...data, 
        defectId,
        isDeploymentBlocker,
        blockerReason: isDeploymentBlocker ? `${data.severity} severity bug in ${data.module}` : null
      })
      .returning();
    return defect;
  }

  static async updateDefect(id: number, data: Partial<InsertQaDefect>) {
    const [defect] = await db.update(qaDefects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(qaDefects.id, id))
      .returning();
    return defect;
  }

  static async getOpenBlockingDefects() {
    return await db.select().from(qaDefects)
      .where(and(
        eq(qaDefects.isDeploymentBlocker, true),
        or(
          eq(qaDefects.status, 'open'),
          eq(qaDefects.status, 'in_progress'),
          eq(qaDefects.status, 'reopened')
        )
      ))
      .orderBy(desc(qaDefects.createdAt));
  }

  // ==================
  // RELEASE CANDIDATES
  // ==================

  static async getReleaseCandidates() {
    return await db.select().from(qaReleaseCandidates).orderBy(desc(qaReleaseCandidates.createdAt));
  }

  static async getReleaseCandidateById(id: number) {
    const [rc] = await db.select().from(qaReleaseCandidates).where(eq(qaReleaseCandidates.id, id));
    return rc;
  }

  static async createReleaseCandidate(data: InsertQaReleaseCandidate) {
    const [rc] = await db.insert(qaReleaseCandidates).values(data).returning();
    return rc;
  }

  static async updateReleaseCandidate(id: number, data: Partial<InsertQaReleaseCandidate>) {
    const [rc] = await db.update(qaReleaseCandidates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(qaReleaseCandidates.id, id))
      .returning();
    return rc;
  }

  // ==================
  // RELEASE READINESS ENGINE
  // ==================

  static async evaluateReleaseReadiness(releaseCandidateId?: number, version?: string): Promise<ReleaseReadinessResult> {
    const openDefects = await db.select().from(qaDefects)
      .where(or(
        eq(qaDefects.status, 'open'),
        eq(qaDefects.status, 'in_progress'),
        eq(qaDefects.status, 'reopened')
      ));
    
    const criticalBugs = openDefects.filter(d => d.severity === 'critical').length;
    const highBugs = openDefects.filter(d => d.severity === 'high').length;
    const mediumBugs = openDefects.filter(d => d.severity === 'medium').length;
    const lowBugs = openDefects.filter(d => d.severity === 'low').length;
    
    const recentRuns = await db.select().from(qaTestRuns)
      .where(eq(qaTestRuns.status, 'completed'))
      .orderBy(desc(qaTestRuns.completedAt))
      .limit(5);
    
    let testPassRate = 100;
    let blockedTests = 0;
    if (recentRuns.length > 0) {
      const latestRun = recentRuns[0];
      testPassRate = latestRun.passRate || 100;
      blockedTests = latestRun.blockedCount || 0;
    }
    
    const totalCases = await db.select({ count: count() }).from(qaTestCases).where(eq(qaTestCases.isActive, true));
    const regressionCases = await db.select({ count: count() }).from(qaTestCases)
      .where(and(eq(qaTestCases.isActive, true), eq(qaTestCases.testType, 'regression')));
    
    const totalCount = totalCases[0]?.count || 0;
    const regressionCount = regressionCases[0]?.count || 0;
    const regressionCoverage = totalCount > 0 ? (regressionCount / totalCount) * 100 : 0;
    
    const blockingReasons: Array<{ reason: string; severity: string; module: string; defectId?: string }> = [];
    
    if (criticalBugs > 0) {
      const criticalDefects = openDefects.filter(d => d.severity === 'critical');
      criticalDefects.forEach(d => {
        blockingReasons.push({
          reason: `Critical bug: ${d.title}`,
          severity: 'critical',
          module: d.module,
          defectId: d.defectId
        });
      });
    }
    
    if (testPassRate < 95) {
      blockingReasons.push({
        reason: `Test pass rate (${testPassRate.toFixed(1)}%) is below threshold (95%)`,
        severity: 'high',
        module: 'Testing'
      });
    }
    
    if (highBugs > 5) {
      blockingReasons.push({
        reason: `High severity bugs (${highBugs}) exceed threshold (5)`,
        severity: 'high',
        module: 'Quality'
      });
    }
    
    const blockingDefects = openDefects.filter(d => d.isDeploymentBlocker);
    blockingDefects.forEach(d => {
      if (!blockingReasons.some(r => r.defectId === d.defectId)) {
        blockingReasons.push({
          reason: `Deployment blocker: ${d.title}`,
          severity: d.severity,
          module: d.module,
          defectId: d.defectId
        });
      }
    });
    
    const isBlocked = blockingReasons.length > 0;
    
    let score = 100;
    score -= criticalBugs * 25;
    score -= highBugs * 10;
    score -= mediumBugs * 3;
    score -= lowBugs * 1;
    score -= (100 - testPassRate) * 0.5;
    score -= blockedTests * 2;
    if (regressionCoverage < 50) {
      score -= (50 - regressionCoverage) * 0.2;
    }
    score = Math.max(0, Math.min(100, score));
    
    let decision: 'GO' | 'NO_GO' | 'CONDITIONAL' = 'GO';
    if (criticalBugs > 0 || testPassRate < 90) {
      decision = 'NO_GO';
    } else if (highBugs > 3 || testPassRate < 95 || blockingReasons.length > 0) {
      decision = 'CONDITIONAL';
    }
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalBugs > 0) {
      riskLevel = 'critical';
    } else if (highBugs > 3 || testPassRate < 90) {
      riskLevel = 'high';
    } else if (highBugs > 0 || testPassRate < 95) {
      riskLevel = 'medium';
    }
    
    const confidence = Math.min(100, Math.max(0, 100 - (blockingReasons.length * 15)));
    
    const moduleDefects = openDefects.reduce((acc, d) => {
      acc[d.module] = (acc[d.module] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const moduleRisks = Object.entries(moduleDefects).map(([module, issues]) => ({
      module,
      riskLevel: issues >= 3 ? 'high' : issues >= 1 ? 'medium' : 'low',
      issues,
      testCoverage: 0
    }));
    
    let riskSummary = '';
    if (decision === 'GO') {
      riskSummary = 'All quality gates passed. Release is recommended.';
    } else if (decision === 'NO_GO') {
      riskSummary = `Release blocked due to ${blockingReasons.length} critical issue(s). Address before deployment.`;
    } else {
      riskSummary = `Release has ${blockingReasons.length} concern(s). Manual review required before deployment.`;
    }
    
    const evaluationId = this.generateId('EVAL');
    await db.insert(qaReleaseEvaluations).values({
      evaluationId,
      releaseCandidateId,
      readinessScore: Math.round(score),
      decision,
      confidence,
      testPassRate,
      criticalBugsCount: criticalBugs,
      highBugsCount: highBugs,
      mediumBugsCount: mediumBugs,
      lowBugsCount: lowBugs,
      blockedTestsCount: blockedTests,
      regressionCoverage,
      isBlocked,
      blockingReasons,
      riskLevel,
      riskSummary,
      moduleRisks
    });
    
    if (releaseCandidateId) {
      await db.update(qaReleaseCandidates)
        .set({
          readinessScore: Math.round(score),
          isBlocked,
          blockingReasons: blockingReasons.map(r => r.reason),
          updatedAt: new Date()
        })
        .where(eq(qaReleaseCandidates.id, releaseCandidateId));
    }
    
    return {
      score: Math.round(score),
      decision,
      confidence,
      isBlocked,
      blockingReasons,
      riskLevel,
      riskSummary,
      metrics: {
        testPassRate,
        criticalBugs,
        highBugs,
        mediumBugs,
        lowBugs,
        blockedTests,
        regressionCoverage
      },
      moduleRisks
    };
  }

  static async getLatestEvaluation() {
    const [eval_] = await db.select().from(qaReleaseEvaluations)
      .orderBy(desc(qaReleaseEvaluations.evaluatedAt))
      .limit(1);
    return eval_;
  }

  static async overrideRelease(evaluationId: number, overrideReason: string, overriddenBy: string) {
    const [eval_] = await db.update(qaReleaseEvaluations)
      .set({
        wasOverridden: true,
        overrideReason,
        overriddenBy,
        overriddenAt: new Date()
      })
      .where(eq(qaReleaseEvaluations.id, evaluationId))
      .returning();
    return eval_;
  }

  // ==================
  // AI COVERAGE SUGGESTIONS
  // ==================

  static async generateCoverageSuggestions() {
    try {
      const testCases = await db.select().from(qaTestCases).where(eq(qaTestCases.isActive, true));
      const defects = await db.select().from(qaDefects).orderBy(desc(qaDefects.createdAt)).limit(50);
      
      const modules = Array.from(new Set(testCases.map(tc => tc.module)));
      const features = Array.from(new Set(testCases.map(tc => tc.feature).filter(Boolean)));
      
      const testSummary = {
        totalCases: testCases.length,
        byModule: modules.map(m => ({
          module: m,
          count: testCases.filter(tc => tc.module === m).length,
          automated: testCases.filter(tc => tc.module === m && tc.automationStatus === 'automated').length
        })),
        byType: {
          functional: testCases.filter(tc => tc.testType === 'functional').length,
          regression: testCases.filter(tc => tc.testType === 'regression').length,
          smoke: testCases.filter(tc => tc.testType === 'smoke').length,
          integration: testCases.filter(tc => tc.testType === 'integration').length,
          security: testCases.filter(tc => tc.testType === 'security').length,
          performance: testCases.filter(tc => tc.testType === 'performance').length
        }
      };
      
      const defectSummary = {
        total: defects.length,
        byModule: modules.map(m => ({
          module: m,
          count: defects.filter(d => d.module === m).length,
          critical: defects.filter(d => d.module === m && d.severity === 'critical').length
        })),
        recentPatterns: defects.slice(0, 10).map(d => d.title)
      };
      
      const prompt = `You are a QA expert analyzing test coverage for an educational olympiad platform.

Current test coverage summary:
${JSON.stringify(testSummary, null, 2)}

Recent defect patterns:
${JSON.stringify(defectSummary, null, 2)}

Platform features include:
- Student registration and authentication
- Exam scheduling and management
- Online proctoring with AI monitoring
- Exam attempts and submissions
- Result calculation and publication
- Certificate generation
- Payment processing
- School and partner management

Based on this analysis, identify 3-5 missing test coverage areas. For each suggestion, provide:
1. A clear title
2. Description of what needs testing
3. The module it belongs to
4. Priority (critical/high/medium/low)
5. Suggested test case outline
6. Reasoning for the suggestion

Respond in JSON format with an array of suggestions.`;

      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const parsed = JSON.parse(content);
      const suggestions = parsed.suggestions || parsed.data || [];

      const savedSuggestions = [];
      for (const sug of suggestions) {
        const suggestionId = this.generateId('SUG');
        const [saved] = await db.insert(qaCoverageSuggestions)
          .values({
            suggestionId,
            title: sug.title,
            description: sug.description,
            suggestedTestCase: sug.suggestedTestCase || sug.testCaseOutline,
            category: sug.category || 'missing_coverage',
            module: sug.module,
            feature: sug.feature,
            priority: sug.priority || 'medium',
            confidence: sug.confidence || 75,
            reasoning: sug.reasoning,
            generatedFrom: 'coverage_gap',
            status: 'new'
          })
          .returning();
        savedSuggestions.push(saved);
      }

      return savedSuggestions;
    } catch (error) {
      console.error('Error generating coverage suggestions:', error);
      return [];
    }
  }

  static async getCoverageSuggestions(status?: string) {
    let query = db.select().from(qaCoverageSuggestions);
    if (status) {
      query = query.where(eq(qaCoverageSuggestions.status, status)) as typeof query;
    }
    return await query.orderBy(desc(qaCoverageSuggestions.createdAt));
  }

  static async reviewSuggestion(id: number, action: 'accept' | 'dismiss', reviewedBy: string, reviewNotes?: string) {
    const status = action === 'accept' ? 'accepted' : 'dismissed';
    const [suggestion] = await db.update(qaCoverageSuggestions)
      .set({ status, reviewedBy, reviewedAt: new Date(), reviewNotes })
      .where(eq(qaCoverageSuggestions.id, id))
      .returning();
    return suggestion;
  }

  static async convertSuggestionToTestCase(id: number, testCaseData: InsertQaTestCase) {
    const testCase = await this.createTestCase(testCaseData);
    
    await db.update(qaCoverageSuggestions)
      .set({ status: 'converted', convertedToTestCaseId: testCase.id })
      .where(eq(qaCoverageSuggestions.id, id));
    
    return testCase;
  }

  // ==================
  // DASHBOARD METRICS
  // ==================

  static async getDashboardMetrics() {
    const totalSuites = await db.select({ count: count() }).from(qaTestSuites).where(eq(qaTestSuites.isActive, true));
    const totalCases = await db.select({ count: count() }).from(qaTestCases).where(eq(qaTestCases.isActive, true));
    const automatedCases = await db.select({ count: count() }).from(qaTestCases)
      .where(and(eq(qaTestCases.isActive, true), eq(qaTestCases.automationStatus, 'automated')));
    
    const openDefects = await db.select({ count: count() }).from(qaDefects)
      .where(or(eq(qaDefects.status, 'open'), eq(qaDefects.status, 'in_progress'), eq(qaDefects.status, 'reopened')));
    const criticalDefects = await db.select({ count: count() }).from(qaDefects)
      .where(and(eq(qaDefects.severity, 'critical'), or(eq(qaDefects.status, 'open'), eq(qaDefects.status, 'in_progress'))));
    
    const recentRuns = await db.select().from(qaTestRuns)
      .where(eq(qaTestRuns.status, 'completed'))
      .orderBy(desc(qaTestRuns.completedAt))
      .limit(5);
    
    const avgPassRate = recentRuns.length > 0
      ? recentRuns.reduce((sum, r) => sum + (r.passRate || 0), 0) / recentRuns.length
      : 0;
    
    const pendingSuggestions = await db.select({ count: count() }).from(qaCoverageSuggestions)
      .where(eq(qaCoverageSuggestions.status, 'new'));
    
    const latestEval = await this.getLatestEvaluation();
    const blockingIssues = await this.getOpenBlockingDefects();
    
    const totalCount = totalCases[0]?.count || 0;
    const autoCount = automatedCases[0]?.count || 0;
    const automationReadiness = totalCount > 0 ? (autoCount / totalCount) * 100 : 0;
    
    return {
      testSuites: totalSuites[0]?.count || 0,
      testCases: totalCount,
      automatedCases: autoCount,
      automationReadiness: Math.round(automationReadiness),
      openDefects: openDefects[0]?.count || 0,
      criticalDefects: criticalDefects[0]?.count || 0,
      averagePassRate: Math.round(avgPassRate),
      pendingSuggestions: pendingSuggestions[0]?.count || 0,
      releaseReadiness: latestEval?.readinessScore || null,
      releaseDecision: latestEval?.decision || null,
      isReleaseBlocked: latestEval?.isBlocked || false,
      blockingIssues: blockingIssues.length,
      recentRuns: recentRuns.slice(0, 3).map(r => ({
        id: r.id,
        name: r.name,
        passRate: r.passRate,
        completedAt: r.completedAt
      }))
    };
  }

  // ==================
  // TESTER PERFORMANCE
  // ==================

  static async updateTesterPerformance(testerId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const results = await db.select().from(qaTestResults)
      .where(and(
        eq(qaTestResults.executedBy, testerId),
        gte(qaTestResults.executedAt, periodStart),
        lte(qaTestResults.executedAt, periodEnd)
      ));
    
    const defects = await db.select().from(qaDefects)
      .where(and(
        eq(qaDefects.reportedBy, testerId),
        gte(qaDefects.reportedAt, periodStart),
        lte(qaDefects.reportedAt, periodEnd)
      ));
    
    const testsExecuted = results.length;
    const testsPassed = results.filter(r => r.status === 'passed').length;
    const testsFailed = results.filter(r => r.status === 'failed').length;
    const testsBlocked = results.filter(r => r.status === 'blocked').length;
    
    const defectsReported = defects.length;
    const criticalDefects = defects.filter(d => d.severity === 'critical').length;
    const validDefects = defects.filter(d => d.status !== 'wont_fix').length;
    const invalidDefects = defects.filter(d => d.status === 'wont_fix').length;
    
    const executionTimes = results.filter(r => r.executionTime).map(r => r.executionTime!);
    const avgExecutionTime = executionTimes.length > 0
      ? Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length)
      : 0;
    
    const [existing] = await db.select().from(qaTesterPerformance)
      .where(and(
        eq(qaTesterPerformance.testerId, testerId),
        eq(qaTesterPerformance.periodStart, periodStart)
      ));
    
    if (existing) {
      await db.update(qaTesterPerformance)
        .set({
          testsExecuted,
          testsPassed,
          testsFailed,
          testsBlocked,
          defectsReported,
          criticalDefects,
          validDefects,
          invalidDefects,
          averageExecutionTime: avgExecutionTime,
          updatedAt: new Date()
        })
        .where(eq(qaTesterPerformance.id, existing.id));
    } else {
      await db.insert(qaTesterPerformance).values({
        testerId,
        periodStart,
        periodEnd,
        testsExecuted,
        testsPassed,
        testsFailed,
        testsBlocked,
        defectsReported,
        criticalDefects,
        validDefects,
        invalidDefects,
        averageExecutionTime: avgExecutionTime
      });
    }
  }
}

export default QAService;
