import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function BattleMatch() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const storedQuestions = localStorage.getItem("battleQuestions");

    if (storedQuestions) {
      try {
        const parsedQuestions = JSON.parse(storedQuestions);

        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
          return;
        }
      } catch (error) {
        console.error("Failed to parse battleQuestions:", error);
      }
    }

    // Temporary frontend questions.
    // These will later be replaced by backend-generated questions.
    const defaultQuestions = [
      {
        question: "Which keyword is used to declare a constant in JavaScript?",
        options: ["var", "let", "const", "static"],
        answer: "const",
      },
      {
        question: "Which data structure follows FIFO?",
        options: ["Stack", "Queue", "Tree", "Graph"],
        answer: "Queue",
      },
      {
        question: "Which language is primarily used with React?",
        options: ["Python", "JavaScript", "C", "SQL"],
        answer: "JavaScript",
      },
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Text Machine Language",
          "Hyperlink Text Management Language",
          "Home Tool Markup Language",
        ],
        answer: "Hyper Text Markup Language",
      },
      {
        question: "Which SQL command is used to retrieve data?",
        options: ["INSERT", "UPDATE", "SELECT", "DELETE"],
        answer: "SELECT",
      },
    ];

    setQuestions(defaultQuestions);
    localStorage.setItem(
      "battleQuestions",
      JSON.stringify(defaultQuestions)
    );
  }, []);

  useEffect(() => {
    if (finished || questions.length === 0) {
      return;
    }

    if (timeLeft <= 0) {
      handleNextQuestion();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, finished, questions.length]);

  const handleAnswer = (answer) => {
    if (selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(answer);

    const current = questions[currentQuestion];

    if (answer === current.answer) {
      setScore((previous) => previous + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion + 1 >= questions.length) {
      setFinished(true);
      localStorage.setItem("battleStarted", "false");
      return;
    }

    setCurrentQuestion((previous) => previous + 1);
    setSelectedAnswer(null);
    setTimeLeft(30);
  };

  const handleExit = () => {
    localStorage.removeItem("battleStarted");
    localStorage.removeItem("battleQuestions");

    navigate("/");
  };

  if (questions.length === 0) {
    return (
      <div className="battle-match-page">
        <h1>Loading Battle...</h1>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="battle-match-page">
        <div className="battle-result-card">
          <h1>🏆 Battle Finished</h1>

          <p className="room-code">
            Room: <strong>{roomCode}</strong>
          </p>

          <h2>
            Score: {score} / {questions.length}
          </h2>

          <p>
            {score === questions.length
              ? "🔥 Perfect score!"
              : score >= questions.length / 2
              ? "👏 Good job!"
              : "💪 Keep practicing!"}
          </p>

          <button onClick={handleExit}>Back to Home</button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="battle-match-page">
      <div className="battle-header">
        <div>
          <h1>⚔️ Coding Battle</h1>
          <p>
            Room: <strong>{roomCode}</strong>
          </p>
        </div>

        <div className="battle-stats">
          <span>
            Question {currentQuestion + 1}/{questions.length}
          </span>

          <span>Score: {score}</span>

          <span>⏱️ {timeLeft}s</span>
        </div>
      </div>

      <div className="battle-question-card">
        <h2>{question.question}</h2>

        <div className="battle-options">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect =
              selectedAnswer !== null && option === question.answer;
            const isWrong = isSelected && option !== question.answer;

            return (
              <button
                key={index}
                className={`battle-option ${
                  isCorrect ? "correct" : ""
                } ${isWrong ? "wrong" : ""} ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                <span>{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            );
          })}
        </div>

        {selectedAnswer !== null && (
          <div className="battle-next-container">
            <button onClick={handleNextQuestion}>
              {currentQuestion + 1 === questions.length
                ? "Finish Battle"
                : "Next Question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BattleMatch;
