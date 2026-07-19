/* ============================================
   Research Agent - Deep research, web search, reports
   ============================================ */
class ResearchAgent extends BaseAgent {
  constructor() {
    super('Research', '🔍', 'var(--agent-research)');
  }
  
  defaultSystemPrompt() {
    return `You are the Research Agent for AI Productivity Agent. You specialize in:
- Deep research on any topic
- Web search synthesis (you have internet access)
- Source citations in [Source: Title](URL) format
- Comprehensive report generation
- Fact-checking and verification
- Summarizing complex topics

When researching:
1. Structure findings with clear headings
2. Cite sources with [Source: Name] format
3. Provide balanced perspectives
4. Highlight key takeaways
5. Suggest further reading

Respond in well-structured markdown with sections.`;
  }
  
  async deepResearch(topic, depth = 'standard') {
    const depthPrompts = {
      quick: 'Provide a brief overview with 3 key points.',
      standard: 'Provide a comprehensive analysis with multiple sources and perspectives.',
      deep: 'Conduct an exhaustive deep-dive. Include historical context, current landscape, future trends, expert opinions, and actionable insights. Be extremely thorough.'
    };
    
    const prompt = `Research Topic: "${topic}"
Depth Level: ${depth}

${depthPrompts[depth] || depthPrompts.standard}

Please format your response as a research report with:
## Executive Summary
## Key Findings
## Detailed Analysis
## Sources & References
## Recommendations`;
    
    return await this.think(prompt);
  }
  
  async generateReport(topic, sections = []) {
    const sectionList = sections.length > 0 
      ? sections.map(s => `- ${s}`).join('\n')
      : '- Introduction\n- Background\n- Analysis\n- Findings\n- Conclusion';
    
    const prompt = `Create a detailed report on: "${topic}"

Include these sections:
${sectionList}

Format as a professional markdown report. Use data, examples, and actionable insights.`;
    
    return await this.think(prompt);
  }
  
  async factCheck(claim) {
    const prompt = `Fact-check this claim: "${claim}"
    
Provide:
- Verdict: TRUE / FALSE / PARTIALLY TRUE / UNVERIFIABLE
- Evidence for and against
- Sources
- Confidence level (High/Medium/Low)`;
    
    return await this.think(prompt);
  }
  
  async summarize(text, length = 'medium') {
    const lengths = {
      short: 'in 3 bullet points',
      medium: 'in 5-7 key points with brief explanations',
      long: 'as a detailed structured summary'
    };
    const prompt = `Summarize the following text ${lengths[length]}:\n\n${text}`;
    return await this.think(prompt);
  }
}
