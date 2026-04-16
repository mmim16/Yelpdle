import { useState } from "react";
import "./styles.css";
//import axios from "axios"; //fetch yelp reviews

export default function Game() {
  //Variables
  const [review, setReview] = useState(""); //holds review text
  const [rating, setRating] = useState(null);   //holds actual rating
  const [guess, setGuess] = useState(null);     //holds user's guess
  const [score, setScore] = useState(0);       //holds score
  const [showResult, setShowResult] = useState(false); //controls result display
  const [showReview, setShowReview] = useState(false); //controls review display
  const [message, setMessage] = useState(""); //holds feedback message
  const [hints, setHints] = useState([]);     //reviews array
  const [visibleCount, setVisibleCount] = useState(1);    //how many hints shown
  const [business, setBusiness] = useState("");
  const [imgHint, setImg] = useState("");     //review photo


  //Functions
  async function getReview() {  //gets the review from yelp api
  //  setReview(output.data.text);       //saves the review
  //  setRating(output.data.rating);       //saves the rating

  
    const response = await fetch("http://localhost:5000/api/game");
    const data = await response.json();

    setHints(data.reviews);
    setRating(data.rating);
    setBusiness(data.name);
    
    const imageReview = data.reviews.find(r => r.photos && r.photos.length > 0);
    setImg(imageReview ? imageReview.photos[0].link : null);

    setGuess(null);
    setMessage("");
    setShowResult(false);
    setShowReview(true);
    setVisibleCount(1);
    
  }

  function getGuess(num) {  //gets the guess from the user
    setGuess(num);
  }

  function submitAnswer(){  //Submits and shows the result section
    if (guess === Math.round(rating)) {
      setScore(score + 1);
      setMessage("Yay, you got it correct :)");
    }
    else {
      setMessage("Oh no, you were not correct :(");
    }
    setShowResult(true);
  }

  function getStarIcon(num){
    if(!num) return null;
    let stars = [];
    for (let i = 0; i < num; i++) {
      stars.push(<span key={i}>⭐</span>);
    }
    return stars;
  }

  function getStarButtons() {
    let buttons = [];
    let numbers = [1, 2, 3, 4, 5];

    for (let i = 0; i < numbers.length; i++) {
      let num = numbers[i];

      let className = "starButton";

      if (guess === num) {
        className = "starButton selected";
      }

      let button = (
        <button
          key={num}
          className={className}
          onClick={() => getGuess(num)}
          disabled={showResult}
        >
          ⭐ {num}
        </button>
      );

      buttons.push(button);
    }

    return buttons;
  }
  //UI
  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Yelp Star Guesser</h1>
        <p className="stars">{getStarIcon(5)}</p>

        {/*User clicks get review button, then it dissapears and the review shows*/}
        {!showReview && (
          <button className="button" onClick={getReview}>Get Yelp Review</button>
        )}
        {showReview && ( 
          <div>
            <h3>Hints for: {business}</h3>

            {hints.slice(0, visibleCount).map((h, i) => (
              <div key={i}>
                <p>{h.text?.text}</p>     
              </div>
            ))}

            {/* image hint on third try
            {visibleCount >=3 && imgHint && (
              <img src={imgHint} alt="An image hint" style={{width: '200px', borderRadius: '8px' }} />
           )} */}

           {visibleCount <hints.length && !showResult && (
              <button onClick={() =>setVisibleCount(visibleCount +1)}>
                Next hint
              </button>

           )}
          </div>
        )}

        {/* Star buttons */}
        {showReview && (
          <div className="row"> 
            {getStarButtons()}
        </div>
      )}

        {/* Submit Button */}
        {showReview && !showResult && (
          <div className="center">
            <button className="button"
              onClick={submitAnswer} disabled={!guess}  //user can't submit a guess without selecting a star rating
              >Submit Guess
            </button>
          </div>
        )}

        {/* Results */}
        {showResult && (
          <>
            <div className="result">
              <p>{message}</p>
              <p>
                Your guess: {guess} stars {getStarIcon(guess)}
              </p>
              <p>
                Actual rating: {rating} stars {getStarIcon(rating)}
              </p>
            </div>

            <button className="button" onClick={getReview}  //reset the game with a new review
              >Get Another Review
            </button>

            <div className="score">Score: {score}</div>
          </>
        )}
      </div>
    </div>
  );
}