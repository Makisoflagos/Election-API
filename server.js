const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://amakaekeh15:NomOfORs4Zxs8xaN@cluster0.aou9mww.mongodb.net/')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

  //  creating a schema
  const electionApi = new mongoose.Schema({
    state: String,
    parties: [String],
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    collationOfficer: {
      type: String,
    },
    isRigged: {
      type: Boolean,
    },
    totalVotes: {
      type: Number,
    },
    winner: {
      type: String,
    },
  });
  
  const GovElection = mongoose.model("Election", electionApi);
  
  app.post("/elections", async (req, res) => {
    try {
      const electionResult = await GovElection.create(req.body);
      if (!electionResult) {
        res.status(400).json({
          Error: "Error creating election result.",
        });
      } else {
        const results = electionResult.result;
        let stateWinner = null;
        let stateHighestVote = null;
  
        for (const party in results) {
          if (results.hasOwnProperty(party)) {
            const voteCount = results[party];
            if (stateHighestVote === null || voteCount > stateHighestVote) {
              stateHighestVote = voteCount;
              stateWinner = party;
            }
          }
        }
  
        electionResult.winner = stateWinner;
        await electionResult.save();
  
        res.status(201).json({
          data: electionResult,
        });
      }
    } catch (error) {
      res.status(400).json({
        Message: error.message,
      });
    }
  });
  

// show all elections

app.get( '/elections', async ( req, res ) => {
  try {
      const elections = await GovElection.find();
      if ( elections.length === 0 ) {
          res.status( 400 ).json( {
              Error: 'This collection has no data.'
          })
      } else {
          res.status(201).json(elections)
      }
  } catch ( e ) {
      res.status( 400 ).json( {
          Message: e.message
      })
  }
})

// get/ read a single election

app.get( '/elections/:electionId', async ( req, res ) => {
  try {
      const electionId = req.params.electionId;
      const elections = await GovElection.findById(electionId);
      if (  !elections) {
          res.status( 400 ).json( {
              Error: `No election with this id: ${electionId}`
          })
      } else {
          res.status(201).json(elections)
      }
  } catch ( e ) {
      res.status( 400 ).json( {
          Message: e.message
      })
  }
} )
// update an election

app.put( "/elections/:electionId", async ( req, res ) => {

      const electionId = req.params.electionId;
      const updatedElection = req.body
      const  elections  = await GovElection.findById( electionId, updatedElection);
      res.status(200).json({
        message: `State with this id ${id} has been updated successfully.`,
        data: elections
      })
      
      
      }) 

// Calculate and Update winners for each state
  app.get("/elections/:electionId", async (req, res) => {
    try {
      const electionId = req.params.electionId
    const electionResult = await GovElection.findById(electionId);
      if (!electionResult) {
        res.status(404).json({
          error: "Election result not found.",
        });
      } else {
        const results = electionResult.result;
        let stateWinner = null;
        let stateHighestVote = null;
  
        for (const parties in results) {
          if (results.hasOwnProperty(parties)) {
            const voteCount = results[parties];
            if (stateHighestVote === null || voteCount > stateHighestVote) {
              stateHighestVote = voteCount;
              stateWinner = parties;
            }
          }
        }
  
        electionResult.winner = stateWinner;
        await electionResult.save();
  
        res.status(200).json({
          message: `The winner of this election is: ${stateWinner}`,
          results: electionResult.result,
          winner: stateWinner,
        });
      }
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  });
  
// determine if the election was rigged

app.get('/riggedresult', async (req, res) => {
  try {
    const electionResults = await GovElection.find();
    if (electionResults.length === 0) {
      return res.status(404).json({
        Error: 'No election results found.',
      });
    }

    let riggedCount = 0;
    let notRiggedCount = 0;

    for (const electionResult of electionResults) {
      if (electionResult.isRigged) {
        riggedCount++;
      } else {
        notRiggedCount++;
      }
    }

    let overallRiggedResult;
    if (riggedCount > notRiggedCount) {
      overallRiggedResult = 'Election seems rigged';
    } else if (riggedCount < notRiggedCount) {
      overallRiggedResult = 'Election is not rigged';
    } else {
      overallRiggedResult = 'Election is fair';
    }
    res.status(200).json({
      overallRiggedResult,
      riggedCount,
      notRiggedCount,
    });
  } catch (error) {
    res.status(400).json({
      Message: error.message,
});
}
});
// total results of the elections

// app.get("/results/:state", async (req, res) => {
//   try {
//     const state = req.params.state;

//     const electionResults = await GovElection.findOne({ state });
//     if (!electionResults || electionResults.length === 0) {
//       res.status(404).json({
//         error: "Election results not found for the specified state.",
//       });
//     } else {
//       let totalResults = {};
//       for (const result of electionResults) {
//         const resultData = result.result;
//         for (const party in resultData) {
//           if (resultData.hasOwnProperty(party)) {
//             const voteCount = resultData[party];
//             if (totalResults.hasOwnProperty(party)) {
//               totalResults[party] += voteCount;
//             } else {
//               totalResults[party] = voteCount;
//             }
//           }
//         }
//       }

//       res.status(200).json({
//         state,
//         results: totalResults,
//       });
//     }
//   } catch (error) {
//     res.status(400).json({
//       error: error.message,
//     });
//   }
// });


// getting total winner
app.get("/overallWinner", async (req, res) => {
  try {
    const allResults = await GovElection.find();
    if (!allResults || allResults.length === 0) {
      res.status(404).json({
        error: "No election results found.",
      });
    } else {
      let overallResults = {};
      for (const result of allResults) {
        const resultData = result.result;
        for (const party in resultData) {
          if (resultData.hasOwnProperty(party)) {
            const voteCount = resultData[party];
            if (overallResults.hasOwnProperty(party)) {
              overallResults[party] += voteCount;
            } else {
              overallResults[party] = voteCount;
            }
          }
        }
      }

      let overallWinner = null;
      let highestVoteCount = null;
      for (const party in overallResults) {
        if (overallResults.hasOwnProperty(party)) {
          const voteCount = overallResults[party];
          if (highestVoteCount === null || voteCount > highestVoteCount) {
            highestVoteCount = voteCount;
            overallWinner = party;
          }
        }
      }

      res.status(200).json({
        message: `The Overall Winner of this election ${overallWinner}`,
        overallWinner,
        results: overallResults,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// getting winner
app.get("/Winner", async (req, res) => {
  try {
    const allResults = await GovElection.find();
    if (!allResults || allResults.length === 0) {
      res.status(404).json({
        error: "No election results found.",
      });
    } else {

      let stateWinners = {};

      for (const result of allResults) {
        const state = result.state;
        const resultData = result.result;

        if (!stateWinners[state]) {
          stateWinners[state] = {
            winner: null,
            voteCount: null,
          };
        }

        for (const party in resultData) {
          if (resultData.hasOwnProperty(party)) {
            const voteCount = resultData[party];
            if (overallResults.hasOwnProperty(party)) {
              overallResults[party] += voteCount;
            } else {
              overallResults[party] = voteCount;
            }

            if (
              stateWinners[state].winner === null ||
              voteCount > stateWinners[state].voteCount
            ) {
              stateWinners[state].winner = party;
              stateWinners[state].voteCount = voteCount;
            }
          }
        }
      }

      let overallWinner = null;
      let highestVoteCount = null;
      for (const party in overallResults) {
        if (overallResults.hasOwnProperty(party)) {
          const voteCount = overallResults[party];
          if (highestVoteCount === null || voteCount > highestVoteCount) {
            highestVoteCount = voteCount;
            overallWinner = party;
          }
        }
      }

      res.status(200).json({
        overallWinner,
        overallResults,
        stateWinners,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// state winner

app.get("/stateWinner/:state", async (req, res) => {
  try {
    const { state } = req.params;
    const electionResult = await GovElection.findOne({ state });

    if (!electionResult) {
      res.status(404).json({
        error: "No election result found for the specified state.",
      });
    } else {
      const resultData = electionResult.result;
      let stateWinner = null;
      let highestVoteCount = null;

      for (const party in resultData) {
        if (resultData.hasOwnProperty(party)) {
          const voteCount = resultData[party];
          if (highestVoteCount === null || voteCount > highestVoteCount) {
            highestVoteCount = voteCount;
            stateWinner = party;
          }
        }
      }

      res.status(200).json({
        Message: `The winner in this state is ${stateWinner}`,
        state,
        stateWinner,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
})
