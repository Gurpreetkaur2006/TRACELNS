/**
 * TraceLens Intelligence Risk Scoring & Link Analysis Module
 * Implements the risk score calculation engine and compiles relational mapping for linked assets.
 */
(function() {
    window.TRACELNS = window.TRACELNS || {};

    const Analyzer = {
        /**
         * Calculates risk score based on suspect phone number and UPI ID
         * Rules:
         * - Phone appearance: +10 per complaint
         * - UPI appearance: +10 per complaint
         * - Multiple crime types: +20
         */
        calculateRiskScore(phone, upi) {
            const complaints = window.TRACELNS.Storage.getComplaints();
            let phoneCount = 0;
            let upiCount = 0;
            const uniqueCrimeTypes = new Set();

            if (phone) {
                const cleanPhone = phone.trim();
                complaints.forEach(c => {
                    if (c.suspectPhone && c.suspectPhone.trim() === cleanPhone) {
                        phoneCount++;
                        if (c.crimeType) uniqueCrimeTypes.add(c.crimeType);
                    }
                });
            }

            if (upi) {
                const cleanUpi = upi.trim().toLowerCase();
                complaints.forEach(c => {
                    if (c.suspectUpi && c.suspectUpi.trim().toLowerCase() === cleanUpi) {
                        upiCount++;
                        if (c.crimeType) uniqueCrimeTypes.add(c.crimeType);
                    }
                });
            }

            const phoneScore = phoneCount * 10;
            const upiScore = upiCount * 10;
            const multipleCrimeTypeScore = uniqueCrimeTypes.size > 1 ? 20 : 0;
            const totalScore = phoneScore + upiScore + multipleCrimeTypeScore;

            let level = "Low Risk";
            let levelClass = "risk-low";
            if (totalScore >= 71) {
                level = "High Risk";
                levelClass = "risk-high";
            } else if (totalScore >= 31) {
                level = "Medium Risk";
                levelClass = "risk-medium";
            }

            return {
                score: totalScore,
                level: level,
                levelClass: levelClass,
                phoneCount,
                upiCount,
                phoneScore,
                upiScore,
                multipleCrimeTypeScore,
                uniqueCrimeTypes: Array.from(uniqueCrimeTypes)
            };
        },

        /**
         * Returns all linked complaints, victims, UPI IDs, and Crime Types associated with a suspect phone
         */
        getLinkAnalysis(phone) {
            if (!phone) return null;
            const cleanPhone = phone.trim();
            const complaints = window.TRACELNS.Storage.getComplaints();
            
            const linkedComplaints = complaints.filter(c => c.suspectPhone && c.suspectPhone.trim() === cleanPhone);
            
            const victims = new Set();
            const upis = new Set();
            const crimeTypes = new Set();

            linkedComplaints.forEach(c => {
                if (c.victimName) victims.add(c.victimName);
                if (c.suspectUpi) upis.add(c.suspectUpi);
                if (c.crimeType) crimeTypes.add(c.crimeType);
            });

            return {
                phone: cleanPhone,
                count: linkedComplaints.length,
                complaints: linkedComplaints,
                victims: Array.from(victims),
                upis: Array.from(upis).filter(Boolean),
                crimeTypes: Array.from(crimeTypes)
            };
        },

        /**
         * Render an interactive SVG Node-Link network visualization.
         */
        renderNetworkGraph(containerId, phone) {
            const container = document.getElementById(containerId);
            if (!container) return;

            container.innerHTML = "";
            const analysis = this.getLinkAnalysis(phone);

            if (!analysis || analysis.count === 0) {
                container.innerHTML = `
                    <div class="empty-graph-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                        <p>Enter a suspect phone number with recorded cases to view link visualization.</p>
                    </div>`;
                return;
            }

            const width = container.clientWidth || 600;
            const height = 400;

            // Generate nodes list
            const nodes = [];
            const links = [];

            // 1. Central Suspect Node
            const centerNode = { id: "suspect", label: phone, type: "suspect", x: width / 2, y: height / 2 };
            nodes.push(centerNode);

            // 2. Child category groups
            // Group 1: Victims
            // Group 2: UPI IDs
            // Group 3: Crime Types
            // Group 4: Complaints
            const categories = [
                { type: "victim", items: analysis.victims, color: "#2563eb", title: "Victims" },
                { type: "upi", items: analysis.upis, color: "#16a34a", title: "UPI IDs" },
                { type: "crime", items: analysis.crimeTypes, color: "#d97706", title: "Crime Types" },
                { type: "complaint", items: analysis.complaints.map(c => c.id), color: "#dc2626", title: "Complaints" }
            ].filter(cat => cat.items.length > 0);

            // Calculate radial positions for categories
            const numCats = categories.length;
            const angleStep = (2 * Math.PI) / numCats;
            const categoryRadius = 130;

            categories.forEach((cat, catIdx) => {
                const catAngle = catIdx * angleStep;
                const catX = centerNode.x + Math.cos(catAngle) * categoryRadius;
                const catY = centerNode.y + Math.sin(catAngle) * categoryRadius;

                // Create a sub-center node for each category to structure the layout
                const catNodeId = `cat-${cat.type}`;
                const catNode = {
                    id: catNodeId,
                    label: cat.title,
                    type: "category",
                    x: catX,
                    y: catY,
                    color: cat.color
                };
                nodes.push(catNode);
                
                // Link center suspect to category hub
                links.push({ source: centerNode.id, target: catNodeId, type: "hub-link" });

                // Distribute leaf nodes around category center
                const numLeafs = cat.items.length;
                const leafRadius = 45;
                const leafAngleStep = (2 * Math.PI) / numLeafs;

                cat.items.forEach((item, leafIdx) => {
                    const leafAngle = leafIdx * leafAngleStep + catAngle; // Offset slightly towards category heading
                    const leafX = catX + Math.cos(leafAngle) * leafRadius;
                    const leafY = catY + Math.sin(leafAngle) * leafRadius;

                    const leafNodeId = `leaf-${cat.type}-${leafIdx}`;
                    nodes.push({
                        id: leafNodeId,
                        label: item,
                        type: cat.type,
                        x: leafX,
                        y: leafY
                    });

                    links.push({ source: catNodeId, target: leafNodeId, type: "leaf-link" });
                });
            });

            // Build SVG markup
            let svgContent = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #fafaf9; border-radius: 8px; border: 1px solid #e7e5e4;">`;
            
            // Draw connection lines
            links.forEach(l => {
                const sourceNode = nodes.find(n => n.id === l.source);
                const targetNode = nodes.find(n => n.id === l.target);
                if (sourceNode && targetNode) {
                    const strokeColor = l.type === "hub-link" ? "#d4d4d4" : "#e5e5e5";
                    const strokeWidth = l.type === "hub-link" ? 2 : 1.5;
                    const dashArray = l.type === "leaf-link" ? "3,3" : "";
                    svgContent += `
                        <line 
                            x1="${sourceNode.x}" 
                            y1="${sourceNode.y}" 
                            x2="${targetNode.x}" 
                            y2="${targetNode.y}" 
                            stroke="${strokeColor}" 
                            stroke-width="${strokeWidth}"
                            stroke-dasharray="${dashArray}"
                        />`;
                }
            });

            // Draw Nodes
            nodes.forEach(n => {
                let fill = "#ffffff";
                let stroke = "#d45f00";
                let radius = 12;
                let textColor = "#1c1917";
                let textWeight = "normal";
                let labelOffset = 22;

                if (n.type === "suspect") {
                    fill = "#d45f00";
                    stroke = "#b44f00";
                    radius = 20;
                    textColor = "#d45f00";
                    textWeight = "bold";
                    labelOffset = 30;
                } else if (n.type === "category") {
                    fill = n.color;
                    stroke = n.color;
                    radius = 8;
                    textColor = n.color;
                    textWeight = "600";
                    labelOffset = 18;
                } else {
                    // Leaf nodes
                    radius = 6;
                    stroke = "#a8a29e";
                    fill = "#ffffff";
                    textColor = "#44403c";
                    labelOffset = 14;
                }

                // Node circle
                svgContent += `
                    <g class="graph-node" data-id="${n.id}" style="cursor: pointer;">
                        <circle cx="${n.x}" cy="${n.y}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="2">
                            <title>${n.label}</title>
                        </circle>
                        <text 
                            x="${n.x}" 
                            y="${n.y + labelOffset}" 
                            text-anchor="middle" 
                            fill="${textColor}" 
                            font-size="10px" 
                            font-family="sans-serif"
                            font-weight="${textWeight}"
                            style="pointer-events: none; user-select: none;"
                        >${n.label.length > 20 ? n.label.substring(0, 18) + '...' : n.label}</text>
                    </g>`;
            });

            svgContent += `</svg>`;
            container.innerHTML = svgContent;
        }
    };

    window.TRACELNS.Analyzer = Analyzer;
})();
