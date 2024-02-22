const ocean = document.querySelector("#ocean");
const shipContainer = document.querySelector(".ship-container");
const flipButton = document.querySelector("#flip-button");
const startButton = document.querySelector("#start-button");
const infoDisplay = document.querySelector("#info");
const turnDisplay = document.querySelector("#turn-display");
const hitDisplay = document.querySelector("#hit-count");
const missDisplay = document.querySelector("#miss-count");

//flip button logic
let angle = 0;
function flip() {
  const shipOptions = Array.from(shipContainer.children);
  if (angle === 0) {
    angle = 90;
  } else {
    angle = 0;
  }
  shipOptions.forEach(
    (shipOptions) => (shipOptions.style.transform = `rotate(${angle}deg)`)
  );
}

flipButton.addEventListener("click", flip);

// Creating ocean
function createBoard(boardID) {
  const oceanBoard = document.createElement("div");
  oceanBoard.classList.add("oceanBoard");
  oceanBoard.setAttribute("id", boardID);

  for (let i = 0; i < 100; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    tile.setAttribute("id", i);
    oceanBoard.append(tile);
  }
  ocean.append(oceanBoard);
}

createBoard("computer");
createBoard("player");

//Creating Ships
class Ship {
  constructor(name, length) {
    this.name = name;
    this.length = length;
  }
}

const destroyer = new Ship("destroyer", 2);
const submarine = new Ship("submarine", 3);
const cruiser = new Ship("cruiser", 3);
const battleship = new Ship("battleship", 4);
const carrier = new Ship("carrier", 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;

function getValidity(allBoardTiles, isHorizontal, startIndex, ship) {
  let validStart = isHorizontal
    ? startIndex <= 10 * 10 - ship.length
      ? startIndex
      : 10 * 10 - ship.length
    : // handle vertical
    startIndex <= 10 * 10 - 10 * ship.length
    ? startIndex
    : startIndex - ship.length * 10 + 10;

  let shipBlocks = [];

  for (let i = 0; i < ship.length; i++) {
    if (isHorizontal) {
      shipBlocks.push(allBoardTiles[Number(validStart) + i]);
    } else {
      shipBlocks.push(allBoardTiles[Number(validStart) + i * 10]);
    }
  }

  let valid;
  if (isHorizontal) {
    shipBlocks.every(
      (_shipBlock, index) =>
        (valid =
          shipBlocks[0].id % 10 !== 10 - (shipBlocks.length - (index + 1)))
    );
  } else {
    shipBlocks.every(
      (_shipBlock, index) => (valid = shipBlocks[0].id < 90 + (10 * index + 1))
    );
  }

  const notTaken = shipBlocks.every(
    (shipBlock) => !shipBlock.classList.contains("taken")
  );

  return { shipBlocks, valid, notTaken };
}

function addShipPiece(user, ship, startId) {
  const allBoardTiles = document.querySelectorAll(`#${user} div`);
  let randomBoolean = Math.random() < 0.5;
  let isHorizontal = user === "player" ? angle === 0 : randomBoolean;
  let randomStartIndex = Math.floor(Math.random() * 100);

  let startIndex = startId ? startId : randomStartIndex;

  const { shipBlocks, valid, notTaken } = getValidity(
    allBoardTiles,
    isHorizontal,
    startIndex,
    ship
  );

  if (valid && notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add(ship.name);
      shipBlock.classList.add("taken");
    });
  } else {
    if (user === "computer") addShipPiece(user, ship, startId);
    if (user === "player") notDropped = true;
  }
}

ships.forEach((ship) => addShipPiece("computer", ship));

// Drag player ships
let draggedShip;
const optionShips = Array.from(shipContainer.children);
optionShips.forEach((optionShip) =>
  optionShip.addEventListener("dragstart", dragStart)
);

const allPlayerTiles = document.querySelectorAll("#player div");
allPlayerTiles.forEach((playerTile) => {
  playerTile.addEventListener("dragover", dragOver);
  playerTile.addEventListener("drop", dropShip);
});

function dragStart(e) {
  notDropped = false;
  draggedShip = e.target;
}

function dragOver(e) {
  e.preventDefault();
  const ship = ships[draggedShip.id];
  highlightArea(e.target.id, ship);
}

function dropShip(e) {
  const startId = e.target.id;
  const ship = ships[draggedShip.id];
  addShipPiece("player", ship, startId);
  if (!notDropped) {
    draggedShip.remove();
  }
}

//add Highlight
function highlightArea(startIndex, ship) {
  const allBoardTiles = document.querySelectorAll("#player div");
  let isHorizontal = angle === 0;

  const { shipBlocks, valid, notTaken } = getValidity(
    allBoardTiles,
    isHorizontal,
    startIndex,
    ship
  );

  if (valid && notTaken) {
    shipBlocks.forEach((shipBlock) => {
      shipBlock.classList.add("hover");
      setTimeout(() => shipBlock.classList.remove("hover"), 500);
    });
  }
}

// game Logic
let gameOver = false;
let playerTurn;
function startGame() {
  if (playerTurn === undefined) {
    if (shipContainer.children.length != 0) {
      infoDisplay.textContent = "Please place all your pieces first!";
    } else {
      const allBoardTiles = document.querySelectorAll("#computer div");
      allBoardTiles.forEach((tile) =>
        tile.addEventListener("click", handleClick)
      );
      playerTurn = true;
      turnDisplay.textContent = "Your Turn";
      infoDisplay.textContent = "Game has Started!";
      alert("Game has started!");
      hitDisplay.textContent = 0;
      missDisplay.textContent = 0;
    }
  }
}

startButton.addEventListener("click", startGame);

//Game sound
function hitSound() {
  const audio = new Audio("audio/hit.wav");
  audio.play();
}

function missSound() {
  const audio = new Audio("audio/miss.mp3");
  audio.play();
}

let playerHits = [];
let computerHits = [];
const playerSunkShips = [];
const computerSunkShips = [];
let hitCount = 0;
let missCount = 0;

function handleClick(e) {
  if (!gameOver) {
    if (
      e.target.classList.contains("boom") ||
      e.target.classList.contains("miss")
    ) {
      alert("INVALID: You have already hit this tile, please try again!");
      handleClick();
    }
    if (e.target.classList.contains("taken")) {
      hitSound();
      hitCount++;
      hitDisplay.textContent = hitCount;
      e.target.classList.add("boom");
      infoDisplay.textContent = "You hit the computer ship!";
      let classes = Array.from(e.target.classList);
      classes = classes.filter((className) => className !== "tile");
      classes = classes.filter((className) => className !== "boom");
      classes = classes.filter((className) => className !== "taken");
      playerHits.push(...classes);
      checkScore("player", playerHits, playerSunkShips);
    }
    if (!e.target.classList.contains("taken")) {
      missSound();
      missCount++;
      missDisplay.textContent = missCount;
      console.log(missCount);
      infoDisplay.textContent = "You missed!";
      e.target.classList.add("miss");
    }

    playerTurn = false;
    const allBoardTiles = document.querySelectorAll("#computer div");
    allBoardTiles.forEach((tile) =>
      tile.removeEventListener("click", handleClick)
    );
    setTimeout(computerHit, 2000);
  }
}

// Define the computers go
function computerHit() {
  if (!gameOver) {
    turnDisplay.textContent = "Computer's Turn";
    infoDisplay.textContent = "The Computer is thinking...";

    setTimeout(() => {
      let randomHit = Math.floor(Math.random() * 100);
      const allBoardTiles = document.querySelectorAll("#player div");

      if (
        allBoardTiles[randomHit].classList.contains("taken") &&
        allBoardTiles[randomHit].classList.contains("boom")
      ) {
        computerHit();
        return;
      } else if (
        allBoardTiles[randomHit].classList.contains("taken") &&
        !allBoardTiles[randomHit].classList.contains("boom")
      ) {
        hitSound();
        allBoardTiles[randomHit].classList.add("boom");
        infoDisplay.textContent = "The computer hit your ship!";
        let classes = Array.from(allBoardTiles[randomHit].classList);
        classes = classes.filter((className) => className !== "tile");
        classes = classes.filter((className) => className !== "boom");
        classes = classes.filter((className) => className !== "taken");
        computerHits.push(...classes);
        checkScore("computer", computerHits, computerSunkShips);
      } else {
        missSound();
        infoDisplay.textContent = "Missed!";
        allBoardTiles[randomHit].classList.add("miss");
      }
    }, 2000);

    setTimeout(() => {
      playerTurn = true;
      turnDisplay.textContent = "Your Turn";
      infoDisplay.textContent = "Please click the Ocean Board";
      const allBoardTiles = document.querySelectorAll("#computer div");
      allBoardTiles.forEach((tile) =>
        tile.addEventListener("click", handleClick)
      );
    }, 4000);
  }
}

function checkScore(user, userHits, userSunkShips) {
  function checkShip(shipName, shipLength) {
    if (
      userHits.filter((storedShipName) => storedShipName === shipName)
        .length === shipLength
    ) {
      if (user === "player") {
        infoDisplay.textContent = `You sunk the computer's ${shipName}`;
        playerHits = userHits.filter(
          (storedShipName) => storedShipName !== shipName
        );
        const tiles = document.querySelectorAll(`#computer .${shipName}`);
        tiles.forEach((tile) => tile.classList.add("sunk"));
      }
      if (user === "computer") {
        infoDisplay.textContent = `Computer sunk the your ${shipName}`;
        computerHits = userHits.filter(
          (storedShipName) => storedShipName !== shipName
        );
        const tiles = document.querySelectorAll(`#player .${shipName}`);
        tiles.forEach((tile) => tile.classList.add("sunk"));
      }
      userSunkShips.push(shipName);
    }
  }

  checkShip("destroyer", 2);
  checkShip("submarine", 3);
  checkShip("cruiser", 3);
  checkShip("battleship", 4);
  checkShip("carrier", 5);

  if (playerSunkShips.length === 5) {
    infoDisplay.textContent = "You win! Computer Loses!";
    alert("You win! Computer Loses!");
    gameOver = true;
    startButton.innerText = "RESTART GAME";
    //startButton.addEventListener("click", reloadGame);
  }

  if (computerSunkShips.length === 5) {
    infoDisplay.textContent = "You Lost! Computer Wins";
    alert("You Lost! Computer Wins");
    gameOver = true;
    startButton.innerText = "RESTART GAME";
    //startButton.addEventListener("click", reloadGame);
  }
}

// Call resetGame to initialize the game
/* resetGame(); */
