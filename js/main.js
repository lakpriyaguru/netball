// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUzVqP6TQYtEHLqcXdCjYL9cjRB8NbOh4",
  authDomain: "netball-e3126.firebaseapp.com",
  databaseURL:
    "https://netball-e3126-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "netball-e3126",
  storageBucket: "netball-e3126.appspot.com",
  messagingSenderId: "14309561896",
  appId: "1:14309561896:web:21a3b9a38341e5e735471d",
  measurementId: "G-49P6E3S95T",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Function to fetch match data from Firebase
function fetchMatchData() {
  const pastMatchesList = document.getElementById("past-matches");
  const currentMatchesList = document.getElementById("current-matches");
  const upcomingMatchesList = document.getElementById("upcoming-matches");

  // Reference to the Firebase matches data
  const matchesRef = database.ref("matches");

  // Listen for changes in match data
  matchesRef.on("value", (snapshot) => {
    const data = snapshot.val();

    // Clear previous data
    pastMatchesList.innerHTML = "";
    currentMatchesList.innerHTML = "";
    upcomingMatchesList.innerHTML = "";

    for (let matchId in data) {
      const match = data[matchId];
      const card = createMatchCard(match);

      // Categorize matches by status
      if (match.status === 2) {
        pastMatchesList.appendChild(card);
      } else if (match.status === 1) {
        currentMatchesList.appendChild(card);
      } else if (match.status === 0) {
        upcomingMatchesList.appendChild(card);
      }
    }
  });
}

// Function to create a match card
function createMatchCard(match) {
  const card = document.createElement("div");
  card.classList.add("match-summary");

  // Decide what text to show based on match status
  let matchText = "";
  let matchTextClass = ""; // For adding the 'live-text' class

  if (match.status === 2) {
    // Use matchWin field from Firebase to determine the winner or if it's a draw
    if (match.win === 3) {
      matchText = "It's a Draw!";
    } else if (match.win === 1) {
      matchText = `${match.team1} Wins!`;
    } else if (match.win === 2) {
      matchText = `${match.team2} Wins!`;
    }
  } else if (match.status === 1) {
    matchText = "🔴 LIVE"; // Show LIVE if the match is ongoing
    matchTextClass = "live-text"; // Add class for live animation
  } else if (match.status === 0) {
    matchText = `Scheduled for ${match.matchTime}`; // Show the scheduled time for upcoming matches
  }

  card.innerHTML = `
    <img src="img/uni/${match.team1.toLowerCase()}.png" alt="${
    match.team1
  } Logo" class="team-logo">
    <div class="match-info">
      <div class="team-names">${match.team1} vs ${match.team2}</div>
      <div class="score">${
        match.score1 !== undefined && match.score2 !== undefined
          ? `${match.score1} - ${match.score2}`
          : ""
      }</div>
      <div class="winner-text ${matchTextClass}">${matchText}</div>
    </div>
    <img src="img/uni/${match.team2.toLowerCase()}.png" alt="${
    match.team2
  } Logo" class="team-logo">
  `;

  return card;
}

// Fetch data on page load
document.addEventListener("DOMContentLoaded", fetchMatchData);
