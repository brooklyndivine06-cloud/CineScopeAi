document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const landingPage = document.getElementById('landing-page');
    const scanningOverlay = document.getElementById('scanning-overlay');
    const dashboard = document.getElementById('results-dashboard');
    
    const inputField = document.getElementById('movie-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    
    const scanProgress = document.getElementById('scan-progress');
    const scanStatusText = document.getElementById('scan-status-text');

    // API Modal Elements
    const apiModal = document.getElementById('api-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const closeApiBtn = document.getElementById('close-api-btn');
    const saveApiBtn = document.getElementById('save-api-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    
    // Load API Key
    let TMDB_API_KEY = localStorage.getItem('cinesense_tmdb_key') || '';
    if (TMDB_API_KEY) {
        apiKeyInput.value = TMDB_API_KEY;
    }

    // Modal Logic
    settingsBtn.addEventListener('click', () => apiModal.classList.remove('hidden'));
    closeApiBtn.addEventListener('click', () => apiModal.classList.add('hidden'));
    saveApiBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('cinesense_tmdb_key', key);
            TMDB_API_KEY = key;
            apiModal.classList.add('hidden');
            alert("API Key saved! You can now analyze any movie.");
        }
    });

    // --- MAIN FLOW ---

    const backBtn = document.getElementById('back-btn');

    backBtn.addEventListener('click', () => {
        // Reset and go back to landing page
        dashboard.classList.remove('active');
        dashboard.classList.add('hidden');
        inputField.value = '';
        
        setTimeout(() => {
            landingPage.classList.remove('hidden', 'blur-bg');
            landingPage.classList.add('active');
        }, 300);
    });

    analyzeBtn.addEventListener('click', startAnalysis);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startAnalysis();
    });

    async function startAnalysis() {
        const query = inputField.value.trim().toLowerCase();
        if (!query) return;

        if (!TMDB_API_KEY) {
            apiModal.classList.remove('hidden');
            return;
        }

        // Transition: Landing -> Scanning
        landingPage.classList.remove('active');
        landingPage.classList.add('hidden', 'blur-bg');
        
        setTimeout(() => {
            scanningOverlay.classList.remove('hidden');
            scanningOverlay.classList.add('active');
            runScanSequence(query);
        }, 100);
    }

    async function runScanSequence(query) {
        const steps = [
            "Accessing Global Database...",
            "Scanning Reviews...",
            "Analyzing Audience...",
            "Checking Content Warnings...",
            "Computing Cinema Score...",
            "Generating Verdict..."
        ];

        let currentStep = 0;
        const totalTime = 3000;
        const stepTime = totalTime / steps.length;

        // Start fetching in background while scanning animates
        let movieData = null;
        let fetchError = null;
        
        fetchMovieData(query).then(data => {
            movieData = data;
        }).catch(err => {
            fetchError = err;
        });

        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                scanStatusText.textContent = steps[currentStep];
                scanProgress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
                currentStep++;
            } else {
                clearInterval(interval);
                if (fetchError) {
                    alert("Error: " + fetchError.message);
                    location.reload();
                } else if (movieData) {
                    finishScanAndShowResults(movieData);
                } else {
                    // Fallback if fetch takes longer than 4s
                    scanStatusText.textContent = "Finalizing data...";
                    const checkInterval = setInterval(() => {
                        if (movieData) {
                            clearInterval(checkInterval);
                            finishScanAndShowResults(movieData);
                        } else if (fetchError) {
                            clearInterval(checkInterval);
                            alert("Error: " + fetchError.message);
                            location.reload();
                        }
                    }, 100);
                }
            }
        }, stepTime);
    }

    function finishScanAndShowResults(movieData) {
        scanningOverlay.classList.remove('active');
        scanningOverlay.classList.add('hidden');
        
        runEasterEggEngine(movieData, () => {
            populateDashboard(movieData);

            const hasSevereWarning = movieData.warnings.some(w => w.severity === 'extreme' || w.severity === 'high');
            
            if (hasSevereWarning) {
                const warningOverlay = document.getElementById('warning-overlay');
                warningOverlay.classList.remove('hidden');
                warningOverlay.classList.add('active');
                
                playWarningSound();

                setTimeout(() => {
                    warningOverlay.classList.remove('active');
                    warningOverlay.classList.add('hidden');
                    
                    setTimeout(() => {
                        dashboard.classList.remove('hidden');
                        dashboard.classList.add('active');
                        triggerDashboardAnimations(movieData);
                    }, 50);
                }, 2000);
            } else {
                setTimeout(() => {
                    dashboard.classList.remove('hidden');
                    dashboard.classList.add('active');
                    triggerDashboardAnimations(movieData);
                }, 50);
            }
        });
    }

    // --- TMDB FETCH & AI GENERATION ---

    async function fetchMovieData(query) {
        // Special easter eggs intercept
        if (query === 'morbius' || query === 'cats') {
            return generateMockData(query);
        }

        const isToken = TMDB_API_KEY.length > 50;
        const authParam = isToken ? '' : `&api_key=${TMDB_API_KEY}`;
        const headers = isToken ? { 'Authorization': `Bearer ${TMDB_API_KEY}` } : {};

        // 1. Search Movie
        const searchRes = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}${authParam}`, { headers });
        const searchData = await searchRes.json();
        
        if (!searchData.results || searchData.results.length === 0) {
            throw new Error("Movie not found in global database.");
        }
        
        const movieBrief = searchData.results[0];
        
        // 2. Get Details
        const detailsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieBrief.id}?append_to_response=credits,release_dates,watch/providers${authParam}`, { headers });
        const detailsData = await detailsRes.json();
        
        return processTMDBToCineSense(detailsData);
    }

    function processTMDBToCineSense(tmdb) {
        const id = tmdb.id;
        const hash = pseudoHash(tmdb.title + id);
        
        // Director
        const director = tmdb.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown';
        
        // Cast
        const cast = tmdb.credits?.cast?.slice(0, 3).map(c => c.name).join(', ') || 'Unknown';
        
        // Rating (e.g. PG-13)
        let cert = 'N/A';
        const usRelease = tmdb.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
        if (usRelease && usRelease.release_dates[0]) cert = usRelease.release_dates[0].certification || 'NR';
        if (!cert || cert === '') cert = 'NR';

        const baseScore = (tmdb.vote_average || 5) * 10;
        const rtCritics = clamp(Math.round(baseScore + ((hash % 20) - 10)), 0, 100);
        const metacritic = clamp(Math.round(baseScore + ((hash % 30) - 15)), 0, 100);

        // Procedural AI Verdict
        let verdictClass = 'average';
        let verdictText = 'Average';
        let verdictIcon = '😐';
        let roast = '';
        
        let streaming = [];
        if (tmdb['watch/providers'] && tmdb['watch/providers'].results && tmdb['watch/providers'].results.US) {
            const usData = tmdb['watch/providers'].results.US;
            if (usData.flatrate) {
                streaming = usData.flatrate.slice(0, 4).map(p => ({
                    name: p.provider_name,
                    logo: `https://image.tmdb.org/t/p/original${p.logo_path}`,
                    link: getDirectStreamingLink(p.provider_name, tmdb.title) || usData.link
                }));
            }
        }

        if (baseScore >= 80) {
            verdictClass = 'peak'; verdictText = 'Peak Cinema'; verdictIcon = '👑';
            const roasts = ["A film so good it makes other directors rethink their careers.", "You'll wish you could erase your memory just to experience it again.", "Cooks harder than a 5-star chef."];
            roast = roasts[hash % roasts.length];
        } else if (baseScore >= 70) {
            verdictClass = 'good'; verdictText = 'Great Movie'; verdictIcon = '🎬';
            const roasts = ["Solid entertainment. Won't change your life, but definitely worth the popcorn.", "It's like a good pizza: satisfying and hits the spot."];
            roast = roasts[hash % roasts.length];
        } else if (baseScore >= 60) {
            verdictClass = 'average'; verdictText = 'Average'; verdictIcon = '😐';
            const roasts = ["Perfect background noise while folding laundry.", "Worth watching... if someone else paid for the streaming service."];
            roast = roasts[hash % roasts.length];
        } else {
            verdictClass = 'disaster'; verdictText = 'Cinematic Disaster'; verdictIcon = '🗑️';
            const roasts = ["This script was clearly written 5 minutes before filming started.", "Even the end credits felt too long.", "An absolute crime against cinema."];
            roast = roasts[hash % roasts.length];
        }

        return {
            title: tmdb.title,
            year: tmdb.release_date ? tmdb.release_date.split('-')[0] : 'Unknown',
            runtime: tmdb.runtime ? `${tmdb.runtime} min` : 'Unknown',
            rating: cert,
            genres: tmdb.genres?.map(g => g.name).join(' • ') || 'Unknown',
            director: director,
            cast: cast,
            poster: tmdb.poster_path ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${tmdb.poster_path}` : '',
            backdrop: tmdb.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdb.backdrop_path}` : '',
            scores: { 
                tmdb: Math.round(baseScore), 
                rtCritics: rtCritics, 
                rtAudience: clamp(Math.round(baseScore + 5), 0, 100), 
                metacritic: metacritic 
            },
            verdict: { text: verdictText, class: verdictClass, icon: verdictIcon },
            explanation: `AI Analysis based on global metrics: With a primary audience score of ${baseScore}%, the film exhibits strong characteristics of its genre. The critical consensus places it at ${rtCritics}%.`,
            roast: roast,
            summary: tmdb.overview || "No summary available.",
            moods: ["🍿 Cinematic", "👀 Focused"],
            warnings: generateProceduralWarnings(hash, tmdb.genres),
            familyFriendly: cert.includes('R') || cert === 'NC-17' ? { text: "Adults Only", color: "var(--neon-red)" } : { text: "Teen Guidance", color: "var(--neon-yellow)" },
            cinemaMeter: baseScore,
            strengths: [
                { label: "Story", val: clamp((hash % 40) + 50, 0, 100) },
                { label: "Visuals", val: clamp(((hash*2) % 40) + 60, 0, 100) },
                { label: "Acting", val: clamp(((hash*3) % 50) + 50, 0, 100) }
            ],
            streaming: streaming,
            funStats: [
                `Popularity Index: ${Math.round(tmdb.popularity)}`,
                `Budget: ${tmdb.budget ? '$' + (tmdb.budget/1000000).toFixed(1) + 'M' : 'Unknown'}`
            ]
        };
    }

    function pseudoHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    function playWarningSound() {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1);
    }
    
    function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

    function generateProceduralWarnings(hash, genres) {
        const warnings = [];
        const isHorror = genres?.some(g => g.name === 'Horror');
        const isAction = genres?.some(g => g.name === 'Action');

        if (isHorror) {
            warnings.push({ title: "Jump Scares", severity: "high", desc: "Contains unexpected loud noises." });
            warnings.push({ title: "Disturbing Imagery", severity: "extreme", desc: "Psychological horror elements." });
        }
        if (isAction) {
            warnings.push({ title: "Violence", severity: "moderate", desc: "Combat and action sequences." });
        }
        if (hash % 3 === 0) warnings.push({ title: "Strong Language", severity: "moderate", desc: "Use of profanity." });
        if (warnings.length === 0) warnings.push({ title: "Mild Themes", severity: "low", desc: "Generally safe viewing." });
        return warnings;
    }

    function getDirectStreamingLink(providerName, movieTitle) {
        const encoded = encodeURIComponent(movieTitle);
        const name = providerName.toLowerCase();
        if (name.includes('netflix')) return `https://www.netflix.com/search?q=${encoded}`;
        if (name.includes('amazon') || name.includes('prime')) return `https://www.amazon.com/s?k=${encoded}&i=instant-video`;
        if (name.includes('disney')) return `https://www.disneyplus.com/search?q=${encoded}`;
        if (name.includes('hulu')) return `https://www.hulu.com/search?q=${encoded}`;
        if (name.includes('max') || name.includes('hbo')) return `https://play.max.com/search?q=${encoded}`;
        if (name.includes('apple')) return `https://tv.apple.com/us/search?q=${encoded}`;
        return null; // fallback to TMDB link
    }

    function generateMockData(query) {
        // Morbius/Cats Fallback for easter eggs
        let data = {
            title: "Morbius", year: "2022", runtime: "104 min", rating: "PG-13", genres: "Action • Horror • Masterpiece",
            director: "Daniel Espinosa", cast: "Jared Leto, Matt Smith",
            poster: "https://image.tmdb.org/t/p/w600_and_h900_bestv2/6JjfSchsU6daXk2AKX8EEBjO3Fm.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/tj4lzGgHrfjnjVqAKkEp2cpm0H.jpg",
            scores: { tmdb: 100, rtCritics: 100, rtAudience: 100, metacritic: 100 },
            verdict: { text: "Absolute Morb", class: "peak", icon: "🦇" },
            explanation: "The highest grossing film in the MCU (Morbius Cinematic Universe).",
            roast: "The first movie to ever sell one Morbillion tickets.",
            summary: "Dangerously ill with a rare blood disorder, Dr. Morbius attempts a desperate gamble.",
            moods: ["🦇 Morbin Time"],
            warnings: [{ title: "Extreme Morbing", severity: "extreme", desc: "Stand back." }],
            familyFriendly: { text: "Morbs Only", color: "var(--neon-blue)" },
            cinemaMeter: 100,
            strengths: [{ label: "Morbing", val: 100 }, { label: "Dance Scenes", val: 100 }],
            funStats: ["Morbillions Made: Yes"]
        };
        if (query === 'cats') {
            data.title = "Cats"; data.verdict = { text: "Disaster", class: "disaster", icon: "🗑️" };
            data.poster = "https://image.tmdb.org/t/p/w600_and_h900_bestv2/yYbnFhF41kYqjJgM15cAWoZ7W0f.jpg";
            data.scores = { tmdb: 20, rtCritics: 19, rtAudience: 53, metacritic: 32 };
            data.roast = "Even the dogs felt bad for this one.";
            data.cinemaMeter = 10;
        }
        return Promise.resolve(data);
    }

    // --- POPULATE DASHBOARD ---

    function populateDashboard(data) {
        document.getElementById('movie-title').textContent = data.title;
        document.getElementById('movie-year').textContent = data.year;
        document.getElementById('movie-runtime').textContent = data.runtime;
        document.getElementById('movie-rating').textContent = data.rating;
        document.getElementById('movie-genres').textContent = data.genres;
        document.getElementById('movie-director').textContent = data.director;
        document.getElementById('movie-cast').textContent = data.cast;
        
        if (data.poster) document.getElementById('movie-poster').src = data.poster;
        if (data.backdrop) document.getElementById('dashboard-backdrop').style.backgroundImage = `url(${data.backdrop})`;

        // Verdict
        const badge = document.getElementById('ai-verdict-badge');
        badge.className = `verdict-badge ${data.verdict.class}`;
        badge.innerHTML = `<span class="verdict-icon">${data.verdict.icon}</span><span class="verdict-text">${data.verdict.text}</span>`;
        
        document.getElementById('ai-explanation-text').textContent = data.explanation;
        document.getElementById('ai-roast-text').textContent = `"${data.roast}"`;
        document.getElementById('movie-summary').textContent = data.summary;

        // Family Friendly
        const famBadge = document.getElementById('family-friendly-indicator');
        famBadge.textContent = data.familyFriendly.text;
        famBadge.style.color = data.familyFriendly.color;
        famBadge.style.borderColor = data.familyFriendly.color;

        // Streaming Options
        const streamContainer = document.getElementById('streaming-options');
        streamContainer.innerHTML = '';
        if (data.streaming && data.streaming.length > 0) {
            streamContainer.innerHTML = '<span class="streaming-label">Stream on:</span>';
            data.streaming.forEach(p => {
                streamContainer.innerHTML += `<a href="${p.link}" target="_blank" title="Watch on ${p.name}"><img src="${p.logo}" alt="${p.name}" class="provider-logo"></a>`;
            });
        }

        // Ratings
        const scoreContainer = document.getElementById('score-circles');
        scoreContainer.innerHTML = '';
        Object.entries(data.scores).forEach(([key, val]) => {
            let label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
            let colorClass = val >= 80 ? 'green' : val >= 60 ? 'yellow' : 'red';
            if (val >= 95) colorClass = 'gold';

            scoreContainer.innerHTML += `
                <div class="score-item">
                    <svg viewBox="0 0 36 36" class="circular-chart ${colorClass}">
                        <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="circle" stroke-dasharray="0, 100" data-score="${val}" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" class="percentage">${val}%</text>
                    </svg>
                    <span class="score-label">${label}</span>
                </div>
            `;
        });

        // Warnings
        const warningsGrid = document.getElementById('warnings-grid');
        warningsGrid.innerHTML = '';
        data.warnings.forEach(w => {
            warningsGrid.innerHTML += `
                <div class="warning-item ${w.severity}" title="${w.desc}">
                    <div class="warning-icon-text">⚠️ ${w.title}</div>
                    <div class="severity-meter">
                        <span></span><span></span><span></span><span></span>
                    </div>
                </div>
            `;
        });

        // Moods
        document.getElementById('mood-icons').innerHTML = data.moods.map(m => `<span>${m}</span>`).join(' &nbsp; ');

        // Strengths
        const strengthBars = document.getElementById('strength-bars');
        strengthBars.innerHTML = '';
        data.strengths.forEach(s => {
            strengthBars.innerHTML += `
                <div class="strength-item">
                    <div class="strength-label"><span>${s.label}</span><span>${s.val}/100</span></div>
                    <div class="strength-bar-bg">
                        <div class="strength-bar-fill" data-width="${s.val}%"></div>
                    </div>
                </div>
            `;
        });

        document.getElementById('fun-stats-list').innerHTML = data.funStats.map(s => `<li>• ${s}</li>`).join('');

        const meterFill = document.getElementById('meter-fill');
        const meterNeedle = document.getElementById('meter-needle');
        meterFill.dataset.height = `${data.cinemaMeter}%`;
        meterNeedle.dataset.bottom = `${data.cinemaMeter}%`;
    }

    // --- ANIMATIONS & PARALLAX ---

    function triggerDashboardAnimations(data) {
        setTimeout(() => {
            document.querySelectorAll('.circular-chart .circle').forEach(circle => {
                const score = circle.getAttribute('data-score');
                circle.style.strokeDasharray = `${score}, 100`;
            });
        }, 500);

        setTimeout(() => {
            const meterFill = document.getElementById('meter-fill');
            const meterNeedle = document.getElementById('meter-needle');
            meterFill.style.height = meterFill.dataset.height;
            meterNeedle.style.bottom = meterNeedle.dataset.bottom;
        }, 800);

        setTimeout(() => {
            document.querySelectorAll('.strength-bar-fill').forEach(bar => {
                bar.style.width = bar.getAttribute('data-width');
            });
        }, 600);

        const badge = document.getElementById('ai-verdict-badge');
        badge.style.animation = 'none';
        badge.offsetHeight; 
        badge.style.animation = null; 
    }

    const posterContainer = document.querySelector('.poster-container');
    const posterGlare = document.querySelector('.poster-glare');
    if (posterContainer) {
        posterContainer.addEventListener('mousemove', (e) => {
            const rect = posterContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;
            posterContainer.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            posterGlare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4) 0%, transparent 60%)`;
        });
        posterContainer.addEventListener('mouseleave', () => {
            posterContainer.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            posterGlare.style.background = `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.2) 25%, transparent 30%)`;
        });
    }
    // --- EASTER EGG ENGINE ---
    function runEasterEggEngine(movieData, onComplete) {
        const title = movieData.title.toLowerCase();
        const genres = movieData.genres.toLowerCase();
        
        const canvas = document.getElementById('easter-egg-canvas');
        const content = document.getElementById('easter-egg-content');
        
        // Reset
        canvas.className = 'view-section hidden';
        content.innerHTML = '';
        content.className = '';
        document.body.className = '';
        
        let duration = 2000;
        let isTriggered = false;

        // 1. Hardcoded Iconic Masterpieces
        if (title.includes('inception')) {
            isTriggered = true;
            document.body.classList.add('world-flip');
            content.innerHTML = '<div class="totem">🌀</div>';
        } else if (title.includes('matrix')) {
            isTriggered = true;
            canvas.classList.add('egg-matrix');
            content.innerHTML = "01010100 01101000 01100101 00100000 01001101 01100001 01110100 01110010 01101001 01111000<br>".repeat(20);
        } else if (title.includes('oppenheimer')) {
            isTriggered = true;
            duration = 1500;
            canvas.style.background = 'white';
            content.innerHTML = '<div style="font-size: 5rem; filter: drop-shadow(0 0 50px white);">💥</div>';
        } else if (title.includes('spider-man')) {
            isTriggered = true;
            content.innerHTML = '<div style="font-size: 8rem; animation: float-up 1s forwards;">🕸️</div>';
        } 
        // 2. Procedural Genre FX
        else {
            if (genres.includes('horror')) {
                isTriggered = true;
                duration = 2000;
                canvas.classList.add('egg-horror');
                content.innerHTML = '<div class="horror-text">DON\'T LOOK BEHIND YOU</div>';
            } else if (genres.includes('science fiction') || genres.includes('sci-fi')) {
                isTriggered = true;
                canvas.classList.add('egg-scifi');
                content.innerHTML = '<div class="warp-stars">✨ ✨ ✨</div>';
            } else if (genres.includes('action')) {
                isTriggered = true;
                duration = 1500;
                canvas.classList.add('egg-action');
                content.innerHTML = '<div class="glass-crack"></div>';
            } else if (genres.includes('romance')) {
                isTriggered = true;
                for(let i=0; i<10; i++) {
                    content.innerHTML += `<div class="romance-heart" style="left: ${Math.random()*100}%; animation-delay: ${Math.random()}s;">💖</div>`;
                }
            } else if (genres.includes('comedy')) {
                isTriggered = true;
                content.innerHTML = '<div style="font-size: 8rem; animation: spin-totem 2s infinite;">🎉</div>';
            }
        }

        if (isTriggered) {
            canvas.classList.remove('hidden');
            canvas.classList.add('active');
            
            setTimeout(() => {
                canvas.classList.remove('active');
                canvas.classList.add('hidden');
                canvas.className = 'view-section hidden'; // reset classes
                document.body.className = ''; // Reset flip
                
                setTimeout(onComplete, 50);
            }, duration);
        } else {
            onComplete();
        }
    }
});
