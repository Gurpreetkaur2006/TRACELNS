/**
 * TraceLens Intelligence Main Application Controller
 * Handles views, routing, session lifecycle, form handling, table data binding,
 * duplicate detection alerts, link analysis rendering, and print controller.
 */
(function() {
    window.TRACELNS = window.TRACELNS || {};

    const App = {
        init() {
            this.bindEvents();
            this.checkSession();
        },

        checkSession() {
            if (window.TRACELNS.Storage.isLoggedIn()) {
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app-layout').style.display = 'flex';
                this.updateOfficerBadge();
                this.switchView('dashboard');
            } else {
                document.getElementById('login-screen').style.display = 'flex';
                document.getElementById('app-layout').style.display = 'none';
            }
        },

        updateOfficerBadge() {
            const session = window.TRACELNS.Storage.getSession();
            if (session) {
                const badge = document.querySelector('.officer-avatar');
                if (badge) badge.innerText = session.username.substring(0, 2).toUpperCase();
                const name = document.querySelector('.officer-name');
                if (name) name.innerText = `Officer ${session.username.charAt(0).toUpperCase() + session.username.slice(1)}`;
            }
        },

        switchView(viewId) {
            // Update active menu link
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.view === viewId) {
                    item.classList.add('active');
                }
            });

            // Toggle view section
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.remove('active');
            });

            const targetSection = document.getElementById(`view-${viewId}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Run view-specific loaders
            if (viewId === 'dashboard') {
                this.loadDashboardStats();
            } else if (viewId === 'manage') {
                this.loadComplaintsTable();
            } else if (viewId === 'intel') {
                this.loadIntelligenceView();
            } else if (viewId === 'analysis') {
                this.loadLinkAnalysisView();
            }
        },

        bindEvents() {
            // View routing sidebar clicks
            document.querySelectorAll('.nav-item a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewId = link.parentElement.dataset.view;
                    if (viewId === 'logout') {
                        this.handleLogout();
                    } else {
                        this.switchView(viewId);
                    }
                });
            });

            // Login form submission
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const user = document.getElementById('login-username').value;
                    const pass = document.getElementById('login-password').value;
                    const errorBox = document.getElementById('login-error');

                    if (window.TRACELNS.Storage.login(user, pass)) {
                        errorBox.style.display = 'none';
                        this.checkSession();
                        this.showToast('Access Granted. Logged in successfully.', 'success');
                    } else {
                        errorBox.style.display = 'block';
                        errorBox.innerText = 'Authentication Failed. Invalid Credentials.';
                    }
                });
            }

            // Real-time Duplicate & Risk Engine alerts in Complaint Registration Form
            const suspectPhoneInput = document.getElementById('reg-suspect-phone');
            const suspectUpiInput = document.getElementById('reg-suspect-upi');

            if (suspectPhoneInput && suspectUpiInput) {
                const handleLiveAlert = () => {
                    const phone = suspectPhoneInput.value;
                    const upi = suspectUpiInput.value;
                    this.updateLiveAlertWidget(phone, upi);
                };
                suspectPhoneInput.addEventListener('input', handleLiveAlert);
                suspectUpiInput.addEventListener('input', handleLiveAlert);
            }

            // Complaint Registration submit
            const regForm = document.getElementById('complaint-reg-form');
            if (regForm) {
                regForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const complaint = {
                        victimName: document.getElementById('reg-victim-name').value.trim(),
                        victimMobile: document.getElementById('reg-victim-mobile').value.trim(),
                        crimeType: document.getElementById('reg-crime-type').value,
                        suspectPhone: document.getElementById('reg-suspect-phone').value.trim(),
                        suspectUpi: document.getElementById('reg-suspect-upi').value.trim(),
                        description: document.getElementById('reg-description').value.trim(),
                        date: document.getElementById('reg-date').value
                    };

                    // Validation
                    if (!complaint.victimName || !complaint.victimMobile || !complaint.crimeType || !complaint.date) {
                        this.showToast('Please fill out all required fields.', 'error');
                        return;
                    }

                    const saved = window.TRACELNS.Storage.addComplaint(complaint);
                    this.showToast(`Complaint registered successfully. ID: ${saved.id}`, 'success');
                    regForm.reset();
                    this.resetLiveAlertWidget();
                    
                    // Route back to management dashboard to see the case
                    setTimeout(() => {
                        this.switchView('manage');
                    }, 500);
                });
            }

            // Search and Filters on cases table
            const searchInput = document.getElementById('case-search');
            const typeFilter = document.getElementById('case-filter-type');

            if (searchInput) {
                searchInput.addEventListener('input', () => this.loadComplaintsTable());
            }
            if (typeFilter) {
                typeFilter.addEventListener('change', () => this.loadComplaintsTable());
            }

            // Close Modal bindings
            const modal = document.getElementById('case-modal');
            const closeBtn = document.querySelector('.modal-close');
            const secondaryClose = document.getElementById('btn-modal-close');

            const hideModal = () => {
                if (modal) modal.style.display = 'none';
            };

            if (closeBtn) closeBtn.addEventListener('click', hideModal);
            if (secondaryClose) secondaryClose.addEventListener('click', hideModal);
            window.addEventListener('click', (e) => {
                if (e.target === modal) hideModal();
            });

            // Link Analysis Search trigger
            const linkSearchBtn = document.getElementById('btn-analyse');
            const linkSearchInput = document.getElementById('analyse-phone');

            if (linkSearchBtn && linkSearchInput) {
                linkSearchBtn.addEventListener('click', () => {
                    const phoneVal = linkSearchInput.value.trim();
                    this.triggerLinkAnalysis(phoneVal);
                });
                linkSearchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const phoneVal = linkSearchInput.value.trim();
                        this.triggerLinkAnalysis(phoneVal);
                    }
                });
            }
        },

        handleLogout() {
            window.TRACELNS.Storage.logout();
            this.checkSession();
            this.showToast('Session ended. Logged out.', 'success');
        },

        showToast(msg, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
                <span>${msg}</span>
            `;
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s ease-out';
                setTimeout(() => toast.remove(), 500);
            }, 3500);
        },

        /* --- Live Alert Engine Widget UI --- */
        updateLiveAlertWidget(phone, upi) {
            const container = document.getElementById('live-alert-status');
            const scoreLabel = document.getElementById('live-alert-score');
            const levelLabel = document.getElementById('live-alert-level');
            const alertBody = document.getElementById('live-alert-details');

            if (!container || (!phone && !upi)) {
                this.resetLiveAlertWidget();
                return;
            }

            const analysis = window.TRACELNS.Analyzer.calculateRiskScore(phone, upi);

            // Set risk styling classes
            container.className = `alert-status-container ${analysis.levelClass.split('-')[1]}`;
            scoreLabel.innerText = `Risk Score: ${analysis.score}`;
            levelLabel.innerText = `⚠ ${analysis.level.toUpperCase()}`;

            let detailMsg = "";
            if (phone && analysis.phoneCount > 0) {
                detailMsg += `Phone Number Found In ${analysis.phoneCount} Previous Complaint${analysis.phoneCount > 1 ? 's' : ''}.<br>`;
            }
            if (upi && analysis.upiCount > 0) {
                detailMsg += `UPI ID Found In ${analysis.upiCount} Previous Complaint${analysis.upiCount > 1 ? 's' : ''}.<br>`;
            }
            if (analysis.multipleCrimeTypeScore > 0) {
                detailMsg += `Used in multiple Crime Types (+20 risk).`;
            }

            if (!detailMsg) {
                detailMsg = "No matches detected in database. Clean suspect identifier.";
            }

            alertBody.innerHTML = detailMsg;
        },

        resetLiveAlertWidget() {
            const container = document.getElementById('live-alert-status');
            const scoreLabel = document.getElementById('live-alert-score');
            const levelLabel = document.getElementById('live-alert-level');
            const alertBody = document.getElementById('live-alert-details');

            if (container) {
                container.className = 'alert-status-container';
                scoreLabel.innerText = 'Risk Score: 0';
                levelLabel.innerText = 'SECURE';
                alertBody.innerHTML = 'Enter suspect phone or UPI details to run real-time matching checks.';
            }
        },

        /* --- Dashboard Data Loader --- */
        loadDashboardStats() {
            const complaints = window.TRACELNS.Storage.getComplaints();
            document.getElementById('stat-total-cases').innerText = complaints.length;

            const upiCases = complaints.filter(c => c.crimeType === 'UPI Fraud').length;
            document.getElementById('stat-upi-cases').innerText = upiCases;

            const otpCases = complaints.filter(c => c.crimeType === 'OTP Fraud').length;
            document.getElementById('stat-otp-cases').innerText = otpCases;

            // Compute most reported suspect entities
            const phoneFreq = {};
            const upiFreq = {};
            const offendersList = new Set();

            complaints.forEach(c => {
                if (c.suspectPhone) {
                    phoneFreq[c.suspectPhone] = (phoneFreq[c.suspectPhone] || 0) + 1;
                    if (phoneFreq[c.suspectPhone] > 1) offendersList.add(c.suspectPhone);
                }
                if (c.suspectUpi) {
                    upiFreq[c.suspectUpi] = (upiFreq[c.suspectUpi] || 0) + 1;
                    if (upiFreq[c.suspectUpi] > 1) offendersList.add(c.suspectUpi);
                }
            });

            // Find max keys
            let maxPhone = "N/A";
            let maxPhoneVal = 0;
            for (let ph in phoneFreq) {
                if (phoneFreq[ph] > maxPhoneVal) {
                    maxPhoneVal = phoneFreq[ph];
                    maxPhone = ph;
                }
            }

            let maxUpi = "N/A";
            let maxUpiVal = 0;
            for (let up in upiFreq) {
                if (upiFreq[up] > maxUpiVal) {
                    maxUpiVal = upiFreq[up];
                    maxUpi = up;
                }
            }

            document.getElementById('stat-offender-phone').innerText = maxPhone;
            document.getElementById('stat-offender-phone-sub').innerHTML = maxPhoneVal > 0 ? `Flagged in <strong>${maxPhoneVal}</strong> cases` : 'No suspects recorded';

            document.getElementById('stat-offender-upi').innerText = maxUpi.length > 22 ? maxUpi.substring(0, 20) + '...' : maxUpi;
            document.getElementById('stat-offender-upi').title = maxUpi;
            document.getElementById('stat-offender-upi-sub').innerHTML = maxUpiVal > 0 ? `Linked in <strong>${maxUpiVal}</strong> cases` : 'No UPI links';

            document.getElementById('stat-repeat-count').innerText = offendersList.size;
        },

        /* --- Complaint Management View Loader --- */
        loadComplaintsTable() {
            const complaints = window.TRACELNS.Storage.getComplaints();
            const searchVal = document.getElementById('case-search').value.toLowerCase().trim();
            const filterType = document.getElementById('case-filter-type').value;
            const tableBody = document.getElementById('case-table-body');

            if (!tableBody) return;
            tableBody.innerHTML = "";

            let filtered = complaints.filter(c => {
                // Type Filter
                if (filterType && c.crimeType !== filterType) return false;

                // Text Search (Victim Name, Mobile, Crime Type, UPI ID)
                if (searchVal) {
                    const matchName = c.victimName && c.victimName.toLowerCase().includes(searchVal);
                    const matchMobile = c.victimMobile && c.victimMobile.includes(searchVal);
                    const matchType = c.crimeType && c.crimeType.toLowerCase().includes(searchVal);
                    const matchUpi = c.suspectUpi && c.suspectUpi.toLowerCase().includes(searchVal);
                    const matchPhone = c.suspectPhone && c.suspectPhone.includes(searchVal);
                    
                    return matchName || matchMobile || matchType || matchUpi || matchPhone;
                }
                return true;
            });

            // Sort newest first
            filtered.sort((a, b) => b.timestamp - a.timestamp);

            if (filtered.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No complaints match search parameters.</td></tr>`;
                return;
            }

            filtered.forEach(c => {
                const tr = document.createElement('tr');
                tr.style.cursor = 'pointer';
                
                // Get risk details
                const riskAnalysis = window.TRACELNS.Analyzer.calculateRiskScore(c.suspectPhone, c.suspectUpi);

                tr.innerHTML = `
                    <td><strong>${c.id}</strong></td>
                    <td>${c.victimName}</td>
                    <td><span class="badge badge-type">${c.crimeType}</span></td>
                    <td>${c.suspectPhone || '<span class="text-muted">None</span>'}</td>
                    <td>${c.suspectUpi || '<span class="text-muted">None</span>'}</td>
                    <td><span class="badge badge-${riskAnalysis.levelClass}">${riskAnalysis.level} (${riskAnalysis.score})</span></td>
                    <td style="display: flex; gap: 8px;" class="action-cell">
                        <button class="btn-icon view-details" title="Details">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </button>
                        <button class="btn-icon delete" title="Delete Complaint">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        </button>
                    </td>
                `;

                // Handle detail view click
                tr.addEventListener('click', (e) => {
                    const actionButton = e.target.closest('.btn-icon');
                    if (actionButton) {
                        if (actionButton.classList.contains('delete')) {
                            this.triggerDelete(c.id);
                        } else {
                            this.openDetailsModal(c);
                        }
                    } else {
                        this.openDetailsModal(c);
                    }
                });

                tableBody.appendChild(tr);
            });
        },

        triggerDelete(id) {
            if (confirm(`Are you sure you want to delete complaint ${id}? This action cannot be undone.`)) {
                window.TRACELNS.Storage.deleteComplaint(id);
                this.loadComplaintsTable();
                this.showToast(`Complaint ${id} deleted.`, 'success');
            }
        },

        openDetailsModal(c) {
            const modal = document.getElementById('case-modal');
            const detailsContent = document.getElementById('modal-details-content');

            if (!modal || !detailsContent) return;

            const riskAnalysis = window.TRACELNS.Analyzer.calculateRiskScore(c.suspectPhone, c.suspectUpi);

            detailsContent.innerHTML = `
                <div class="detail-row">
                    <div class="detail-label">Complaint ID</div>
                    <div class="detail-val"><strong>${c.id}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Date Registered</div>
                    <div class="detail-val">${c.date}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Victim Name</div>
                    <div class="detail-val">${c.victimName}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Victim Contact</div>
                    <div class="detail-val">${c.victimMobile}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Crime Category</div>
                    <div class="detail-val"><span class="badge badge-type">${c.crimeType}</span></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Suspect Phone</div>
                    <div class="detail-val">${c.suspectPhone || '<em>Not Provided</em>'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Suspect UPI ID</div>
                    <div class="detail-val">${c.suspectUpi || '<em>Not Provided</em>'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Risk Rating</div>
                    <div class="detail-val">
                        <span class="badge badge-${riskAnalysis.levelClass}">${riskAnalysis.level} (Score: ${riskAnalysis.score})</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Description</div>
                    <div class="detail-val">${c.description || '<em>No case summary available.</em>'}</div>
                </div>
            `;

            modal.style.display = 'flex';
        },

        /* --- Link Analysis View Controller --- */
        loadLinkAnalysisView() {
            const suspectPhoneInput = document.getElementById('analyse-phone');
            if (suspectPhoneInput && suspectPhoneInput.value) {
                this.triggerLinkAnalysis(suspectPhoneInput.value.trim());
            } else {
                window.TRACELNS.Analyzer.renderNetworkGraph('graph-canvas', null);
                document.getElementById('analysis-stats-panel').style.display = 'none';
            }
        },

        triggerLinkAnalysis(phone) {
            if (!phone) {
                this.showToast('Please enter a suspect phone number.', 'error');
                return;
            }

            const analysis = window.TRACELNS.Analyzer.getLinkAnalysis(phone);
            const statsPanel = document.getElementById('analysis-stats-panel');

            // Draw SVG
            window.TRACELNS.Analyzer.renderNetworkGraph('graph-canvas', phone);

            if (!analysis || analysis.count === 0) {
                statsPanel.style.display = 'none';
                this.showToast('No linked cases found for this phone number.', 'error');
                return;
            }

            statsPanel.style.display = 'block';
            
            // Build lists
            document.getElementById('link-count').innerText = analysis.count;

            // Victims list
            const victimList = document.getElementById('link-victims');
            victimList.innerHTML = analysis.victims.map(v => `<li>${v}</li>`).join("");

            // UPI list
            const upiList = document.getElementById('link-upis');
            upiList.innerHTML = analysis.upis.length > 0 
                ? analysis.upis.map(u => `<li>${u}</li>`).join("") 
                : `<li><em class="text-muted">None associated</em></li>`;

            // Crime types list
            const crimeList = document.getElementById('link-types');
            crimeList.innerHTML = analysis.crimeTypes.map(c => `<li>${c}</li>`).join("");

            // Render risk analysis breakdown
            const risk = window.TRACELNS.Analyzer.calculateRiskScore(phone, analysis.upis[0] || "");
            const riskBreakdown = document.getElementById('analysis-risk-breakdown');

            riskBreakdown.innerHTML = `
                <div class="risk-level-banner ${risk.levelClass}">
                    <span class="risk-level-text">${risk.level.toUpperCase()}</span>
                    <span class="risk-score-value">${risk.score}</span>
                </div>
                <div class="risk-breakdown-row">
                    <span>Phone Occurrences (x${risk.phoneCount})</span>
                    <span>+${risk.phoneScore}</span>
                </div>
                <div class="risk-breakdown-row">
                    <span>UPI Occurrences (x${risk.upiCount})</span>
                    <span>+${risk.upiScore}</span>
                </div>
                <div class="risk-breakdown-row">
                    <span>Cross-Category Offenses (Multiple types)</span>
                    <span>+${risk.multipleCrimeTypeScore}</span>
                </div>
                <div class="risk-breakdown-row">
                    <span>Total Computed Risk</span>
                    <span>${risk.score}</span>
                </div>
                <button class="btn-primary" style="margin-top: 15px;" onclick="window.TRACELNS.App.generateReport('${phone}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Generate PDF Intelligence Report
                </button>
            `;
        },

        /* --- Intelligence Dashboard View --- */
        loadIntelligenceView() {
            const complaints = window.TRACELNS.Storage.getComplaints();

            const phoneFreq = {};
            const upiFreq = {};
            const categoryFreq = {};

            complaints.forEach(c => {
                if (c.suspectPhone) {
                    phoneFreq[c.suspectPhone] = (phoneFreq[c.suspectPhone] || 0) + 1;
                }
                if (c.suspectUpi) {
                    upiFreq[c.suspectUpi] = (upiFreq[c.suspectUpi] || 0) + 1;
                }
                if (c.crimeType) {
                    categoryFreq[c.crimeType] = (categoryFreq[c.crimeType] || 0) + 1;
                }
            });

            // Sort lists
            const sortedPhones = Object.entries(phoneFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const sortedUpis = Object.entries(upiFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const sortedCats = Object.entries(categoryFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);

            // Repeat offenders (offense count > 1)
            const repeatOffenders = Object.entries(phoneFreq).filter(e => e[1] > 1).sort((a, b) => b[1] - a[1]);

            // Render tables
            const phoneTable = document.getElementById('intel-phones-body');
            if (phoneTable) {
                phoneTable.innerHTML = sortedPhones.map((e, index) => {
                    const risk = window.TRACELNS.Analyzer.calculateRiskScore(e[0], "");
                    return `
                        <tr>
                            <td><strong>#${index + 1}</strong></td>
                            <td><a href="#" onclick="window.TRACELNS.App.analyzePhoneFromTable('${e[0]}'); return false;">${e[0]}</a></td>
                            <td>${e[1]} Complaints</td>
                            <td><span class="badge badge-${risk.levelClass}">${risk.level} (${risk.score})</span></td>
                        </tr>
                    `;
                }).join("");
            }

            const upiTable = document.getElementById('intel-upis-body');
            if (upiTable) {
                upiTable.innerHTML = sortedUpis.map((e, index) => {
                    const risk = window.TRACELNS.Analyzer.calculateRiskScore("", e[0]);
                    return `
                        <tr>
                            <td><strong>#${index + 1}</strong></td>
                            <td>${e[0]}</td>
                            <td>${e[1]} Complaints</td>
                            <td><span class="badge badge-${risk.levelClass}">${risk.level} (${risk.score})</span></td>
                        </tr>
                    `;
                }).join("");
            }

            const catTable = document.getElementById('intel-cats-body');
            if (catTable) {
                catTable.innerHTML = sortedCats.map((e, index) => `
                    <tr>
                        <td><strong>#${index + 1}</strong></td>
                        <td>${e[0]}</td>
                        <td>${e[1]} cases</td>
                    </tr>
                `).join("");
            }

            const repeatTable = document.getElementById('intel-repeat-body');
            if (repeatTable) {
                repeatTable.innerHTML = repeatOffenders.map((e, index) => {
                    const risk = window.TRACELNS.Analyzer.calculateRiskScore(e[0], "");
                    return `
                        <tr>
                            <td><strong>#${index + 1}</strong></td>
                            <td><a href="#" onclick="window.TRACELNS.App.analyzePhoneFromTable('${e[0]}'); return false;">${e[0]}</a></td>
                            <td>${e[1]} Linked Complaints</td>
                            <td><span class="badge badge-${risk.levelClass}">${risk.level} (${risk.score})</span></td>
                        </tr>
                    `;
                }).join("");
            }
        },

        // Helper to switch to Link Analysis when clicking a suspect in tables
        analyzePhoneFromTable(phone) {
            this.switchView('analysis');
            const searchInput = document.getElementById('analyse-phone');
            if (searchInput) {
                searchInput.value = phone;
                this.triggerLinkAnalysis(phone);
            }
        },

        /* --- PDF Report Generation Engine --- */
        generateReport(phone) {
            const analysis = window.TRACELNS.Analyzer.getLinkAnalysis(phone);
            if (!analysis) return;

            const risk = window.TRACELNS.Analyzer.calculateRiskScore(phone, analysis.upis[0] || "");
            const printContainer = document.getElementById('print-report-container');

            // Format date and time
            const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Create victims rows
            const victimsRows = analysis.complaints.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.victimName}</td>
                    <td>${c.victimMobile}</td>
                    <td>${c.crimeType}</td>
                    <td>${c.date}</td>
                </tr>
            `).join("");

            // Create UPI list markup
            const upisStr = analysis.upis.length > 0 ? analysis.upis.join(", ") : "None associated";
            const crimesStr = analysis.crimeTypes.join(", ");

            const html = `
                <div class="print-header">
                    <h1>TraceLens Intelligence</h1>
                    <h2>STATE CYBER CRIME INVESTIGATION UNIT &bull; OFFICIAL DOSSIER (TraceLens)</h2>
                </div>
                <div class="print-meta-grid">
                    <div class="print-meta-item"><strong>Subject Suspect Phone:</strong> ${phone}</div>
                    <div class="print-meta-item"><strong>Generated Date:</strong> ${dateStr} at ${timeStr}</div>
                    <div class="print-meta-item"><strong>Investigating Agency:</strong> Cyber Relational Intelligence Cell</div>
                    <div class="print-meta-item"><strong>Assigned Officer:</strong> Officer Admin</div>
                </div>

                <div class="print-section-title">1. Link Analysis Summary</div>
                <div class="print-meta-grid" style="margin-bottom: 10px;">
                    <div class="print-meta-item"><strong>Total Linked Complaints:</strong> ${analysis.count}</div>
                    <div class="print-meta-item"><strong>Associated UPI IDs:</strong> ${upisStr}</div>
                    <div class="print-meta-item"><strong>Offense Categories:</strong> ${crimesStr}</div>
                    <div class="print-meta-item"><strong>Unique Victims Count:</strong> ${analysis.victims.length}</div>
                </div>

                <div class="print-section-title">2. Associated Victims & Complaints</div>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Complaint ID</th>
                            <th>Victim Name</th>
                            <th>Victim Contact</th>
                            <th>Crime Category</th>
                            <th>Date Filed</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${victimsRows}
                    </tbody>
                </table>

                <div class="print-section-title">3. Dynamic Risk Engine Assessment</div>
                <div class="print-risk-summary">
                    <h3>Risk Categorization: ${risk.level.toUpperCase()} (Score: ${risk.score})</h3>
                    <p style="margin-bottom: 10px;">The TraceLens system calculates suspect risk recursively using database linkages. The breakdown for subject phone <strong>${phone}</strong> is outlined below:</p>
                    <table class="print-table" style="margin-bottom: 0;">
                        <thead>
                            <tr>
                                <th>Risk Indicator</th>
                                <th>Count / Factor</th>
                                <th>Weighted Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Phone Number Appearances in complaints</td>
                                <td>${risk.phoneCount} matches</td>
                                <td>+${risk.phoneScore}</td>
                            </tr>
                            <tr>
                                <td>Associated UPI ID Appearances in complaints</td>
                                <td>${risk.upiCount} matches</td>
                                <td>+${risk.upiScore}</td>
                            </tr>
                            <tr>
                                <td>Cross-Category Penalty (Multiple fraud vectors)</td>
                                <td>${risk.multipleCrimeTypeScore > 0 ? "Yes" : "No"}</td>
                                <td>+${risk.multipleCrimeTypeScore}</td>
                            </tr>
                            <tr style="font-weight: bold; background-color: #f2f2f2;">
                                <td colspan="2">Final Intelligence Risk Rating Index</td>
                                <td>${risk.score}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="print-section-title">4. Official Investigation Notes</div>
                <p style="font-size: 12px; line-height: 1.5; margin-bottom: 40px;">
                    This document represents computed database associations collated on behalf of the Cyber Relational Intelligence Cell (TraceLens). The links mapped here indicate cross-complaint overlap of suspect details (phone, UPI endpoints). It is advised to requisition bank records for associated UPI endpoints and obtain call logs (CDR) for the subject cell line.
                </p>

                <div class="print-signature-area">
                    <div>
                        <div style="height: 40px;"></div>
                        <div class="signature-line">Investigating Cyber Officer</div>
                    </div>
                    <div>
                        <div style="height: 40px;"></div>
                        <div class="signature-line">Superintendent of Police (Cyber Cell)</div>
                    </div>
                </div>
            `;

            printContainer.innerHTML = html;
            window.print();
            
            // Clear print container after printing completes to prevent UI bleed
            setTimeout(() => {
                printContainer.innerHTML = "";
            }, 1000);
        }
    };

    window.TRACELNS.App = App;
    window.addEventListener('DOMContentLoaded', () => App.init());
})();
