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
const auth = firebase.auth();
const database = firebase.database();

// Check Auth State on Page Load
auth.onAuthStateChanged((user) => {
  const loginForm = document.querySelector(".login-form");
  const updateForm = document.querySelector(".update-form");
  const header = document.querySelector(".fixed-top");

  if (user) {
    loginForm.classList.add("d-none");
    updateForm.classList.remove("d-none");
    header.style.display = "flex"; // Show header
    document.getElementById("userEmail").textContent = user.email; // Display user's email
  } else {
    loginForm.classList.remove("d-none");
    updateForm.classList.add("d-none");
    header.style.display = "none"; // Hide header
    document.getElementById("userEmail").textContent = ""; // Clear user email display
  }
});

// Login Form Submission
document.getElementById("loginForm").addEventListener("submit", handleLogin);

// Logout Functionality
document.getElementById("logoutBtn").addEventListener("click", handleLogout);

// Show modal when Add New Match button is clicked
document
  .getElementById("addMatchBtn")
  .addEventListener("click", showAddMatchModal);

// Handle Add Match form submission
document
  .getElementById("addMatchForm")
  .addEventListener("submit", handleAddMatch);

// Fetch Matches
function fetchMatches() {
  database.ref("matches").on("value", (snapshot) => {
    const matches = snapshot.val();
    console.log("Fetched matches:", matches);
    const matchesContainer = document.getElementById("matchesContainer");
    matchesContainer.innerHTML = ""; // Clear previous matches

    if (matches) {
      // Convert matches object to an array of [matchId, match] pairs
      const matchesArray = Object.entries(matches);

      // Sort matches by matchId (assumes matchId is in a sortable format)
      matchesArray.sort((a, b) => {
        return a[0].localeCompare(b[0]); // Sort based on matchId
      });

      // Create and append rows for each match
      matchesArray.forEach(([matchId, match]) => {
        const row = createMatchRow(matchId, match);
        matchesContainer.appendChild(row);
      });

      // Show matches heading and table
      document.getElementById("matchesHeading").classList.remove("d-none");
      document.getElementById("matchesTable").classList.remove("d-none");
    } else {
      console.log("No matches found");
    }
  });
}

// Function Definitions
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth
    .signInWithEmailAndPassword(email, password)
    .then(() => {
      showAlert("success", "Logged in successfully!", 1500);
      setTimeout(() => {
        document.querySelector(".login-form").classList.add("d-none");
        document.querySelector(".update-form").classList.remove("d-none");
        document.getElementById("userEmail").textContent = email;
        fetchMatches(); // Call to load existing matches
      }, 1500);
    })
    .catch((error) =>
      showAlert("error", "Login Failed: " + error.message, 1500)
    );
}

function handleLogout() {
  auth
    .signOut()
    .then(() => {
      document.querySelector(".update-form").classList.add("d-none");
      document.querySelector(".login-form").classList.remove("d-none");
      document.getElementById("userEmail").textContent = ""; // Clear the email
      showAlert("success", "Logged out successfully!", 1500);
    })
    .catch((error) =>
      showAlert("error", "Logout Failed: " + error.message, 1500)
    );
}

function showAddMatchModal() {
  const addMatchModal = new bootstrap.Modal(
    document.getElementById("addMatchModal")
  );
  addMatchModal.show();
}

function generateRandomMatchId() {
  const timestamp = Date.now(); // Get current timestamp
  const randomNum = Math.floor(Math.random() * 1000); // Generate a random number (0-999)
  return `match_${timestamp}_${randomNum}`; // Create a unique ID
}

function handleAddMatch(e) {
  e.preventDefault();
  const team1 = document.getElementById("team1").value;
  const team2 = document.getElementById("team2").value;
  const matchTime = document.getElementById("matchtime").value;

  const matchId = generateRandomMatchId(); // Generate a random match ID

  const newMatch = {
    id: matchId, // Use the generated ID
    team1,
    team2,
    matchTime,
    score1: 0,
    score2: 0,
    status: 0,
    win: 0,
  };

  // Save new match to Firebase
  database
    .ref(`matches/${matchId}`)
    .set(newMatch)
    .then(() => {
      showAlert("success", "Match added successfully!", 1500);
      fetchMatches(); // Refresh the matches list
      const addMatchModal = bootstrap.Modal.getInstance(
        document.getElementById("addMatchModal")
      );
      addMatchModal.hide(); // Close modal after successful submission
    })
    .catch((error) =>
      showAlert("error", "Error adding match: " + error.message, 1500)
    );
}

// Create Match Row for Table
function createMatchRow(matchId, match) {
  const row = document.createElement("tr");
  const winner = determineWinner(match);

  row.innerHTML = `
    <td>${matchId}</td>
    <td>${match.team1}</td>
    <td>${match.team2}</td>
    <td>${match.score1}</td>
    <td>${match.score2}</td>
    <td>${match.matchTime}</td>
    <td>${getMatchStatus(match)}</td>
    <td>${winner}</td>
    <td>
    ${
      match.status === 0 // Upcoming
        ? `
          <button class="btn btn-info" onclick="editMatch('${matchId}')">Edit</button>
          <button class="btn btn-danger" onclick="deleteMatch('${matchId}')">Delete</button>
          <button class="btn btn-warning" onclick="startMatch('${matchId}')">Start Match</button>
          `
        : match.status === 1 // Ongoing
        ? `
          <button class="btn btn-info" onclick="scoreMatch('${matchId}')">Score</button>
          <button class="btn btn-success" onclick="finishMatch('${matchId}')">Finish Match</button>
          `
        : match.status === 2 // Finished
        ? `- Finished Match -`
        : ""
    }
</td>
  `;

  return row;
}

// Determine Winner Based on Scores
function determineWinner(match) {
  switch (match.win) {
    case 0:
      return "-"; // No winner
    case 1:
      return match.team1 + " WON"; // Team 1 wins
    case 2:
      return match.team2 + " WON"; // Team 2 wins
    case 3:
      return "DRAW"; // Draw
    default:
      return "-"; // In case of unexpected values
  }
}

// Get Match Status
function getMatchStatus(match) {
  switch (match.status) {
    case 0:
      return "Upcoming"; // Future match
    case 1:
      return "Ongoing"; // Ongoing match
    case 2:
      return "Finished"; // Past match
    default:
      return "-"; // In case of unexpected values
  }
}

// Start Match Function with Confirmation
function startMatch(matchId) {
  // Fetch match details from the database
  database
    .ref(`matches/${matchId}`)
    .once("value")
    .then((snapshot) => {
      const match = snapshot.val();
      if (!match) {
        showAlert("error", "Match not found."); // Handle case where match does not exist
        return;
      }

      // Use SweetAlert for confirmation with match details
      Swal.fire({
        title: "Are you sure?",
        html: `
        <div>Do you want to start this match?</div>
        <br>
        <div>${matchId}</div>
        <div><strong>${match.team1}</strong> vs. <strong>${match.team2}</strong></div>
        <div>${match.matchTime}</div>
      `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, start it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          // Logic to start the match
          database
            .ref(`matches/${matchId}`)
            .update({ status: 1 }) // Set status to ongoing
            .then(() => {
              showAlert("success", "The match has been started.", 1500); // Use showAlert function
              fetchMatches(); // Refresh the matches list to reflect the change
            })
            .catch((error) => {
              showAlert(
                "error",
                "Error starting match: " + error.message,
                1500
              ); // Use showAlert function
            });
        }
      });
    })
    .catch((error) => {
      showAlert(
        "error",
        "Error fetching match details: " + error.message,
        1500
      ); // Handle fetching error
    });
}

// Finish Match Function with Confirmation and Winner Selection
function finishMatch(matchId) {
  // Fetch match details from the database
  database
    .ref(`matches/${matchId}`)
    .once("value")
    .then((snapshot) => {
      const match = snapshot.val();
      if (match) {
        // Show SweetAlert with match details and winner selection
        Swal.fire({
          title: "Are you sure?",
          html: `
            <div>Do you want to finish this match?</div>
            <br>
            <div>${matchId}</div>
            <div><strong>${match.team1}</strong> vs. <strong>${match.team2}</strong></div>
            <div><strong>${match.score1}</strong> - <strong>${match.score2}</strong></div>
            <div>Select Winner:
            <select id="winnerSelect">
              <option value="3" default>Draw</option>
              <option value="1">${match.team1}</option>
              <option value="2">${match.team2}</option>
            </select>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, finish it!",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            const winner = parseInt(
              document.getElementById("winnerSelect").value
            );

            // Logic to finish the match and update the winner
            database
              .ref(`matches/${matchId}`)
              .update({ status: 2, win: winner }) // Set status to finished and set winner
              .then(() => {
                showAlert("success", "The match has been finished.", 1500); // Use showAlert function
                fetchMatches(); // Refresh the matches list to reflect the change
              })
              .catch((error) => {
                showAlert(
                  "error",
                  "Error finishing match: " + error.message,
                  1500
                ); // Use showAlert function
              });
          }
        });
      } else {
        showAlert("error", "Match not found.", 1500);
      }
    })
    .catch((error) => {
      showAlert(
        "error",
        "Error fetching match details: " + error.message,
        1500
      );
    });
}

// Delete Match Function with Confirmation
function deleteMatch(matchId) {
  // Fetch match details for display in the confirmation dialog
  database
    .ref(`matches/${matchId}`)
    .once("value")
    .then((snapshot) => {
      const match = snapshot.val();

      if (match) {
        // Use SweetAlert for confirmation
        Swal.fire({
          title: "Are you sure?",
          html: `<div>Do you want to delete this match?</div>
                  <br>
                  <div>${matchId}</div>
                  <div><strong>${match.team1}</strong> vs. <strong>${match.team2}</strong></div>
                  <div>${match.matchTime}</div>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            // Logic to delete the match from the database
            database
              .ref(`matches/${matchId}`)
              .remove() // Remove the match
              .then(() => {
                showAlert("success", "Match deleted successfully!", 1500); // Show success alert
                fetchMatches(); // Refresh the matches list to reflect the change
              })
              .catch((error) => {
                showAlert(
                  "error",
                  "Error deleting match: " + error.message,
                  1500
                ); // Show error alert
              });
          }
        });
      } else {
        showAlert("error", "Match not found.", 1500);
      }
    });
}

// Edit Match Function with Confirmation
function editMatch(matchId) {
  // Fetch match details from the database
  database
    .ref(`matches/${matchId}`)
    .once("value")
    .then((snapshot) => {
      const match = snapshot.val();

      if (match) {
        // Fill modal form with existing match details
        document.getElementById("editTeam1").value = match.team1;
        document.getElementById("editTeam2").value = match.team2;
        document.getElementById("editMatchTime").value = match.matchTime;

        // Show the modal
        const editMatchModal = new bootstrap.Modal(
          document.getElementById("editMatchModal")
        );
        editMatchModal.show();

        // Handle form submission for editing the match
        document
          .getElementById("editMatchForm")
          .addEventListener("submit", function handleEditSubmit(e) {
            e.preventDefault();

            // Get the updated team names and match time from the modal form
            const updatedTeam1 = document.getElementById("editTeam1").value;
            const updatedTeam2 = document.getElementById("editTeam2").value;
            const updatedMatchTime =
              document.getElementById("editMatchTime").value;

            // Use SweetAlert for confirmation
            Swal.fire({
              title: "Are you sure?",
              html: `<div>Do you want to save the changes for this match?</div>
                  <br>
                  <div><strong>${match.team1}</strong> vs. <strong>${match.team2}</strong></div>
                  <div>${updatedMatchTime}</div>
                  <div><strong>to</strong></div>
                  <div><strong>${updatedTeam1}</strong> vs. <strong>${updatedTeam2}</strong></div>
                  <div>${updatedMatchTime}</div>`,
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes, save it!",
              cancelButtonText: "Cancel",
            }).then((result) => {
              if (result.isConfirmed) {
                // Update match details in Firebase
                database
                  .ref(`matches/${matchId}`)
                  .update({
                    team1: updatedTeam1,
                    team2: updatedTeam2,
                    matchTime: updatedMatchTime,
                  })
                  .then(() => {
                    showAlert("success", "Match updated successfully!", 1500);
                    fetchMatches(); // Refresh matches after update
                    editMatchModal.hide(); // Hide the modal after success
                  })
                  .catch((error) => {
                    showAlert(
                      "error",
                      "Error updating match: " + error.message,
                      1500
                    );
                  });
              }
            });

            // Remove the event listener to avoid multiple submissions
            document
              .getElementById("editMatchForm")
              .removeEventListener("submit", handleEditSubmit);
          });
      } else {
        showAlert("error", "Match not found.", 1500);
      }
    });
}

// Score Match Function to Increment/Decrement Scores
function scoreMatch(matchId) {
  // Fetch match details from the database
  database
    .ref(`matches/${matchId}`)
    .once("value")
    .then((snapshot) => {
      const match = snapshot.val();

      if (match) {
        // Populate modal with team names, logos, and scores
        document.getElementById("scoreTeam1Name").textContent = match.team1;
        document.getElementById("scoreTeam2Name").textContent = match.team2;
        document.getElementById(
          "scoreTeam1Logo"
        ).src = `../img/uni/${match.team1}.png`; // Add the correct path for logos
        document.getElementById(
          "scoreTeam2Logo"
        ).src = `../img/uni/${match.team2}.png`; // Add the correct path for logos
        document.getElementById("scoreTeam1Value").textContent = match.score1;
        document.getElementById("scoreTeam2Value").textContent = match.score2;

        // Show the modal
        const scoreMatchModal = new bootstrap.Modal(
          document.getElementById("scoreMatchModal")
        );
        scoreMatchModal.show();

        // Handle increment/decrement for team 1
        document
          .getElementById("team1Increase")
          .addEventListener("click", () => {
            match.score1++;
            document.getElementById("scoreTeam1Value").textContent =
              match.score1;
            updateScoreInDatabase(matchId, match.score1, match.score2); // Update in Firebase
          });

        document
          .getElementById("team1Decrease")
          .addEventListener("click", () => {
            if (match.score1 > 0) {
              match.score1--;
              document.getElementById("scoreTeam1Value").textContent =
                match.score1;
              updateScoreInDatabase(matchId, match.score1, match.score2); // Update in Firebase
            }
          });

        // Handle increment/decrement for team 2
        document
          .getElementById("team2Increase")
          .addEventListener("click", () => {
            match.score2++;
            document.getElementById("scoreTeam2Value").textContent =
              match.score2;
            updateScoreInDatabase(matchId, match.score1, match.score2); // Update in Firebase
          });

        document
          .getElementById("team2Decrease")
          .addEventListener("click", () => {
            if (match.score2 > 0) {
              match.score2--;
              document.getElementById("scoreTeam2Value").textContent =
                match.score2;
              updateScoreInDatabase(matchId, match.score1, match.score2); // Update in Firebase
            }
          });
      } else {
        showAlert("error", "Match not found.", 1500);
      }
    });
}

// Function to update scores in Firebase
function updateScoreInDatabase(matchId, score1, score2) {
  database
    .ref(`matches/${matchId}`)
    .update({
      score1: score1,
      score2: score2,
    })
    .then(() => {
      console.log("Scores updated successfully!");
    })
    .catch((error) => {
      console.error("Error updating scores:", error);
    });
}

// Show Alert with SweetAlert
function showAlert(icon, title, timer = null) {
  Swal.fire({
    icon,
    title,
    showConfirmButton: false,
    timer,
  });
}

// Initial fetch of matches
fetchMatches();
