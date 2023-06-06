let allSymbols = ["😂", "🤢", "👽", "😱", "🙈", "😈"];
let star = "⭐";

let aspect_ratio = 500 / 640;
let wth = Math.min(screen.width, 640);
let hgt = aspect_ratio * wth;
let size_ratio = wth / 640;
let sizef = size => size * size_ratio;
let top_left = [sizef(10), sizef(10)];
let boardHeight = sizef(430);
let boardWidth = sizef(430);
let bottom_right = (function() {
  let [x, y] = top_left;
  return [x + boardWidth, y + boardHeight];
})();

const state = {
  symbols: [],
  symbol_values: [],
  num_cols: 3,
  num_rows: 3,
  grid: [],
  inputs: [],
};

// function shuffle(array) {
//   var currentIndex = array.length,
//     temporaryValue,
//     randomIndex;

//   // While there remain elements to shuffle...
//   while (0 !== currentIndex) {
//     // Pick a remaining element...
//     randomIndex = Math.floor(Math.random() * currentIndex);
//     currentIndex -= 1;

//     // And swap it with the current element.
//     temporaryValue = array[currentIndex];
//     array[currentIndex] = array[randomIndex];
//     array[randomIndex] = temporaryValue;
//   }

//   return array;
// }

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function getEmojiSize() {
  // go from 75 -> 50 as #symbols goes from 2 -> 6
  return sizef(map(state.symbols.length, 2, 6, 75, 50));
}

function getTextSize() {
  // go from 32 -> 24 as #symbols goes from 2 -> 6
  return sizef(map(state.symbols.length, 2, 6, 32, 24));
}

function drawBoard() {
  let [x1, y1] = top_left;
  let [x2, y2] = bottom_right;
  for (i = 0; i <= state.num_cols; i++) {
    x = x1 + (i * (x2 - x1)) / (state.num_cols + 1);
    line(x, y1, x, y2);
  }
  for (i = 0; i <= state.num_rows; i++) {
    y = y1 + (i * (y2 - y1)) / (state.num_rows + 1);
    line(x1, y, x2, y);
  }
}

function drawSymbol(symbol, size, i, j) {
  let [x1, y1] = top_left;
  let [x2, y2] = bottom_right;
  x = x1 + ((x2 - x1) * (i + 0.5)) / (state.num_cols + 1);
  y = y1 + ((y2 - y1) * (j + 0.5)) / (state.num_rows + 1);
  textAlign(CENTER, CENTER);
  textSize(size);
  text(symbol, x, y);
}

function hasUniqueSolution(A) {
  let AT = math.transpose(A);
  let ATA = math.multiply(AT, A);
  return math.det(ATA) !== 0;
}

function matrix() {
  let A = math.zeros(state.num_rows + state.num_cols, state.symbols.length);
  // rows
  for (let j = 0; j < state.num_rows; j++) {
    for (let i = 0; i < state.num_cols; i++) {
      let symbol_index = state.grid[i][j];
      let cur = A.subset(math.index(j, symbol_index));
      A.subset(math.index(j, symbol_index), cur + 1);
    }
  }
  // cols
  for (let i = 0; i < state.num_cols; i++) {
    for (let j = 0; j < state.num_rows; j++) {
      let symbol_index = state.grid[i][j];
      let cur = A.subset(math.index(state.num_rows + i, symbol_index));
      A.subset(math.index(state.num_rows + i, symbol_index), cur + 1);
    }
  }

  return A;
}

function computeRowSum(row, symbol_values) {
  let sum = 0;
  for (let i = 0; i < state.num_cols; i++) {
    sum += symbol_values[state.grid[i][row]];
  }
  return sum;
}

function computeColSum(col, symbol_values) {
  let sum = 0;
  for (let j = 0; j < state.num_rows; j++) {
    sum += symbol_values[state.grid[col][j]];
  }
  return sum;
}

function newGrid() {
  let grid = [];
  for (let i = 0; i < state.num_cols; i++) {
    grid.push([]);
    for (let j = 0; j < state.num_rows; j++) {
      let symbol_idx = getRandomInt(state.symbols.length);
      grid[i].push(symbol_idx);
    }
  }
  return grid;
}

function drawSymbols() {
  for (let i = 0; i < state.num_cols; i++) {
    for (let j = 0; j < state.num_rows; j++) {
      let symbol_idx = state.grid[i][j];
      drawSymbol(state.symbols[symbol_idx], getEmojiSize(), i, j);
    }
  }
}

function drawSums() {
  // draw sums
  for (let i = 0; i < state.num_cols; i++) {
    let sum = computeColSum(i, state.symbol_values);
    drawSymbol(`${sum}`, getTextSize(), i, state.num_rows - 0.2);
  }
  for (let j = 0; j < state.num_rows; j++) {
    let sum = computeRowSum(j, state.symbol_values);
    drawSymbol(`${sum}`, getTextSize(), state.num_cols - 0.2, j);
  }
}

function drawGuessArea(createInputs) {
  // draw guess area
  let x = sizef(500);
  let y_start = sizef(50);
  let y = y_start;
  let size = sizef(32);
  textSize(size);
  for (let symbol of state.symbols) {
    text(`${symbol} = `, x, y);
    if (createInputs) {
      let input = createInput("", "tel");
      input.parent("sketch");
      input.position(x + size + 10, y);
      input.size(50);

      state.inputs.push(input);
    }
    y += (0.9 * boardHeight - y_start) / state.symbols.length;
  }
  return [x, y];
}

function drawGame({ createInputs }) {
  fill("black");
  drawBoard();
  drawSymbols();
  drawSums();
  let [x, y] = drawGuessArea(createInputs);
  return [x, y];
}

function getGuesses() {
  return state.inputs.map(i => {
    let v = i.value();
    return v ? int(v) : 0;
  });
}

function newState() {
  let num_symbols = max(state.num_cols, state.num_rows);
  let symbols = shuffle(allSymbols);
  state.symbols = symbols.slice(0, num_symbols);
  let max_symbol_value = 30;
  state.symbol_values = state.symbols.map(_ => getRandomInt(max_symbol_value));
  console.log(state.symbol_values);
  state.grid = newGrid();
  console.log("has unique solution:", hasUniqueSolution(matrix()));
}

function hardReset() {
  clear();
  state.inputs = [];
  for (let el of Array.from(document.querySelector("#sketch").children)) {
    el.remove();
  }
}

function preload() {
  incorrect = loadSound("wrong.wav");
  correct = loadSound("right.wav");
}

function setup() {
  let canvas = createCanvas(wth, hgt);
  canvas.parent("sketch");
  newState();
  // let guessCanvas = createGraphics(640, 400);

  let [x, y] = drawGame({ createInputs: true });

  {
    let x = sizef(150);
    let y = sizef(460);
    rows_slider = createSlider(2, 6, state.num_rows);
    rows_slider.parent("sketch");
    cols_slider = createSlider(2, 6, state.num_cols);
    cols_slider.parent("sketch");
    textSize(sizef(15));
    textAlign(RIGHT, CENTER);
    text(`number of rows: ${rows_slider.value()}`, x, y);
    rows_slider.position(x + 10, y);
    text(`number of cols: ${cols_slider.value()}`, x, y + 20);
    cols_slider.position(x + 10, y + 20);
    rows_slider.input(x => {
      state.num_rows = rows_slider.value();
      hardReset();
      setup();
    });
    cols_slider.input(x => {
      state.num_cols = cols_slider.value();
      hardReset();
      setup();
    });
  }

  let button_background_color = "#990fd2";
  {
    let button = createButton("check answer");
    button.parent("sketch");
    button.style("background-color", button_background_color);
    button.style("color", "white");
    button.position(x, y);
    button.style("cursor: pointer");
    button.style("border-radius", "5px");
    button.mousePressed(() => {
      erase();
      let [x1, y1] = top_left;
      let [x2, y2] = bottom_right;
      rect(x1, y1, x2, y2);
      noErase();
      drawGame({ createInputs: false });
      let guesses = getGuesses();
      let allCorrect = true;

      for (let i = 0; i < state.num_cols; i++) {
        let sum = computeColSum(i, state.symbol_values);
        let guessSum = computeColSum(i, guesses);
        let correct = sum === guessSum;
        allCorrect = allCorrect && correct;
        fill(correct ? "green" : "red");
        drawSymbol(guessSum, getTextSize(), i, state.num_rows + 0.25);
      }
      for (let j = 0; j < state.num_rows; j++) {
        let sum = computeRowSum(j, state.symbol_values);
        let guessSum = computeRowSum(j, guesses);
        let correct = sum === guessSum;
        allCorrect = allCorrect && correct;
        fill(correct ? "green" : "red");
        drawSymbol(guessSum, getTextSize(), state.num_cols + 0.25, j);
      }

      if (allCorrect) {
        drawSymbol(star, getEmojiSize(), state.num_cols, state.num_rows);
        correct.play();
      } else {
        incorrect.play();
      }
    });
  }
  y += 30;
  {
    let button = createButton("new game");
    button.parent("sketch");
    button.style("background-color", button_background_color);
    button.style("color", "white");
    button.position(x, y);
    button.style("cursor: pointer");
    button.style("border-radius", "5px");
    button.mousePressed(() => {
      hardReset();
      setup();
    });
  }
}

function draw() {}
