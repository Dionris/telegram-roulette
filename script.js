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
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.balance = 100;
        this.currentBet = { type: null, amount: 10, numbers: [] };
        this.history = [];
        this.isSpinning = false;

        this.setupCanvas();
        this.initializeEventListeners();
        this.drawWheel();
        this.loadHistory();
        this.updateBalance();
    }

    setupCanvas() {
        this.canvas.width = 300;
        this.canvas.height = 300;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 5;
    }

    initializeEventListeners() {
        // Кнопки ставок
        document.querySelectorAll('.bet-button').forEach(button => {
            button.addEventListener('click', () => this.setBet(button.dataset.type));
        });

        // Кнопка вращения
        document.getElementById('spinButton').addEventListener('click', () => this.spin());

        // Создание сетки номеров
        this.createNumbersGrid();
    }

    createNumbersGrid() {
        const numbersContainer = document.querySelector('.numbers');
        for (let i = 1; i <= 36; i++) {
            const numberDiv = document.createElement('div');
            numberDiv.textContent = i;
            numberDiv.className = RED_NUMBERS.includes(i) ? 'red' : 'black';
            numberDiv.addEventListener('click', () => this.setBet('number', i));
            numbersContainer.appendChild(numberDiv);
        }
    }

    setBet(type, number = null) {
        const amount = parseInt(document.getElementById('betAmount').value);
        if (isNaN(amount) || amount <= 0 || amount > this.balance) {
            alert('Неверная сумма ставки!');
            return;
        }

        this.currentBet = {
            type: type,
            amount: amount,
            numbers: number ? [number] : this.getBetNumbers(type)
        };

        document.querySelectorAll('.bet-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) btn.classList.add('active');
        });
    }

    getBetNumbers(type) {
        switch (type) {
            case 'red': return RED_NUMBERS;
            case 'black': return BLACK_NUMBERS;
            case 'even': return Array.from({length: 36}, (_, i) => i + 1).filter(n => n % 2 === 0);
            case 'odd': return Array.from({length: 36}, (_, i) => i + 1).filter(n => n % 2 !== 0);
            case 'low': return Array.from({length: 18}, (_, i) => i + 1);
            case 'high': return Array.from({length: 18}, (_, i) => i + 19);
            default: return [];
        }
    }

    drawWheel() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем колесо
        for (let i = 0; i < ROULETTE_NUMBERS.length; i++) {
            const angle = (i * 2 * Math.PI) / ROULETTE_NUMBERS.length;
            const nextAngle = ((i + 1) * 2 * Math.PI) / ROULETTE_NUMBERS.length;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, angle, nextAngle);
            
            const number = ROULETTE_NUMBERS[i];
            this.ctx.fillStyle = number === 0 ? '#008000' : 
                               RED_NUMBERS.includes(number) ? '#e91e63' : '#333333';
            this.ctx.fill();
            
            // Номера
            this.ctx.save();
            this.ctx.translate(
                this.centerX + (this.radius * 0.75) * Math.cos(angle + (nextAngle - angle) / 2),
                this.centerY + (this.radius * 0.75) * Math.sin(angle + (nextAngle - angle) / 2)
            );
            this.ctx.rotate(angle + Math.PI / 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(number.toString(), 0, 0);
            this.ctx.restore();
        }
    }

    async spin() {
        if (this.isSpinning || !this.currentBet.type) return;
        
        this.isSpinning = true;
        document.getElementById('spinButton').disabled = true;
        
        // Списываем ставку
        this.balance -= this.currentBet.amount;
        this.updateBalance();

        // Анимация вращения
        const spins = 5 + Math.random() * 3;
        const duration = 5000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Функция замедления
            const easeOut = t => 1 - Math.pow(1 - t, 3);
            const currentRotation = spins * 2 * Math.PI * easeOut(progress);
            
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.rotate(currentRotation);
            this.ctx.translate(-this.centerX, -this.centerY);
            this.drawWheel();
            this.ctx.restore();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.finishSpin();
            }
        };
        
        animate();
    }

    finishSpin() {
        const winningNumber = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
        const won = this.currentBet.numbers.includes(winningNumber);
        
        // Расчёт выигрыша
        let winAmount = 0;
        if (won) {
            const multiplier = this.currentBet.type === 'number' ? 35 : 2;
            winAmount = this.currentBet.amount * multiplier;
            this.balance += winAmount;
        }
        
        // Обновляем историю
        this.history.unshift({
            number: winningNumber,
            won: won,
            amount: winAmount - this.currentBet.amount
        });
        this.saveHistory();
        this.updateHistory();
        this.updateBalance();
        
        // Показываем результат
        document.getElementById('result').textContent = 
            `${winningNumber} ${won ? '(+' + winAmount + ')' : ''}`;
        
        setTimeout(() => {
            document.getElementById('result').textContent = '';
            document.getElementById('spinButton').disabled = false;
            this.isSpinning = false;
        }, 3000);
    }

    updateBalance() {
        document.getElementById('balance').textContent = this.balance;
        // Отправляем данные в Telegram
        tg.sendData(JSON.stringify({ balance: this.balance }));
    }

    saveHistory() {
        localStorage.setItem('rouletteHistory', JSON.stringify(this.history.slice(0, 10)));
    }

    loadHistory() {
        const saved = localStorage.getItem('rouletteHistory');
        this.history = saved ? JSON.parse(saved) : [];
        this.updateHistory();
    }

    updateHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = this.history
            .map(h => `<div class="history-item ${h.amount >= 0 ? 'win' : 'loss'}">
                ${h.number} (${h.amount >= 0 ? '+' : ''}${h.amount})</div>`)
            .join('');
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    new RouletteGame();
}); 