class MonsterEvolutionRPG {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 4;
        this.tileSize = 0;
        this.tileGap = 0;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestMonsterRPG') || '0');
        this.previousState = null;
        this.animatingTiles = [];
        this.skillEffects = [];
        
        // RPG 몬스터 진화 시스템
        this.monsters = {
            0: { name: '', emoji: '', color: '#cdc1b4', description: '', level: '' },
            2: { name: '슬라임', emoji: '🟢', color: '#eee4da', description: 'Lv.1 기본 슬라임', level: 'Lv.1', skill: null },
            4: { name: '버섯', emoji: '🍄', color: '#ede0c8', description: 'Lv.2 독버섯', level: 'Lv.2', skill: null },
            8: { name: '박쥐', emoji: '🦇', color: '#f2b179', description: 'Lv.3 어둠의 박쥐', level: 'Lv.3', skill: 'dark' },
            16: { name: '거미', emoji: '🕷️', color: '#f59563', description: 'Lv.4 맹독 거미', level: 'Lv.4', skill: 'poison' },
            32: { name: '늑대', emoji: '🐺', color: '#f67c5f', description: 'Lv.5 은빛 늑대', level: 'Lv.5', skill: 'howl' },
            64: { name: '곰', emoji: '🐻', color: '#f65e3b', description: 'Lv.6 광포한 곰', level: 'Lv.6', skill: 'rage' },
            128: { name: '독수리', emoji: '🦅', color: '#edcf72', description: 'Lv.7 천둥 독수리', level: 'Lv.7', skill: 'thunder' },
            256: { name: '사자', emoji: '🦁', color: '#edcc61', description: 'Lv.8 황금 사자', level: 'Lv.8', skill: 'roar' },
            512: { name: '용', emoji: '🐉', color: '#edc850', description: 'Lv.9 화염 용', level: 'Lv.9', skill: 'fire' },
            1024: { name: '피닉스', emoji: '🔥', color: '#edc53f', description: 'Lv.10 불사조', level: 'Lv.10', skill: 'rebirth' },
            2048: { name: '신룡', emoji: '⭐', color: '#edc22e', description: 'Lv.MAX 전설의 신룡', level: 'Lv.MAX', skill: 'ultimate' },
            4096: { name: '천신', emoji: '👑', color: '#3c3a32', description: 'Lv.GOD 천상의 지배자', level: 'Lv.GOD', skill: 'divine' },
            8192: { name: '창조신', emoji: '🌌', color: '#2c2a22', description: 'Lv.∞ 만물의 창조자', level: 'Lv.∞', skill: 'creation' }
        };

        this.textColors = {
            2: '#776e65',
            4: '#776e65',
            default: '#f9f6f2'
        };

        this.touchStartX = null;
        this.touchStartY = null;
        this.isMoving = false;
        this.comboCount = 0;
        this.lastMergeTime = 0;
        
        // 특수 스킬 쿨다운
        this.skillCooldowns = {};
        this.autoSkillChance = 0.1; // 10% 확률로 자동 스킬 발동

        this.init();
    }

    init() {
        this.setupCanvas();
        this.initGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.updateScore();
        this.updateMonsterInfo();
        this.draw();
        this.setupEventListeners();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.offsetWidth - 40, 460);
        this.canvas.width = size;
        this.canvas.height = size;
        this.tileGap = size * 0.02;
        this.tileSize = (size - this.tileGap * (this.gridSize + 1)) / this.gridSize;
    }

    initGrid() {
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({x: i, y: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // 90% 확률로 슬라임(2), 10% 확률로 버섯(4) 생성
            const value = Math.random() < 0.9 ? 2 : 4;
            this.grid[randomCell.x][randomCell.y] = value;
            
            // 새 몬스터 소환 애니메이션
            this.animatingTiles.push({
                x: randomCell.x,
                y: randomCell.y,
                value: value,
                scale: 0,
                type: 'appear',
                rotation: 0
            });
            this.animateTile();
        }
    }

    animateTile() {
        const animate = () => {
            let hasAnimation = false;
            
            for (let i = this.animatingTiles.length - 1; i >= 0; i--) {
                const tile = this.animatingTiles[i];
                
                if (tile.type === 'appear') {
                    tile.scale += 0.15;
                    tile.rotation += 20;
                    if (tile.scale >= 1) {
                        tile.scale = 1;
                        tile.rotation = 0;
                        this.animatingTiles.splice(i, 1);
                    } else {
                        hasAnimation = true;
                    }
                } else if (tile.type === 'merge') {
                    tile.scale += 0.1;
                    tile.rotation += 15;
                    if (tile.scale >= 1.3) {
                        tile.scale = 1.3;
                        tile.type = 'shrink';
                        
                        // 진화 이펙트 추가
                        this.addEvolutionEffect(tile.x, tile.y);
                    }
                    hasAnimation = true;
                } else if (tile.type === 'shrink') {
                    tile.scale -= 0.1;
                    if (tile.scale <= 1) {
                        tile.scale = 1;
                        tile.rotation = 0;
                        this.animatingTiles.splice(i, 1);
                    } else {
                        hasAnimation = true;
                    }
                }
            }
            
            // 스킬 이펙트 애니메이션
            for (let i = this.skillEffects.length - 1; i >= 0; i--) {
                const effect = this.skillEffects[i];
                effect.opacity -= 0.05;
                effect.size += 5;
                
                if (effect.opacity <= 0) {
                    this.skillEffects.splice(i, 1);
                } else {
                    hasAnimation = true;
                }
            }
            
            this.draw();
            
            if (hasAnimation) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    addEvolutionEffect(row, col) {
        const x = this.tileGap + col * (this.tileSize + this.tileGap) + this.tileSize / 2;
        const y = this.tileGap + row * (this.tileSize + this.tileGap) + this.tileSize / 2;
        
        this.skillEffects.push({
            x: x,
            y: y,
            size: 20,
            opacity: 1,
            color: '#FFD700',
            type: 'evolution'
        });
    }

    triggerSkill(value, row, col) {
        const monster = this.monsters[value];
        if (!monster.skill || Math.random() > this.autoSkillChance) return;
        
        const x = this.tileGap + col * (this.tileSize + this.tileGap) + this.tileSize / 2;
        const y = this.tileGap + row * (this.tileSize + this.tileGap) + this.tileSize / 2;
        
        switch(monster.skill) {
            case 'fire':
                // 화염: 주변 타일에 보너스 점수
                this.score += 100;
                this.skillEffects.push({
                    x: x,
                    y: y,
                    size: 40,
                    opacity: 1,
                    color: '#FF4500',
                    type: 'fire'
                });
                break;
            case 'thunder':
                // 번개: 랜덤 타일 하나 업그레이드
                this.upgradeRandomTile();
                this.skillEffects.push({
                    x: x,
                    y: y,
                    size: 60,
                    opacity: 1,
                    color: '#FFD700',
                    type: 'thunder'
                });
                break;
            case 'rebirth':
                // 부활: 게임오버 방지 1회
                this.skillEffects.push({
                    x: x,
                    y: y,
                    size: 80,
                    opacity: 1,
                    color: '#FF69B4',
                    type: 'rebirth'
                });
                break;
        }
    }

    upgradeRandomTile() {
        const tiles = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 2) {
                    tiles.push({x: i, y: j});
                }
            }
        }
        
        if (tiles.length > 0) {
            const random = tiles[Math.floor(Math.random() * tiles.length)];
            this.grid[random.x][random.y] = 4;
        }
    }

    draw() {
        // 배경
        this.ctx.fillStyle = '#bbada0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 그리드 배경
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const x = this.tileGap + j * (this.tileSize + this.tileGap);
                const y = this.tileGap + i * (this.tileSize + this.tileGap);
                
                this.ctx.fillStyle = '#cdc1b4';
                this.roundRect(x, y, this.tileSize, this.tileSize, 6);
            }
        }

        // 몬스터 타일 그리기
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const value = this.grid[i][j];
                if (value !== 0) {
                    const x = this.tileGap + j * (this.tileSize + this.tileGap);
                    const y = this.tileGap + i * (this.tileSize + this.tileGap);
                    
                    // 애니메이션 중인 타일 확인
                    let scale = 1;
                    let rotation = 0;
                    const animatingTile = this.animatingTiles.find(t => t.x === i && t.y === j);
                    if (animatingTile) {
                        scale = animatingTile.scale;
                        rotation = animatingTile.rotation;
                    }
                    
                    this.drawMonsterTile(x, y, value, scale, rotation);
                }
            }
        }
        
        // 스킬 이펙트 그리기
        for (const effect of this.skillEffects) {
            this.ctx.save();
            this.ctx.globalAlpha = effect.opacity;
            this.ctx.strokeStyle = effect.color;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
            this.ctx.stroke();
            
            if (effect.type === 'evolution') {
                // 별 모양 그리기
                this.drawStar(effect.x, effect.y, effect.size * 0.5, 5);
            }
            
            this.ctx.restore();
        }
    }

    drawStar(cx, cy, radius, points) {
        this.ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const r = i % 2 === 0 ? radius : radius * 0.5;
            const x = cx + Math.cos(angle - Math.PI / 2) * r;
            const y = cy + Math.sin(angle - Math.PI / 2) * r;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
    }

    drawMonsterTile(x, y, value, scale = 1, rotation = 0) {
        const centerX = x + this.tileSize / 2;
        const centerY = y + this.tileSize / 2;
        const monster = this.monsters[value] || this.monsters[4096];
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate((rotation * Math.PI) / 180);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-centerX, -centerY);
        
        // 타일 배경
        this.ctx.fillStyle = monster.color;
        this.roundRect(x, y, this.tileSize, this.tileSize, 6);
        
        // 몬스터 이모지
        this.ctx.font = `${this.tileSize * 0.4}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(monster.emoji, centerX, centerY - this.tileSize * 0.1);
        
        // 레벨 표시
        this.ctx.fillStyle = this.textColors[value] || this.textColors.default;
        this.ctx.font = `bold ${this.tileSize * 0.18}px Arial`;
        this.ctx.fillText(monster.level, centerX, centerY + this.tileSize * 0.25);
        
        this.ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    move(direction) {
        if (this.isMoving) return;
        this.isMoving = true;

        // 이전 상태 저장
        this.savePreviousState();

        let moved = false;
        const newGrid = JSON.parse(JSON.stringify(this.grid));
        const mergedPositions = [];

        if (direction === 'left') {
            for (let i = 0; i < this.gridSize; i++) {
                const row = this.extractRow(newGrid, i);
                const result = this.mergeArray(row, mergedPositions, i, 'row');
                if (this.arrayChanged(row, result.array)) moved = true;
                this.insertRow(newGrid, i, result.array);
            }
        } else if (direction === 'right') {
            for (let i = 0; i < this.gridSize; i++) {
                const row = this.extractRow(newGrid, i).reverse();
                const result = this.mergeArray(row, mergedPositions, i, 'row-reverse');
                if (this.arrayChanged(row.reverse(), result.array.reverse())) moved = true;
                this.insertRow(newGrid, i, result.array);
            }
        } else if (direction === 'up') {
            for (let j = 0; j < this.gridSize; j++) {
                const col = this.extractColumn(newGrid, j);
                const result = this.mergeArray(col, mergedPositions, j, 'col');
                if (this.arrayChanged(col, result.array)) moved = true;
                this.insertColumn(newGrid, j, result.array);
            }
        } else if (direction === 'down') {
            for (let j = 0; j < this.gridSize; j++) {
                const col = this.extractColumn(newGrid, j).reverse();
                const result = this.mergeArray(col, mergedPositions, j, 'col-reverse');
                if (this.arrayChanged(col.reverse(), result.array.reverse())) moved = true;
                this.insertColumn(newGrid, j, result.array);
            }
        }

        if (moved) {
            this.grid = newGrid;
            
            // 병합된 위치에 진화 애니메이션 추가
            for (const pos of mergedPositions) {
                this.animatingTiles.push({
                    x: pos.x,
                    y: pos.y,
                    value: this.grid[pos.x][pos.y],
                    scale: 1,
                    rotation: 0,
                    type: 'merge'
                });
                
                // 스킬 발동 체크
                this.triggerSkill(this.grid[pos.x][pos.y], pos.x, pos.y);
            }
            
            this.animateTile();
            
            setTimeout(() => {
                this.addRandomTile();
                this.checkGameOver();
                this.updateMonsterInfo();
            }, 150);
        } else {
            this.previousState = null;
        }

        this.draw();
        this.updateScore();
        
        setTimeout(() => {
            this.isMoving = false;
        }, 200);
    }

    extractRow(grid, row) {
        return grid[row].slice();
    }

    insertRow(grid, row, arr) {
        grid[row] = arr.slice();
    }

    extractColumn(grid, col) {
        const column = [];
        for (let i = 0; i < this.gridSize; i++) {
            column.push(grid[i][col]);
        }
        return column;
    }

    insertColumn(grid, col, arr) {
        for (let i = 0; i < this.gridSize; i++) {
            grid[i][col] = arr[i];
        }
    }

    mergeArray(arr, mergedPositions, index, type) {
        const result = arr.filter(val => val !== 0);
        
        for (let i = 0; i < result.length - 1; i++) {
            if (result[i] === result[i + 1]) {
                result[i] *= 2;
                
                // 콤보 시스템
                const now = Date.now();
                if (now - this.lastMergeTime < 1000) {
                    this.comboCount++;
                    this.score += result[i] * (1 + this.comboCount * 0.5);
                } else {
                    this.comboCount = 0;
                    this.score += result[i];
                }
                this.lastMergeTime = now;
                
                // 병합 위치 기록
                let x, y;
                if (type === 'row') {
                    x = index;
                    y = i;
                } else if (type === 'row-reverse') {
                    x = index;
                    y = this.gridSize - 1 - i;
                } else if (type === 'col') {
                    x = i;
                    y = index;
                } else if (type === 'col-reverse') {
                    x = this.gridSize - 1 - i;
                    y = index;
                }
                mergedPositions.push({x, y});
                
                result.splice(i + 1, 1);
            }
        }
        
        while (result.length < this.gridSize) {
            result.push(0);
        }
        
        return { array: result };
    }

    arrayChanged(arr1, arr2) {
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return true;
        }
        return false;
    }

    savePreviousState() {
        this.previousState = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score
        };
    }

    undo() {
        if (this.previousState) {
            this.grid = this.previousState.grid;
            this.score = this.previousState.score;
            this.previousState = null;
            this.draw();
            this.updateScore();
            this.updateMonsterInfo();
        }
    }

    updateMonsterInfo() {
        let highestValue = 0;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] > highestValue) {
                    highestValue = this.grid[i][j];
                }
            }
        }
        
        const monster = this.monsters[highestValue];
        if (monster && monster.name) {
            const info = document.getElementById('current-monster-info');
            info.textContent = `최고 진화: ${monster.description}`;
        }
    }

    checkGameOver() {
        // 빈 칸이 있는지 확인
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // 병합 가능한 타일이 있는지 확인
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const current = this.grid[i][j];
                if (j < this.gridSize - 1 && current === this.grid[i][j + 1]) return false;
                if (i < this.gridSize - 1 && current === this.grid[i + 1][j]) return false;
            }
        }

        // 최종 진화체 달성 체크
        let highestValue = 0;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] > highestValue) {
                    highestValue = this.grid[i][j];
                }
            }
        }

        this.gameOver(highestValue >= 2048);
        return true;
    }

    gameOver(won) {
        const overlay = document.getElementById('gameOverOverlay');
        const title = document.getElementById('gameOverTitle');
        const finalScore = document.getElementById('finalScore');
        const highestMonster = document.getElementById('highest-monster');
        
        let highestValue = 0;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] > highestValue) {
                    highestValue = this.grid[i][j];
                }
            }
        }
        
        const monster = this.monsters[highestValue];
        title.textContent = won ? '전설 달성!' : '모험 종료!';
        finalScore.textContent = this.score;
        highestMonster.textContent = `도달한 최고 진화: ${monster.emoji} ${monster.description}`;
        
        overlay.style.display = 'flex';
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestMonsterRPG', this.bestScore.toString());
            this.updateScore();
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
    }

    newGame() {
        this.score = 0;
        this.previousState = null;
        this.animatingTiles = [];
        this.skillEffects = [];
        this.comboCount = 0;
        this.initGrid();
        this.addRandomTile();
        this.addRandomTile();
        this.draw();
        this.updateScore();
        this.updateMonsterInfo();
        document.getElementById('gameOverOverlay').style.display = 'none';
    }

    setupEventListeners() {
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.move('left');
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.move('right');
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.move('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.move('down');
            }
        });

        // 터치 이벤트
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.touchStartX || !this.touchStartY) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            const minSwipeDistance = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }

            this.touchStartX = null;
            this.touchStartY = null;
        });

        // 마우스 드래그 (데스크톱)
        let mouseDown = false;
        let mouseStartX = 0;
        let mouseStartY = 0;

        this.canvas.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            e.preventDefault();
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;

            const deltaX = e.clientX - mouseStartX;
            const deltaY = e.clientY - mouseStartY;
            const minSwipeDistance = 30;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            mouseDown = false;
        });

        // 버튼 이벤트
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.newGame();
        });

        // 창 크기 변경 대응
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
        });
    }
}

// 게임 시작
window.addEventListener('DOMContentLoaded', () => {
    new MonsterEvolutionRPG();
});