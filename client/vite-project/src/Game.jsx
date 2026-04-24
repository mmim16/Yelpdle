import { useState, useRef, useCallback } from "react";
import "./styles.css";

const MAX_HINTS = 3;
const DAILY_ROUNDS = 5;

export default function Game({ mode, onHome }) {
  const [rating, setRating] = useState(null);
  const [guess, setGuess] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [message, setMessage] = useState("");
  const [hints, setHints] = useState([]);
  const [visibleCount, setVisibleCount] = useState(1);
  const [business, setBusiness] = useState("");
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roundKey, setRoundKey] = useState(0); // forces full remount on new round

  const prefetchedData = useRef(null);
  const isPrefetching = useRef(false);

  const isDaily = mode === "daily";

  async function fetchFromServer() {
    const response = await fetch("https://yelpdle-h362.onrender.com/api/game");
    return await response.json();
  }

  const prefetchNext = useCallback(async () => {
    if (isPrefetching.current) return;
    isPrefetching.current = true;
    try {
      prefetchedData.current = await fetchFromServer();
    } catch (err) {
      prefetchedData.current = null;
    } finally {
      isPrefetching.current = false;
    }
  }, []);

  function applyData(data) {
    setRoundKey(k => k + 1); // key change forces React to remount content fresh
    setHints(data.reviews || []);
    setRating(data.rating);
    setBusiness(data.name);
    setGuess(null);
    setMessage("");
    setShowResult(false);
    setShowReview(true);
    setVisibleCount(1);
  }

  async function getReview() {
    if (prefetchedData.current) {
      const data = prefetchedData.current;
      prefetchedData.current = null;
      applyData(data);
      prefetchNext();
      return;
    }

    setLoading(true);
    try {
      const data = await fetchFromServer();
      applyData(data);
      prefetchNext();
    } catch (err) {
      console.error("Failed to fetch review:", err);
    } finally {
      setLoading(false);
    }
  }

  function submitAnswer() {
    const actual = Math.round(rating);
    const correct = guess === actual;
    if (correct) setScore(prev => prev + 1);
    setMessage(correct ? "Correct!" : `Not quite — it was ${actual} stars`);
    setShowResult(true);
    if (isDaily) {
      setResults(prev => [...prev, { business, guess, actual, correct }]);
    }
    prefetchNext();
  }

  function nextRound() {
    if (isDaily && round >= DAILY_ROUNDS) {
      setGameOver(true);
    } else {
      setRound(prev => prev + 1);
      getReview();
    }
  }

  function renderStars(num) {
    if (!num) return null;
    return (
      <span className="star-display">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 24 24" width="16" height="16"
            fill={i < num ? "#f5a623" : "none"}
            stroke={i < num ? "#f5a623" : "#ccc"}
            strokeWidth="2">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        ))}
      </span>
    );
  }

  function getStarButtons() {
    return [1, 2, 3, 4, 5].map((num) => (
      <button
        key={num}
        className={guess === num ? "starButton selected" : "starButton"}
        onClick={() => setGuess(num)}
        disabled={showResult}
      >
        <svg viewBox="0 0 24 24" width="14" height="14"
          fill={guess === num ? "white" : "#f5a623"}
          stroke={guess === num ? "white" : "#f5a623"}
          strokeWidth="1.5" style={{ marginRight: 4 }}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
        {num}
      </button>
    ));
  }

  function renderHint(hint, index) {
    if (index === 2 && hint.photo) {
      return (
        <div key={index} className="hintBox image-hint">
          <p className="hintLabel">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"
              stroke="currentColor" strokeWidth="2" style={{ marginRight: 5 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
            Image Hint
          </p>
          <img src={hint.photo} alt="Review hint" className="hintImage" />
        </div>
      );
    }
    return (
      <div key={index} className="hintBox">
        <p className="hint-number">Hint {index + 1}</p>
        <p className="hintText">{hint.text}</p>
      </div>
    );
  }

  const canShowNextHint = visibleCount < hints.length && visibleCount < MAX_HINTS && !showResult;

  if (gameOver) {
    return (
      <div className="page">
        <div className="card">
          <button className="homeButton" onClick={onHome}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Home
          </button>
          {/* <img src="/yelp-logo.png" alt="Yelp" className="card-yelp-logo" /> */}
          <p className="game-mode-label">Daily Challenge — Complete</p>
          <h2 className="summary-title">Today's Results</h2>
          <p className="summary-score">{score} / {DAILY_ROUNDS}</p>
          <div className="summary-list">
            {results.map((r, i) => (
              <div key={i} className={`summary-row ${r.correct ? "correct" : "incorrect"}`}>
                <span className="summary-biz">{r.business}</span>
                <span className="summary-detail">
                  {r.correct
                    ? <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2d9e5f" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    : <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#e05252" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  }
                  {" "}You: {r.guess} · Actual: {r.actual}
                </span>
              </div>
            ))}
          </div>
          <button className="button" onClick={onHome}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <button className="homeButton" onClick={onHome}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Home
        </button>

        {/* <img src="/yelp-logo.png" alt="Yelp" className="card-yelp-logo" /> */}

        <p className="game-mode-label">
          {isDaily ? `Daily Yelp — Round ${round} of ${DAILY_ROUNDS}` : "Infinite Play"}
        </p>

        <h1 className="title">Yelpdle</h1>

        {isDaily && (
          <div className="progress-bar-track">
            <div className="progress-bar-fill"
              style={{ width: `${((round - 1) / DAILY_ROUNDS) * 100}%` }} />
          </div>
        )}

        {/* roundKey forces this entire block to remount fresh each round */}
        <div key={roundKey}>
          {!showReview && (
            <button className="button" onClick={getReview} disabled={loading}>
              {loading ? "Loading…" : isDaily ? `Start Round ${round}` : "Get Review"}
            </button>
          )}

          {showReview && (
            <div>
              <h3 className="business-name">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
                  stroke="#908eff" strokeWidth="2" strokeLinecap="round"
                  style={{ marginRight: 6 }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                {business}
              </h3>

              {hints.slice(0, visibleCount).map((h, i) => renderHint(h, i))}

              {canShowNextHint && (
                <button className="button secondary"
                  onClick={() => setVisibleCount(v => v + 1)}>
                  Next Hint ({visibleCount}/{Math.min(hints.length, MAX_HINTS)})
                </button>
              )}
            </div>
          )}

          {showReview && (
            <div className="row">{getStarButtons()}</div>
          )}

          {showReview && !showResult && (
            <div className="center">
              <button className="button" onClick={submitAnswer} disabled={!guess}>
                Submit Guess
              </button>
            </div>
          )}

          {showResult && (
            <>
              <div className={`result ${guess === Math.round(rating) ? "result-correct" : "result-wrong"}`}>
                <p className="result-message">{message}</p>
                <div className="result-row">
                  <span>Your guess</span>
                  <span>{renderStars(guess)}</span>
                </div>
                <div className="result-row">
                  <span>Actual rating</span>
                  <span>{renderStars(Math.round(rating))}</span>
                </div>
              </div>

              {isDaily ? (
                <button className="button" onClick={nextRound}>
                  {round >= DAILY_ROUNDS ? "See Results" : "Next Round"}
                </button>
              ) : (
                <button className="button" onClick={getReview} disabled={loading}>
                  {loading ? "Loading…" : "Next Review"}
                </button>
              )}

              {!isDaily && <div className="score">Score: {score}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}