/* ============================================
   Coding Agent - Code generation, review, debugging
   ============================================ */
class CodingAgent extends BaseAgent {
  constructor() {
    super('Coding', '💻', 'var(--agent-coding)');
  }
  
  defaultSystemPrompt() {
    return `You are the Coding Agent for AI Productivity Agent. You specialize in:
- Code generation across multiple languages
- Code review and optimization
- Bug identification and fixing
- Architecture suggestions
- Best practices and patterns

When providing code:
1. Include clear comments
2. Follow language conventions
3. Highlight edge cases
4. Provide usage examples
5. Note any dependencies

Use proper markdown code blocks with language tags.`;
  }
  
  async generateCode(spec, language = 'javascript') {
    const prompt = `Write ${language} code for the following specification:

${spec}

Requirements:
- Clean, well-commented code
- Error handling
- Edge cases covered
- Follow ${language} best practices
- Include a brief explanation of the approach`;

    return await this.think(prompt);
  }
  
  async reviewCode(code, language = '') {
    const prompt = `Review this ${language} code and provide feedback:

\`\`\`${language}
${code}
\`\`\`

Evaluate:
1. Correctness and bugs
2. Performance issues
3. Security concerns
4. Code style and readability
5. Suggested improvements
6. Overall score (1-10)`;
    
    return await this.think(prompt);
  }
  
  async debugCode(code, error = '', language = '') {
    const prompt = `Debug this ${language} code:
${error ? `\nError: ${error}\n` : ''}
\`\`\`${language}
${code}
\`\`\`

Provide:
1. Identified issues
2. Fixed code
3. Explanation of what was wrong`;
    
    return await this.think(prompt);
  }
  
  async suggestArchitecture(projectDescription) {
    const prompt = `Suggest a software architecture for: ${projectDescription}

Cover:
- Tech stack recommendations
- Component/Module breakdown
- Data flow
- API design
- Database schema
- Scalability considerations
- Trade-offs`;
    
    return await this.think(prompt);
  }
}
