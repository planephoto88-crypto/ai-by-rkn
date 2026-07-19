/* ============================================
   Study Agent - Flashcards, Quizzes, Mind Maps, Revision
   ============================================ */
class StudyAgent extends BaseAgent {
  constructor() {
    super('Study', '🎓', 'var(--agent-study)');
  }
  
  defaultSystemPrompt() {
    return `You are the Study Agent for AI Productivity Agent. You specialize in:
- Converting notes into effective flashcards (question/answer pairs)
- Generating quiz questions with difficulty levels
- Creating structured mind maps
- Building revision plans and study schedules
- Breaking down complex subjects into learnable chunks

When creating study materials:
1. Make questions clear and unambiguous
2. Vary question types (recall, application, analysis)
3. Include difficulty ratings
4. Organize by topic/subtopic
5. Add helpful hints where appropriate

Respond in structured JSON-like markdown.`;
  }
  
  async generateFlashcards(notes, count = 10) {
    const prompt = `Convert these study notes into ${count} flashcards.

Notes:
${notes}

Output format:
## Flashcards
For each flashcard:
**Q:** [Question]
**A:** [Answer]
*Topic:* [Subtopic]
*Difficulty:* [Easy/Medium/Hard]`;
    
    return await this.think(prompt);
  }
  
  async generateQuiz(notes, questionCount = 10, type = 'mixed') {
    const types = {
      mcq: 'multiple choice questions with 4 options each, marking the correct answer',
      tf: 'true/false questions',
      short: 'short answer questions',
      mixed: 'a mix of multiple choice, true/false, and short answer questions'
    };
    const prompt = `Create a quiz based on these notes with ${questionCount} ${types[type]}.

Notes:
${notes}

Output format:
## Quiz
For each question show:
1. Question number and type
2. The question
3. For MCQ: A) B) C) D) options, mark correct with ✓
4. For T/F: Answer: True/False with brief explanation
5. For Short Answer: Expected answer

Include an answer key at the end.`;
    
    return await this.think(prompt);
  }
  
  async generateMindMap(topic, depth = 3) {
    const prompt = `Create a mind map structure for: "${topic}" with depth level ${depth}.

Output a hierarchical structure:
## Mind Map: ${topic}
### Central Node: ${topic}
#### Branch 1: [Main Category]
- Sub-point 1.1
  - Detail 1.1.1
- Sub-point 1.2
#### Branch 2: [Main Category]
...continue for all branches

Make it comprehensive but well-organized.`;
    
    return await this.think(prompt);
  }
  
  async generateRevisionPlan(subject, daysUntilExam, topics = []) {
    const topicsList = topics.length > 0 
      ? topics.map(t => `- ${t}`).join('\n')
      : 'All topics in the subject';
    
    const prompt = `Create a revision plan for:
Subject: ${subject}
Days until exam: ${daysUntilExam}
Topics: ${topicsList}

Output:
## Revision Plan
### Overview
- Total days: ${daysUntilExam}
- Daily study time recommended

### Daily Schedule
For each day, specify:
- Topics to cover
- Study method (active recall, practice, review)
- Estimated time

### Final Week
- Intensive review strategy
- Practice test schedule
- Rest and preparation tips`;
    
    return await this.think(prompt);
  }
  
  async explainConcept(concept, level = 'intermediate') {
    const levels = {
      beginner: 'Explain as if to someone with no prior knowledge. Use simple analogies.',
      intermediate: 'Explain with moderate technical detail. Assume basic familiarity.',
      advanced: 'Provide a detailed technical explanation with depth and nuance.'
    };
    const prompt = `${levels[level]} Explain: "${concept}"\n\nInclude examples and common misconceptions.`;
    return await this.think(prompt);
  }
}
