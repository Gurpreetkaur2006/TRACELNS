/**
 * TraceLens Intelligence Storage & Database Module
 * Handles all LocalStorage interactions, schemas, and seeds mock data.
 * Designed to work fully offline (even via file:// protocol).
 */
(function() {
    window.TRACELNS = window.TRACELNS || {};

    const COMPLAINTS_KEY = 'tracelns_complaints';
    const SESSION_KEY = 'tracelns_session';

    // Mock initial data to give a professional feel immediately on first load
    const SEED_COMPLAINTS = [
        {
            id: "SL-2026-0001",
            victimName: "Aman Sharma",
            victimMobile: "9812345670",
            crimeType: "UPI Fraud",
            suspectPhone: "9876543210",
            suspectUpi: "fraudster@ybl",
            description: "Victim received a call claiming a cashback reward. Scanned QR code and lost Rs. 25,000.",
            date: "2026-06-10",
            timestamp: 1781179200000
        },
        {
            id: "SL-2026-0002",
            victimName: "Rahul Verma",
            victimMobile: "9560123456",
            crimeType: "OTP Fraud",
            suspectPhone: "9876543210",
            suspectUpi: "refundcheck@paytm",
            description: "Suspect posed as bank manager, extracted credit card OTP, and withdrew Rs. 45,000.",
            date: "2026-06-12",
            timestamp: 1781352000000
        },
        {
            id: "SL-2026-0003",
            victimName: "Priya Patel",
            victimMobile: "9123456789",
            crimeType: "UPI Fraud",
            suspectPhone: "9876543210",
            suspectUpi: "fraudster@ybl",
            description: "UPI request money scam. Conned under the pretext of selling a second-hand laptop.",
            date: "2026-06-14",
            timestamp: 1781524800000
        },
        {
            id: "SL-2026-0004",
            victimName: "Sunita Rao",
            victimMobile: "9898765432",
            crimeType: "Phishing",
            suspectPhone: "9876543210",
            suspectUpi: "securebank@okhdfc",
            description: "Received sms with malicious link. Entered netbanking credentials on a duplicate portal.",
            date: "2026-06-15",
            timestamp: 1781611200000
        },
        {
            id: "SL-2026-0005",
            victimName: "Amit Patel",
            victimMobile: "8899001122",
            crimeType: "Investment Scam",
            suspectPhone: "9988776655",
            suspectUpi: "growthfund@paytm",
            description: "Suspect promised 200% returns in 3 days via crypto investment telegram group.",
            date: "2026-06-16",
            timestamp: 1781697600000
        },
        {
            id: "SL-2026-0006",
            victimName: "Vikram Malhotra",
            victimMobile: "7766554433",
            crimeType: "Loan App Fraud",
            suspectPhone: "9988776655",
            suspectUpi: "easyloan@ybl",
            description: "Harassed and blackmailed with morphed photos for repayment of a high-interest loan.",
            date: "2026-06-17",
            timestamp: 1781784000000
        },
        {
            id: "SL-2026-0007",
            victimName: "Sanjay Sen",
            victimMobile: "9900112233",
            crimeType: "Sextortion",
            suspectPhone: "8877665544",
            suspectUpi: "",
            description: "Victim was blackmailed with a recorded video call. Forced to pay Rs. 15,000.",
            date: "2026-06-18",
            timestamp: 1781870400000
        },
        {
            id: "SL-2026-0008",
            victimName: "Neha Gupta",
            victimMobile: "9001122334",
            crimeType: "Online Shopping Fraud",
            suspectPhone: "9988776655",
            suspectUpi: "growthfund@paytm",
            description: "Paid for designer clothes on an Instagram store, but the page blocked her and disappeared.",
            date: "2026-06-19",
            timestamp: 1781956800000
        }
    ];

    const Storage = {
        init() {
            if (!localStorage.getItem(COMPLAINTS_KEY)) {
                localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(SEED_COMPLAINTS));
            }
        },

        getComplaints() {
            this.init();
            try {
                return JSON.parse(localStorage.getItem(COMPLAINTS_KEY)) || [];
            } catch (e) {
                console.error("Failed to parse complaints, resetting storage", e);
                return [];
            }
        },

        saveComplaints(complaints) {
            localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
        },

        addComplaint(complaint) {
            const complaints = this.getComplaints();
            // Generate auto-incrementing ID like SL-2026-XXXX
            const currentYear = new Date().getFullYear();
            const lastFourDigits = (complaints.length + 1).toString().padStart(4, '0');
            complaint.id = `SL-${currentYear}-${lastFourDigits}`;
            complaint.timestamp = Date.now();
            complaints.push(complaint);
            this.saveComplaints(complaints);
            return complaint;
        },

        deleteComplaint(id) {
            let complaints = this.getComplaints();
            complaints = complaints.filter(c => c.id !== id);
            this.saveComplaints(complaints);
        },

        // Authentication Methods
        login(username, password) {
            if (username === 'admin' && password === 'police123') {
                const session = {
                    username: username,
                    loginTime: Date.now()
                };
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
                return true;
            }
            return false;
        },

        logout() {
            localStorage.removeItem(SESSION_KEY);
        },

        getSession() {
            try {
                return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
            } catch (e) {
                return null;
            }
        },

        isLoggedIn() {
            return this.getSession() !== null;
        }
    };

    window.TRACELNS.Storage = Storage;
    Storage.init(); // Initialize seed data immediately
})();
