// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();

// Конфигурация рулетки
const ROULETTE_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

class RouletteGame {
    constructor() {
        this.balance = 100;
        this.currentBet = { type: null, amount: 10, numbers: [] };
        this.lastNumbers = [];
        this.isSpinning = false;
        this.totalWon = 0;
        this.maxWin = 0;
        this.spinSound = new Audio('sounds/spin.mp3');
        this.winSound = new Audio('sounds/win.mp3');
        this.loseSound = new Audio('sounds/lose.mp3');

        this.initializeEventListeners();
        this.createNumbersGrid();
        this.loadGameState();
        this.updateUI();
    }

    initializeEventListeners() {
        // Кнопки ставок
        document.querySelectorAll('.bet-button').forEach(button => {
            button.addEventListener('click', () => this.setBet(button.dataset.type));
        });

        // Кнопки управления ставкой
        document.getElementById('decreaseBet').addEventListener('click', () => this.adjustBet(-10));
        document.getElementById('increaseBet').addEventListener('click', () => this.adjustBet(10));
        document.getElementById('betAmount').addEventListener('change', (e) => this.validateBetAmount(e.target));

        // Кнопка вращения
        document.getElementById('spinButton').addEventListener('click', () => this.spin());
    }

    createNumbersGrid() {
        const grid = document.getElementById('numbersGrid');
        grid.innerHTML = '';

        // Добавляем числа от 1 до 36
        for (let i = 1; i <= 36; i++) {
            const cell = document.createElement('div');
            cell.className = 'number-cell';
            cell.textContent = i;
            cell.style.backgroundColor = RED_NUMBERS.includes(i) ? '#e91e63' : '#333333';
            cell.addEventListener('click', () => this.setBet('number', i));
            grid.appendChild(cell);
        }
    }

    drawWheel() {
        // Implementation of drawWheel method
    }

    setBet(type, number = null) {
        const amount = parseInt(document.getElementById('betAmount').value);
        if (isNaN(amount) || amount <= 0 || amount > this.balance) {
            this.showNotification('Неверная сумма ставки!');
            return;
        }

        this.currentBet = {
            type: type,
            amount: amount,
            numbers: number !== null ? [number] : this.getBetNumbers(type)
        };

        document.querySelectorAll('.bet-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) btn.classList.add('active');
        });

        document.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.remove('active');
            if (number !== null && cell.textContent === number.toString()) {
                cell.classList.add('active');
            }
        });
    }

    getBetNumbers(type) {
        switch (type) {
            case 'red': return RED_NUMBERS;
            case 'black': return BLACK_NUMBERS;
            case 'green': return [0];
            case 'even': return Array.from({length: 36}, (_, i) => i + 1).filter(n => n % 2 === 0);
            case 'odd': return Array.from({length: 36}, (_, i) => i + 1).filter(n => n % 2 !== 0);
            case 'low': return Array.from({length: 18}, (_, i) => i + 1);
            case 'high': return Array.from({length: 18}, (_, i) => i + 19);
            default: return [];
        }
    }

    async spin() {
        if (this.isSpinning || !this.currentBet.type) {
            this.showNotification('Выберите ставку!');
            return;
        }
        
        this.isSpinning = true;
        document.getElementById('spinButton').disabled = true;
        
        // Списываем ставку
        this.balance -= this.currentBet.amount;
        this.updateUI();

        try {
            this.spinSound.currentTime = 0;
            await this.spinSound.play();
        } catch (e) {
            console.log('Звук отключен');
        }

        // Создаем элемент с прокруткой чисел в стиле CS2
        const spinContainer = document.createElement('div');
        spinContainer.className = 'cs2-spin-container';
        spinContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            transform: translateY(-50%);
            white-space: nowrap;
            animation: cs2Spin 3s cubic-bezier(0.1, 0.7, 0.1, 1) forwards;
        `;

        // Генерируем случайные числа для анимации
        const spinNumbers = Array.from({length: 50}, () => 
            ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)]
        );

        // Добавляем выигрышное число в конец
        const winningNumber = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
        spinNumbers.push(winningNumber);

        // Создаем элементы чисел
        spinNumbers.forEach(num => {
            const numElement = document.createElement('span');
            numElement.className = 'spin-number';
            numElement.textContent = num;
            numElement.style.cssText = `
                display: inline-block;
                width: 40px;
                height: 40px;
                line-height: 40px;
                text-align: center;
                margin: 0 5px;
                border-radius: 50%;
                background: ${num === 0 ? '#4CAF50' : 
                            RED_NUMBERS.includes(num) ? '#e91e63' : '#333333'};
            `;
            spinContainer.appendChild(numElement);
        });

        document.querySelector('.wheel-container').appendChild(spinContainer);

        // Ждем окончания анимации
        setTimeout(() => {
            spinContainer.remove();
            this.finishSpin(winningNumber);
        }, 3000);
    }

    finishSpin(winningNumber) {
        const won = this.currentBet.numbers.includes(winningNumber);
        
        let winAmount = 0;
        if (won) {
            const multiplier = this.currentBet.type === 'number' || this.currentBet.type === 'green' ? 35 : 2;
            winAmount = this.currentBet.amount * multiplier;
            this.balance += winAmount;
            this.totalWon += winAmount - this.currentBet.amount;
            this.maxWin = Math.max(this.maxWin, winAmount - this.currentBet.amount);

            try {
                this.winSound.currentTime = 0;
                this.winSound.play();
            } catch (e) {}
        } else {
            try {
                this.loseSound.currentTime = 0;
                this.loseSound.play();
            } catch (e) {}
        }
        
        this.lastNumbers.unshift({
            number: winningNumber,
            color: winningNumber === 0 ? 'green' : 
                   RED_NUMBERS.includes(winningNumber) ? 'red' : 'black'
        });
        if (this.lastNumbers.length > 10) this.lastNumbers.pop();
        
        this.saveGameState();
        this.updateUI();
        
        const result = document.getElementById('result');
        result.textContent = `${winningNumber} ${won ? '(+' + winAmount + ')' : ''}`;
        result.classList.add('show');
        
        setTimeout(() => {
            result.classList.remove('show');
            document.getElementById('spinButton').disabled = false;
            this.isSpinning = false;
        }, 3000);
    }

    adjustBet(amount) {
        const input = document.getElementById('betAmount');
        let newValue = parseInt(input.value) + amount;
        newValue = Math.max(1, Math.min(newValue, this.balance));
        input.value = newValue;
    }

    validateBetAmount(input) {
        let value = parseInt(input.value);
        if (isNaN(value) || value < 1) value = 1;
        if (value > this.balance) value = this.balance;
        input.value = value;
    }

    showNotification(message) {
        // В будущем можно добавить красивые уведомления
        alert(message);
    }

    updateUI() {
        // Обновляем баланс
        document.getElementById('balance').textContent = this.balance;
        
        // Обновляем статистику
        document.getElementById('totalWon').textContent = this.totalWon + ' ⭐';
        document.getElementById('maxWin').textContent = this.maxWin + ' ⭐';
        
        // Обновляем историю
        const historyList = document.getElementById('lastNumbersList');
        historyList.innerHTML = this.lastNumbers
            .map(h => `<div class="last-number ${h.color}">${h.number}</div>`)
            .join('');
        
        // Отправляем данные в Telegram
        tg.sendData(JSON.stringify({ balance: this.balance }));
    }

    saveGameState() {
        const state = {
            balance: this.balance,
            lastNumbers: this.lastNumbers,
            totalWon: this.totalWon,
            maxWin: this.maxWin
        };
        localStorage.setItem('rouletteState', JSON.stringify(state));
    }

    loadGameState() {
        const saved = localStorage.getItem('rouletteState');
        if (saved) {
            const state = JSON.parse(saved);
            this.balance = state.balance;
            this.lastNumbers = state.lastNumbers;
            this.totalWon = state.totalWon;
            this.maxWin = state.maxWin;
        }
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    new RouletteGame();
}); 