const settingsKey = 'tabliczka-app-settings';
const bestKey = 'tabliczka-app-best';
const defaultRange = [2, 3, 4, 5, 6, 7, 8, 9, 10];

const state = {
  activePage: 'learn-multiplication',
  selected: {
    'learn-multiplication': [...defaultRange],
    'learn-division': [...defaultRange],
    'quiz-multiplication': [...defaultRange],
    'quiz-division': [...defaultRange]
  },
  mode: {
    'learn-multiplication': 'table',
    'learn-division': 'table'
  },
  quizCount: {
    'quiz-multiplication': 5,
    'quiz-division': 5
  },
  currentPractice: {
    question: null,
    answer: null
  },
  quiz: {
    questions: [],
    index: 0,
    score: 0,
    errors: 0
  },
  best: {
    'quiz-multiplication': { score: 0, total: 0 },
    'quiz-division': { score: 0, total: 0 }
  }
};

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(settingsKey) || 'null');
  const best = JSON.parse(localStorage.getItem(bestKey) || 'null');
  if (saved) {
    Object.keys(state.selected).forEach(key => {
      if (Array.isArray(saved[key]) && saved[key].length > 0) {
        state.selected[key] = saved[key];
      }
    });
  }
  if (best) {
    state.best = { ...state.best, ...best };
  }
}

function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(state.selected));
}

function saveBestResults() {
  localStorage.setItem(bestKey, JSON.stringify(state.best));
}

function bindTabs() {
  document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      if (target) {
        switchPage(target);
      }
    });
  });
}

function switchPage(page) {
  state.activePage = page;
  document.querySelectorAll('.page').forEach(section => {
    section.classList.toggle('active', section.dataset.page === page);
  });
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === page);
  });
}

function createRangeButtons() {
  const groups = document.querySelectorAll('.range-buttons');
  groups.forEach(panel => {
    const group = panel.dataset.rangeGroup;
    panel.innerHTML = '';
    defaultRange.forEach(value => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'range-button';
      btn.textContent = value;
      btn.dataset.value = value;
      btn.addEventListener('click', () => {
        toggleRange(group, value);
      });
      panel.appendChild(btn);
    });
  });
  updateAllRangeUI();
}

function toggleRange(group, value) {
  const selected = state.selected[group];
  const numericValue = Number(value);
  const index = selected.indexOf(numericValue);
  if (index >= 0 && selected.length === 1) return;
  if (index >= 0) {
    selected.splice(index, 1);
  } else {
    selected.push(numericValue);
    selected.sort((a, b) => a - b);
  }
  saveSettings();
  updateAllRangeUI();
  if (group.startsWith('learn')) renderLearnView(group);
}

function updateAllRangeUI() {
  document.querySelectorAll('.range-buttons').forEach(panel => {
    const group = panel.dataset.rangeGroup;
    panel.querySelectorAll('.range-button').forEach(button => {
      const value = Number(button.dataset.value);
      button.classList.toggle('active', state.selected[group].includes(value));
    });
  });
}

function bindModeSelectors() {
  document.querySelectorAll('[data-mode-group]').forEach(group => {
    const id = group.dataset.modeGroup;
    group.querySelectorAll('.mode-button').forEach(button => {
      button.addEventListener('click', () => {
        state.mode[id] = button.dataset.mode;
        group.querySelectorAll('.mode-button').forEach(btn => btn.classList.toggle('active', btn === button));
        renderLearnView(id);
      });
    });
  });
}

function bindQuizCountSelectors() {
  document.querySelectorAll('[data-quiz-count-group]').forEach(group => {
    const id = group.dataset.quizCountGroup;
    group.querySelectorAll('.mode-button').forEach(button => {
      button.addEventListener('click', () => {
        state.quizCount[id] = Number(button.dataset.count);
        group.querySelectorAll('.mode-button').forEach(btn => btn.classList.toggle('active', btn === button));
      });
    });
  });
}

function renderLearnView(group) {
  const tableContainer = document.getElementById(`${group}-table`);
  const practiceContainer = document.getElementById(`${group}-practice`);
  const content = document.getElementById(`${group}-content`);
  const mode = state.mode[group];

  if (mode === 'table') {
    tableContainer.classList.remove('hidden');
    practiceContainer.classList.add('hidden');
    renderLearnTable(group);
  } else {
    tableContainer.classList.add('hidden');
    practiceContainer.classList.remove('hidden');
    generatePracticeQuestion(group);
  }
}

function renderLearnTable(group) {
  const container = document.getElementById(`${group}-table`);
  const values = state.selected[group];
  const isDivision = group.includes('division');
  container.innerHTML = '';

  if (values.length === 0) {
    container.innerHTML = '<p class="feedback wrong">Wybierz przynajmniej jedną liczbę.</p>';
    return;
  }

  values.forEach(value => {
    const row = document.createElement('div');
    row.className = 'learn-row';
    for (let n = 1; n <= 10; n++) {
      const item = document.createElement('div');
      item.className = 'learn-item';
      if (isDivision) {
        const dividend = value * n;
        item.textContent = `${dividend} ÷ ${value} = ${n}`;
      } else {
        item.textContent = `${value} × ${n} = ${value * n}`;
      }
      row.appendChild(item);
    }
    container.appendChild(row);
  });
}

function generatePracticeQuestion(group) {
  const values = state.selected[group];
  const answerField = document.getElementById(`${group}-answer`);
  const feedback = document.getElementById(`${group}-feedback`);
  feedback.textContent = '';
  answerField.value = '';
  answerField.focus();

  const item = values[Math.floor(Math.random() * values.length)];
  const factor = Math.floor(Math.random() * 10) + 1;
  let questionText;
  let answer;
  if (group.includes('division')) {
    const dividend = item * factor;
    questionText = `${dividend} ÷ ${item}`;
    answer = factor;
  } else {
    questionText = `${item} × ${factor}`;
    answer = item * factor;
  }

  state.currentPractice = { question: questionText, answer };
  document.getElementById(`${group}-question`).textContent = questionText;
}

function bindPracticeControls() {
  ['learn-multiplication', 'learn-division'].forEach(group => {
    document.getElementById(`${group}-check`).addEventListener('click', () => checkPracticeAnswer(group));
    document.getElementById(`${group}-next`).addEventListener('click', () => generatePracticeQuestion(group));
    document.getElementById(`${group}-answer`).addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        checkPracticeAnswer(group);
      }
    });
  });
}

function checkPracticeAnswer(group) {
  const input = document.getElementById(`${group}-answer`);
  const feedback = document.getElementById(`${group}-feedback`);
  const value = Number(input.value.trim());
  if (!input.value.trim() || Number.isNaN(value)) {
    feedback.textContent = 'Wpisz liczbę, aby sprawdzić.';
    feedback.className = 'feedback wrong';
    return;
  }
  const isCorrect = value === state.currentPractice.answer;
  if (isCorrect) {
    feedback.textContent = '✔ Dobrze! Brawo!';
    feedback.className = 'feedback correct';
    setTimeout(() => generatePracticeQuestion(group), 800);
  } else {
    feedback.textContent = `✖ Spróbuj jeszcze raz. Poprawna odpowiedź: ${state.currentPractice.answer}`;
    feedback.className = 'feedback wrong';
  }
}

function bindQuizControls() {
  ['quiz-multiplication', 'quiz-division'].forEach(group => {
    document.getElementById(`${group}-start`).addEventListener('click', () => startQuiz(group));
    document.getElementById(`${group}-check`).addEventListener('click', () => checkQuizAnswer(group));
    document.getElementById(`${group}-next`).addEventListener('click', () => nextQuizQuestion(group));
    document.getElementById(`${group}-restart`).addEventListener('click', () => resetQuiz(group));
    document.getElementById(`${group}-answer`).addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (!document.getElementById(`${group}-panel`)) return;
        if (!document.getElementById(`${group}-next`).disabled) {
          nextQuizQuestion(group);
        } else {
          checkQuizAnswer(group);
        }
      }
    });
  });
}

function startQuiz(group) {
  const values = state.selected[group];
  if (values.length === 0) return;
  const total = state.quizCount[group];
  const panel = document.getElementById(`${group}-panel`);
  const summary = document.getElementById(`${group}-summary`);
  summary.classList.add('hidden');
  panel.classList.remove('hidden');

  state.quiz.questions = generateQuizQuestions(group, total);
  state.quiz.index = 0;
  state.quiz.score = 0;
  state.quiz.errors = 0;
  updateQuizProgress(group);
  renderQuizQuestion(group);
}

function generateQuizQuestions(group, total) {
  const values = state.selected[group];
  const questions = [];
  const type = group === 'quiz-division' ? 'division' : 'multiplication';

  for (let i = 0; i < total; i++) {
    const item = values[Math.floor(Math.random() * values.length)];
    const factor = Math.floor(Math.random() * 10) + 1;
    if (type === 'division') {
      questions.push({ text: `${item * factor} ÷ ${item}`, answer: factor });
    } else {
      questions.push({ text: `${item} × ${factor}`, answer: item * factor });
    }
  }
  return questions;
}

function renderQuizQuestion(group) {
  const question = state.quiz.questions[state.quiz.index];
  const questionText = document.getElementById(`${group}-question`);
  const counter = document.getElementById(`${group}-counter`);
  const answerInput = document.getElementById(`${group}-answer`);
  const feedback = document.getElementById(`${group}-feedback`);
  const nextButton = document.getElementById(`${group}-next`);

  if (!question) return;
  questionText.textContent = question.text;
  counter.textContent = `${state.quiz.index + 1}/${state.quiz.questions.length}`;
  answerInput.value = '';
  answerInput.disabled = false;
  answerInput.focus();
  feedback.textContent = '';
  feedback.className = 'feedback';
  nextButton.disabled = true;
  updateQuizProgress(group);
}

function checkQuizAnswer(group) {
  const answerInput = document.getElementById(`${group}-answer`);
  const feedback = document.getElementById(`${group}-feedback`);
  const nextButton = document.getElementById(`${group}-next`);
  const value = Number(answerInput.value.trim());
  if (!answerInput.value.trim() || Number.isNaN(value)) {
    feedback.textContent = 'Wpisz wynik przed sprawdzeniem.';
    feedback.className = 'feedback wrong';
    return;
  }
  const question = state.quiz.questions[state.quiz.index];
  const correct = value === question.answer;
  if (correct) {
    feedback.textContent = '✔ Super!';
    feedback.className = 'feedback correct';
    state.quiz.score += 1;
  } else {
    feedback.textContent = `✖ Prawidłowo: ${question.answer}`;
    feedback.className = 'feedback wrong';
    state.quiz.errors += 1;
  }
  answerInput.disabled = true;
  nextButton.disabled = false;
  updateQuizProgress(group);
}

function nextQuizQuestion(group) {
  state.quiz.index += 1;
  if (state.quiz.index >= state.quiz.questions.length) {
    finishQuiz(group);
    return;
  }
  renderQuizQuestion(group);
}

function updateQuizProgress(group) {
  const progress = document.getElementById(`${group}-progress`);
  const counter = document.getElementById(`${group}-counter`);
  const total = state.quiz.questions.length || state.quizCount[group];
  const filled = total ? ((state.quiz.index) / total) * 100 : 0;
  progress.style.width = `${filled}%`;
  if (counter) counter.textContent = `${Math.min(state.quiz.index + 1, total)}/${total}`;
}

function finishQuiz(group) {
  const panel = document.getElementById(`${group}-panel`);
  const summary = document.getElementById(`${group}-summary`);
  const points = document.getElementById(`${group}-points`);
  const total = document.getElementById(`${group}-total`);
  const percent = document.getElementById(`${group}-percent`);
  const message = document.getElementById(`${group}-message`);
  const errors = document.getElementById(`${group}-errors`);

  panel.classList.add('hidden');
  summary.classList.remove('hidden');

  const score = state.quiz.score;
  const totalQuestions = state.quiz.questions.length;
  const ratio = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;
  let text = 'Ćwiczymy dalej 😊';
  if (ratio === 100) text = 'Mistrz! 🏆';
  else if (ratio >= 80) text = 'Świetnie! 🌟';
  else if (ratio >= 60) text = 'Dobrze! 💪';

  points.textContent = score;
  total.textContent = totalQuestions;
  percent.textContent = `${ratio}%`;
  message.textContent = text;
  errors.textContent = state.quiz.errors;

  updateBestScore(group, score, totalQuestions);
}

function updateBestScore(group, score, total) {
  const currentBest = state.best[group];
  const newPercent = total ? Math.round((score / total) * 100) : 0;
  const oldPercent = currentBest.total ? Math.round((currentBest.score / currentBest.total) * 100) : -1;
  if (newPercent > oldPercent || (newPercent === oldPercent && score > currentBest.score)) {
    state.best[group] = { score, total };
    saveBestResults();
  }
  renderBestScores();
}

function renderBestScores() {
  ['quiz-multiplication', 'quiz-division'].forEach(group => {
    const bestLabel = document.getElementById(`${group}-best`);
    const best = state.best[group];
    if (best && best.total > 0) {
      bestLabel.textContent = `Najlepszy: ${best.score}/${best.total}`;
    } else {
      bestLabel.textContent = 'Najlepszy: 0/0';
    }
  });
}

function resetQuiz(group) {
  const panel = document.getElementById(`${group}-panel`);
  const summary = document.getElementById(`${group}-summary`);
  summary.classList.add('hidden');
  panel.classList.add('hidden');
  document.getElementById(`${group}-start`).scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  setTimeout(() => {
    splash.classList.add('hide');
  }, 1900);
}

function init() {
  loadSettings();
  bindTabs();
  createRangeButtons();
  bindModeSelectors();
  bindQuizCountSelectors();
  bindPracticeControls();
  bindQuizControls();
  renderLearnView('learn-multiplication');
  renderLearnView('learn-division');
  renderBestScores();
  switchPage(state.activePage);
  hideSplash();
}

window.addEventListener('load', init);
