import React, { useState } from 'react';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { aiService } from '../../../services/ai/ai.service';
import { useToast } from '../../../context/ToastContext';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AITakeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
}

export const AITakeQuizModal: React.FC<AITakeQuizModalProps> = ({
  isOpen,
  onClose,
  noteTitle,
  noteContent
}) => {
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setQuizData([]);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    try {
      const q = await aiService.generateQuiz(noteContent, 3);
      setQuizData(q);
    } catch (err: any) {
      addToast({ title: 'AI Generation Failed', description: err.message, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    setIsAnswered(true);
    
    const activeQ = quizData[currentQuestionIdx];
    const correctIdx = activeQ?.correctAnswerIndex ?? activeQ?.correctOptionIndex;
    if (idx === correctIdx) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCurrentQuestionIdx(i => i + 1);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Solis Quiz: ${noteTitle}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        
        {quizData.length === 0 && !isGenerating && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Sparkles size={32} color="var(--color-lavender-500)" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-body-md)' }}>Test Your Knowledge</h3>
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Solis will read your note and generate a quick multiple-choice quiz to test your comprehension.
            </p>
            <Button variant="accent" onClick={handleGenerate}>
              Generate Quick Quiz
            </Button>
          </div>
        )}

        {isGenerating && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <Sparkles size={24} className="solis-spin" style={{ marginBottom: '16px', color: 'var(--color-coral-500)' }} />
            <p>Synthesizing quiz from your notes...</p>
          </div>
        )}

        {quizData.length > 0 && currentQuestionIdx < quizData.length && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              <span>Question {currentQuestionIdx + 1} of {quizData.length}</span>
              <span>Score: {score}</span>
            </div>
            
            <h4 style={{ fontSize: 'var(--text-body-md)', marginBottom: '16px', lineHeight: 1.4 }}>
              {quizData[currentQuestionIdx].question}
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quizData[currentQuestionIdx].options.map((opt: string, i: number) => {
                const activeQ = quizData[currentQuestionIdx];
                const correctIdx = activeQ?.correctAnswerIndex ?? activeQ?.correctOptionIndex;
                const isCorrect = i === correctIdx;
                const isSelected = i === selectedAnswer;
                
                let bgColor = 'var(--bg-surface-secondary)';
                let borderColor = 'var(--border-subtle)';
                
                if (isAnswered) {
                  if (isCorrect) {
                    bgColor = 'rgba(113, 169, 137, 0.1)';
                    borderColor = 'var(--color-sage-500)';
                  } else if (isSelected && !isCorrect) {
                    bgColor = 'rgba(215, 107, 72, 0.1)';
                    borderColor = 'var(--color-coral-500)';
                  }
                } else if (isSelected) {
                  borderColor = 'var(--color-lavender-500)';
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(i)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: bgColor,
                      textAlign: 'left',
                      cursor: isAnswered ? 'default' : 'pointer',
                      fontSize: 'var(--text-body-sm)',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    {opt}
                    {isAnswered && isCorrect && <CheckCircle2 size={16} color="var(--color-sage-500)" />}
                    {isAnswered && isSelected && !isCorrect && <AlertCircle size={16} color="var(--color-coral-500)" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-body-sm)' }}>
                <strong>Explanation:</strong> {quizData[currentQuestionIdx].explanation}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button 
                variant="accent" 
                disabled={!isAnswered} 
                onClick={handleNext}
              >
                {currentQuestionIdx === quizData.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </Button>
            </div>
          </div>
        )}

        {quizData.length > 0 && currentQuestionIdx >= quizData.length && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <CheckCircle2 size={48} color="var(--color-sage-500)" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: 'var(--text-body-lg)', marginBottom: '8px' }}>Quiz Complete!</h3>
            <p style={{ fontSize: 'var(--text-body-md)', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              You scored {score} out of {quizData.length}.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button variant="accent" onClick={handleGenerate}>Retake with New Questions</Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
