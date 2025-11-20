import { useState, useEffect, useCallback } from "react";

/**
 * Simple HTML entity decoder for strings from OpenTDB
 */
const decodeHtml = (str) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
};

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowResults(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);

    try {
      const res = await fetch(
        "https://opentdb.com/api.php?amount=3&type=multiple"
      );
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      if (!data.results || !data.results.length)
        throw new Error("No questions returned");

      // format and decode
      const formatted = data.results.map((q) => {
        const decodedQuestion = decodeHtml(q.question);
        const correct = decodeHtml(q.correct_answer);
        const incorrect = q.incorrect_answers.map((a) => decodeHtml(a));
        const options = shuffle([correct, ...incorrect]);
        return {
          text: decodedQuestion,
          options,
          correctAnswer: correct,
        };
      });

      setQuestions(formatted);
      setLoading(false);
    } catch (err) {
      console.error("Fetch questions error:", err);
      setError(err.message || "Failed to load questions");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // shuffle function
  const shuffle = (arr) => {
    // create copy so we don't mutate input
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const handleAnswerClick = (option) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
    setIsAnswered(true);

    const correct = questions[currentQuestion]?.correctAnswer;
    if (option === correct) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    // guard: if questions empty, do nothing
    if (!questions.length) return;

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((n) => n + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = () => {
    // refetch new questions and reset state
    fetchQuestions();
  };

  // Safety render guards
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-lg">Loading quiz…</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="mb-6 text-sm text-red-600">{error}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={fetchQuestions}
              className="bg-blue-500 text-white py-2 px-4 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );

  // If results screen
  if (showResults)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-10 text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Quiz Finished 🎉</h1>
          <p className="text-xl mb-4">
            You scored <b>{score}</b> out of <b>{questions.length}</b>
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={restartQuiz}
              className="bg-blue-500 text-white py-2 px-6 rounded-lg shadow hover:bg-blue-600 transition"
            >
              Restart Quiz 🔄
            </button>
          </div>
        </div>
      </div>
    );

  // Main quiz UI (safe: questions[currentQuestion] exists because loading=false and no error)
  const q = questions[currentQuestion];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-8">
        {/* Progress */}
        <div className="mb-4 text-right text-gray-500 text-sm">
          Question {currentQuestion + 1} of {questions.length}
        </div>

        {/* Question */}
        <h1 className="text-xl font-semibold mb-6">{q.text}</h1>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((option, idx) => {
            let buttonStyle = "bg-gray-200 text-gray-700 hover:bg-gray-300";

            if (isAnswered) {
              if (option === q.correctAnswer) {
                buttonStyle = "bg-green-500 text-white";
              } else if (option === selectedAnswer) {
                buttonStyle = "bg-red-500 text-white";
              } else {
                buttonStyle = "bg-gray-200 text-gray-400";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswerClick(option)}
                disabled={isAnswered}
                className={`w-full py-3 rounded-lg shadow transition text-lg ${buttonStyle}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <p className="mt-4 text-center text-lg font-medium">
            {selectedAnswer === q.correctAnswer ? (
              <span className="text-green-600">🎉 Correct!</span>
            ) : (
              <span className="text-red-600">
                ❌ Wrong! The correct answer is <b>{q.correctAnswer}</b>
              </span>
            )}
          </p>
        )}

        {/* Next or Finish button */}
        {isAnswered && (
          <div className="mt-6 text-center">
            <button
              onClick={nextQuestion}
              className="bg-blue-500 text-white py-2 px-6 rounded-lg shadow hover:bg-blue-600 transition"
            >
              {currentQuestion === questions.length - 1
                ? "Finish Quiz 🎯"
                : "Next Question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
