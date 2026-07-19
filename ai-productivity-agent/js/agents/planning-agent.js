/* ============================================
   Planning Agent - Task planning, goal tracking, scheduling
   ============================================ */
class PlanningAgent extends BaseAgent {
  constructor() {
    super('Planning', '📋', 'var(--agent-planning)');
  }
  
  defaultSystemPrompt() {
    return `You are the Planning Agent for AI Productivity Agent. You specialize in:
- Breaking projects into actionable tasks
- Creating realistic timelines
- Risk analysis and mitigation
- Goal setting and tracking (SMART goals)
- Daily/weekly planning and prioritization

Be practical, realistic, and actionable. Use specific time estimates.
Help users focus on what matters most (Eisenhower Matrix, 80/20 rule).

Respond in structured, actionable markdown.`;
  }
  
  async breakDownProject(projectName, description, deadline = '') {
    const prompt = `Break down this project into actionable tasks:

Project: ${projectName}
Description: ${description}
${deadline ? `Deadline: ${deadline}` : ''}

Provide:
## Project Breakdown
### Phase 1: Planning & Setup
- [ ] Task 1 (est. time)
- [ ] Task 2 (est. time)

### Phase 2: Execution
...

### Phase 3: Review & Launch
...

## Timeline Estimate
## Risk Factors
## Success Metrics`;
    
    return await this.think(prompt);
  }
  
  async createDailyPlan(tasks, goals = []) {
    const tasksList = tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');
    const goalsList = goals.length > 0 ? goals.map(g => `- ${g}`).join('\n') : '';
    
    const prompt = `Create an optimized daily plan from these tasks:

Tasks:
${tasksList}
${goalsList ? `\nGoals:\n${goalsList}` : ''}

Output:
## Daily Plan
### Morning (High Energy)
Prioritize hardest tasks

### Afternoon (Medium Energy)
Collaborative/meeting tasks

### Evening (Low Energy)
Planning, review, light tasks

## Priority Matrix
- Urgent & Important
- Important but Not Urgent
- Urgent but Not Important
- Neither

## Time Estimates per task`;
    
    return await this.think(prompt);
  }
  
  async analyzeRisks(projectDescription) {
    const prompt = `Analyze risks for this project:

${projectDescription}

Output:
## Risk Analysis
For each risk:
### Risk: [Name]
- Probability: High/Medium/Low
- Impact: High/Medium/Low
- Mitigation Strategy
- Contingency Plan

## Risk Matrix Summary`;
    
    return await this.think(prompt);
  }
  
  async createGoalPlan(goal, timeframe = '3 months') {
    const prompt = `Create a SMART goal plan for:
Goal: ${goal}
Timeframe: ${timeframe}

Output:
## Goal Plan
### SMART Definition
- Specific
- Measurable
- Achievable
- Relevant
- Time-bound

### Monthly Milestones
### Weekly Targets
### Daily Actions
### Progress Tracking Method
### Potential Obstacles & Solutions`;
    
    return await this.think(prompt);
  }
}
