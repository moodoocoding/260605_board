/**
 * ==========================================================================
 * CLASSROOM BOARD INTERACTIVE LOGIC (app.js)
 * Features:
 *   1. Real-time Live Clock & Active Timetable Row Highlight
 *   2. Classmate Name Picker (Single Draw with Shuffle / Multi Draw)
 *   3. First-Come-First-Served Ticket Drawer with Milliseconds
 *   4. Editable Timetable Grid with Local Storage Persistence
 *   5. Particle Confetti Effects
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- INITIAL STATES & DEFAULT DATA ---
    const DEFAULT_CLASSMATES = [
        "김민수", "이서연", "박도윤", "최예은", "정하준", 
        "강지우", "윤주원", "장시우", "임지호", "한서준", 
        "오민재", "신서아", "권지아", "황하윤", "송채원", 
        "전민서", "홍지유", "유윤아", "양지원", "백수빈"
    ];



    // Local Storage helper functions
    const storage = {
        get: (key, fallback) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        },
        set: (key, value) => {
            localStorage.setItem(key, JSON.stringify(value));
        }
    };

    // Load App State
    let classmates = storage.get('classmates_list', DEFAULT_CLASSMATES);
    let drawnClassmates = storage.get('drawn_classmates', []);
    let tickets = storage.get('drawn_tickets', []);

    let currentShuffling = false;

    // --- DOM ELEMENTS ---
    const liveClockEl = document.getElementById('live-clock');
    
    // Name Picker DOM
    const nameDisplayCard = document.getElementById('name-display-card');
    const namePlaceholder = document.getElementById('name-placeholder');
    const pickerResult = document.getElementById('picker-result');
    const excludeCheckbox = document.getElementById('exclude-drawn-checkbox');
    const remainingCountVal = document.getElementById('remaining-count-val');
    const totalCountVal = document.getElementById('total-count-val');
    const btnDrawOne = document.getElementById('btn-draw-one');
    const btnDrawMulti = document.getElementById('btn-draw-multi');
    const btnResetHistory = document.getElementById('btn-reset-history');
    const drawnNamesList = document.getElementById('drawn-names-list');
    
    // Ticket DOM
    const btnGetTicket = document.getElementById('btn-get-ticket');
    const btnResetTickets = document.getElementById('btn-reset-tickets');
    const ticketUserNameInput = document.getElementById('ticket-user-name');
    const ticketContainer = document.getElementById('ticket-container');
    const ticketRankList = document.getElementById('ticket-rank-list');
    
    // Modals DOM
    const namesModal = document.getElementById('names-modal');
    const openNamesModalBtn = document.getElementById('open-names-modal');
    const closeNamesModalBtn = document.getElementById('close-names-modal');
    const btnCancelNames = document.getElementById('btn-cancel-names');
    const btnSaveNames = document.getElementById('btn-save-names');
    const namesListTextarea = document.getElementById('names-list-textarea');
    
    const multiDrawModal = document.getElementById('multi-draw-modal');
    const closeMultiModalBtn = document.getElementById('close-multi-modal');
    const btnCancelMulti = document.getElementById('btn-cancel-multi');
    const btnRunMulti = document.getElementById('btn-run-multi');
    const multiDrawCountSelect = document.getElementById('multi-draw-count');
    const multiResultsArea = document.getElementById('multi-results-area');
    const multiResultsGrid = document.getElementById('multi-results-grid');
    


    const confettiContainer = document.getElementById('confetti-container');


    // ==========================================================================
    // MODULE 1: LIVE CLOCK & TIMETABLE Row HIGHLIGHT
    // ==========================================================================
    function updateClock() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayLabel = days[now.getDay()];
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        liveClockEl.textContent = `${year}. ${month}. ${date} (${dayLabel}) ${hours}:${minutes}:${seconds}`;
    }

    setInterval(updateClock, 1000);
    updateClock(); // Initial run




    // ==========================================================================
    // MODULE 3: STUDENT NAME PICKER
    // ==========================================================================
    function updatePickerCounts() {
        totalCountVal.textContent = classmates.length;
        if (excludeCheckbox.checked) {
            const remaining = classmates.filter(name => !drawnClassmates.includes(name));
            remainingCountVal.textContent = remaining.length;
        } else {
            remainingCountVal.textContent = classmates.length;
        }
    }

    function renderHistory() {
        drawnNamesList.innerHTML = '';
        if (drawnClassmates.length === 0) {
            drawnNamesList.innerHTML = '<div class="empty-message">아직 뽑은 친구가 없습니다.</div>';
            return;
        }

        drawnClassmates.forEach((name, idx) => {
            const badge = document.createElement('div');
            badge.className = 'history-badge';
            badge.innerHTML = `<span class="index">${idx + 1}</span> <span class="name">${name}</span>`;
            drawnNamesList.appendChild(badge);
        });
        
        // Auto scroll to bottom
        drawnNamesList.scrollTop = drawnNamesList.scrollHeight;
    }

    function triggerConfetti() {
        const colors = ['#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'];
        for (let i = 0; i < 60; i++) {
            const p = document.createElement('div');
            p.className = 'confetti-particle';
            
            // Random styling
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const size = Math.random() * 8 + 6;
            const animDuration = Math.random() * 1.5 + 1.5;
            const rotateStart = Math.random() * 360;
            
            p.style.backgroundColor = color;
            p.style.left = `${left}vw`;
            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.animationDuration = `${animDuration}s`;
            p.style.transform = `rotate(${rotateStart}deg)`;
            
            confettiContainer.appendChild(p);
            
            // Cleanup DOM
            setTimeout(() => {
                p.remove();
            }, animDuration * 1000);
        }
    }

    function drawOneName() {
        if (currentShuffling) return;
        
        let pool = [...classmates];
        if (excludeCheckbox.checked) {
            pool = classmates.filter(name => !drawnClassmates.includes(name));
        }

        if (pool.length === 0) {
            alert('뽑을 수 있는 친구가 없습니다! 뽑기 기록을 초기화하거나 중복 제외 옵션을 꺼주세요.');
            return;
        }

        currentShuffling = true;
        namePlaceholder.style.display = 'none';
        pickerResult.style.display = 'block';
        nameDisplayCard.classList.add('shuffling');
        nameDisplayCard.classList.remove('selected-glow');

        let duration = 1500; // Total shuffle time in ms
        let interval = 50;   // Starting speed
        let timer = 0;
        
        function shuffle() {
            const tempName = pool[Math.floor(Math.random() * pool.length)];
            pickerResult.textContent = tempName;
            
            timer += interval;
            if (timer < duration) {
                // Exponential slow down
                if (timer > duration * 0.8) interval = 220;
                else if (timer > duration * 0.6) interval = 140;
                else if (timer > duration * 0.3) interval = 80;
                
                setTimeout(shuffle, interval);
            } else {
                // Final selection
                const finalIndex = Math.floor(Math.random() * pool.length);
                const finalName = pool[finalIndex];
                
                pickerResult.textContent = finalName;
                nameDisplayCard.classList.remove('shuffling');
                nameDisplayCard.classList.add('selected-glow');
                
                // Add to history if unique (or just sequential if no-exclude is off)
                drawnClassmates.push(finalName);
                storage.set('drawn_classmates', drawnClassmates);
                
                updatePickerCounts();
                renderHistory();
                triggerConfetti();
                
                currentShuffling = false;
            }
        }
        
        shuffle();
    }

    // Modal: Edit student roster
    openNamesModalBtn.addEventListener('click', () => {
        namesListTextarea.value = classmates.join('\n');
        namesModal.classList.add('active');
    });

    btnSaveNames.addEventListener('click', () => {
        const content = namesListTextarea.value.trim();
        if (!content) {
            alert('최소 한 명 이상의 이름을 입력해 주세요.');
            return;
        }
        
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
        classmates = lines;
        storage.set('classmates_list', classmates);
        
        // Reset drawing history since classmate pool changed
        drawnClassmates = [];
        storage.set('drawn_classmates', drawnClassmates);
        
        updatePickerCounts();
        renderHistory();
        
        namePlaceholder.style.display = 'block';
        pickerResult.style.display = 'none';
        nameDisplayCard.classList.remove('selected-glow');
        
        namesModal.classList.remove('active');
    });

    // Reset picker history
    btnResetHistory.addEventListener('click', () => {
        if (confirm('이름 뽑기 순서 기록을 초기화하시겠습니까?')) {
            drawnClassmates = [];
            storage.set('drawn_classmates', drawnClassmates);
            updatePickerCounts();
            renderHistory();
            
            namePlaceholder.style.display = 'block';
            pickerResult.style.display = 'none';
            nameDisplayCard.classList.remove('selected-glow');
        }
    });

    // Multi-draw popup controls
    btnDrawMulti.addEventListener('click', () => {
        // Populate selection cap
        let poolCount = classmates.length;
        if (excludeCheckbox.checked) {
            poolCount = classmates.filter(name => !drawnClassmates.includes(name)).length;
        }
        
        if (poolCount < 2) {
            alert('여러 명을 뽑기 위한 잔여 인원이 부족합니다 (최소 2명 필요).');
            return;
        }
        
        // Update selection options dynamically based on pool count
        multiDrawCountSelect.innerHTML = '';
        const maxDraw = Math.min(poolCount, 10);
        for (let i = 2; i <= maxDraw; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${i}명`;
            multiDrawCountSelect.appendChild(opt);
        }
        
        multiResultsArea.style.display = 'none';
        multiDrawModal.classList.add('active');
    });

    btnRunMulti.addEventListener('click', () => {
        const count = parseInt(multiDrawCountSelect.value, 10);
        let pool = [...classmates];
        if (excludeCheckbox.checked) {
            pool = classmates.filter(name => !drawnClassmates.includes(name));
        }

        if (pool.length < count) {
            alert('인원이 부족하여 선택한 명수를 뽑을 수 없습니다.');
            return;
        }

        // Shuffle pool and slice 'count' items
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count);
        
        // Render results
        multiResultsGrid.innerHTML = '';
        selected.forEach(name => {
            const badge = document.createElement('div');
            badge.className = 'multi-result-badge';
            badge.textContent = name;
            multiResultsGrid.appendChild(badge);
            
            // Save to drawn classmates
            drawnClassmates.push(name);
        });
        
        storage.set('drawn_classmates', drawnClassmates);
        updatePickerCounts();
        renderHistory();
        triggerConfetti();
        
        multiResultsArea.style.display = 'block';
    });

    // Listeners for modals closing
    closeNamesModalBtn.addEventListener('click', () => namesModal.classList.remove('active'));
    btnCancelNames.addEventListener('click', () => namesModal.classList.remove('active'));
    closeMultiModalBtn.addEventListener('click', () => multiDrawModal.classList.remove('active'));
    btnCancelMulti.addEventListener('click', () => {
        multiDrawModal.classList.remove('active');
        namePlaceholder.style.display = 'block';
        pickerResult.style.display = 'none';
        nameDisplayCard.classList.remove('selected-glow');
    });

    btnDrawOne.addEventListener('click', drawOneName);
    
    // Initial Picker Setup
    updatePickerCounts();
    renderHistory();
    excludeCheckbox.addEventListener('change', updatePickerCounts);


    // ==========================================================================
    // MODULE 4: FIRST-COME-FIRST-SERVED TICKET DRAWING
    // ==========================================================================
    function renderRankList() {
        ticketRankList.innerHTML = '';
        if (tickets.length === 0) {
            ticketRankList.innerHTML = '<div class="empty-message">아직 뽑은 번호표가 없습니다.</div>';
            return;
        }

        // Show ranking
        tickets.forEach((t, idx) => {
            const item = document.createElement('div');
            item.className = 'rank-item';
            item.innerHTML = `
                <div class="rank-left-side">
                    <span class="rank-badge">${idx + 1}</span>
                    <span class="rank-name">${t.name}</span>
                </div>
                <span class="rank-timestamp">${t.time}</span>
            `;
            ticketRankList.appendChild(item);
        });
    }

    function getFormattedTimeWithMs() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${ms}`;
    }

    btnGetTicket.addEventListener('click', () => {
        let userName = ticketUserNameInput.value.trim();
        const count = tickets.length + 1;
        
        if (!userName) {
            userName = `참가자 #${count}`;
        }
        
        const timestamp = getFormattedTimeWithMs();
        const newTicket = {
            number: count,
            name: userName,
            time: timestamp
        };
        
        tickets.push(newTicket);
        storage.set('drawn_tickets', tickets);
        
        // Render current ticket with slide out animation
        ticketContainer.innerHTML = '';
        const ticketEl = document.createElement('div');
        ticketEl.className = 'class-ticket';
        ticketEl.innerHTML = `
            <div class="ticket-header">Class Board Queue</div>
            <div class="ticket-body">
                <span class="ticket-num">${count}등</span>
                <span class="ticket-name">${userName}</span>
            </div>
            <div class="ticket-footer">
                <span>번호표 순번: #${count}</span>
                <span>시간: ${timestamp}</span>
            </div>
        `;
        
        ticketContainer.appendChild(ticketEl);
        
        // Refresh ranks list
        renderRankList();
        
        // Flash glow on printer mouth
        const mouth = document.querySelector('.printer-mouth');
        mouth.style.borderColor = 'var(--color-secondary)';
        setTimeout(() => {
            mouth.style.borderColor = '#334155';
        }, 300);
        
        // Clear input text
        ticketUserNameInput.value = '';
    });

    btnResetTickets.addEventListener('click', () => {
        if (confirm('모든 번호표 대기열 기록을 초기화하시겠습니까?')) {
            tickets = [];
            storage.set('drawn_tickets', tickets);
            ticketContainer.innerHTML = '';
            renderRankList();
        }
    });

    // Initial Rank Setup
    renderRankList();
});
