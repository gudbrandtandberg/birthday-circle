class BirthdayCircle {
    constructor() {
        this.canvas = document.getElementById('birthdayCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tooltip = document.getElementById('tooltip');
        
        // Circle properties (will be set properly in setupHighDPI)
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 200;
        this.baseRadius = 200;
        
        // Transform properties
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Interaction properties
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.hoveredDay = null;
        
        // Birthday data
        this.birthdays = new Map();
        this.daysInYear = 365; // We'll handle leap years later
        
        // Animation
        this.animationId = null;
        
        this.init();
    }
    
    setupHighDPI() {
        // Get the container size, not just the canvas bounding rect
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set canvas size to fill the container
        this.canvas.width = containerRect.width * dpr;
        this.canvas.height = containerRect.height * dpr;
        this.canvas.style.width = containerRect.width + 'px';
        this.canvas.style.height = containerRect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        
        // Update center position based on the actual canvas size
        this.centerX = containerRect.width / 2;
        this.centerY = containerRect.height / 2;
        
        // Adjust radius based on available space
        const minDimension = Math.min(containerRect.width, containerRect.height);
        this.radius = Math.min(200, (minDimension - 100) / 2);
        this.baseRadius = this.radius;
    }
    
    async init() {
        // Ensure canvas is properly sized before doing anything
        this.setupHighDPI();
        await this.loadBirthdays();
        this.setupEventListeners();
        this.render();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupHighDPI();
            this.render();
        });
    }
    
    async loadBirthdays() {
        try {
            const response = await fetch('birthdays.txt');
            const text = await response.text();
            
            text.split('\n').forEach(line => {
                line = line.trim();
                if (line && line.includes(',')) {
                    const [name, dateStr] = line.split(',');
                    const date = new Date(dateStr.trim());
                    if (!isNaN(date.getTime())) {
                        const dayOfYear = this.getDayOfYear(date);
                        if (!this.birthdays.has(dayOfYear)) {
                            this.birthdays.set(dayOfYear, []);
                        }
                        this.birthdays.get(dayOfYear).push({
                            name: name.trim(),
                            date: date
                        });
                    }
                }
            });
            
            console.log(`Loaded ${this.birthdays.size} birthday dates`);
        } catch (error) {
            console.error('Error loading birthdays:', error);
        }
    }
    
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    
    setupEventListeners() {
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
    }
    
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.lastMouseX = e.clientX - rect.left;
        this.lastMouseY = e.clientY - rect.top;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (this.isDragging) {
            const deltaX = mouseX - this.lastMouseX;
            const deltaY = mouseY - this.lastMouseY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastMouseX = mouseX;
            this.lastMouseY = mouseY;
            
            this.render();
        } else {
            // Check for hover
            this.checkHover(mouseX, mouseY);
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
    }
    
    handleMouseLeave() {
        this.isDragging = false;
        this.hideTooltip();
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoomAt(mouseX, mouseY, zoomFactor);
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.isDragging = true;
            this.lastMouseX = touch.clientX - rect.left;
            this.lastMouseY = touch.clientY - rect.top;
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            const deltaX = touchX - this.lastMouseX;
            const deltaY = touchY - this.lastMouseY;
            
            this.offsetX += deltaX;
            this.offsetY += deltaY;
            
            this.lastMouseX = touchX;
            this.lastMouseY = touchY;
            
            this.render();
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.isDragging = false;
    }
    
    zoom(factor) {
        // For button clicks, zoom towards the current center of the circle
        const circleCenterX = this.centerX + this.offsetX;
        const circleCenterY = this.centerY + this.offsetY;
        this.zoomAt(circleCenterX, circleCenterY, factor);
    }
    
    zoomAt(x, y, factor) {
        const newScale = this.scale * factor;
        
        // Limit zoom levels
        if (newScale < 0.1 || newScale > 10) return;
        
        // Calculate the current center of the circle in screen coordinates
        const circleCenterX = this.centerX + this.offsetX;
        const circleCenterY = this.centerY + this.offsetY;
        
        // Calculate offset from zoom point to circle center
        const deltaX = x - circleCenterX;
        const deltaY = y - circleCenterY;
        
        // Apply zoom
        this.scale = newScale;
        
        // Adjust offset to keep the circle properly positioned relative to zoom point
        this.offsetX += deltaX * (1 - factor);
        this.offsetY += deltaY * (1 - factor);
        
        this.render();
    }
    
    resetView() {
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.render();
    }
    
    checkHover(mouseX, mouseY) {
        // Transform mouse coordinates to world coordinates
        const worldX = (mouseX - this.offsetX - this.centerX) / this.scale;
        const worldY = (mouseY - this.offsetY - this.centerY) / this.scale;
        
        // Calculate distance from center
        const distance = Math.sqrt(worldX * worldX + worldY * worldY);
        
        // Define hover zones
        const dayHoverRadius = 25; // How close to day markers to detect hover
        const innerBoundary = this.radius * 0.3; // Too close to center - hide tooltip
        const outerBoundary = this.radius + 80; // Too far from circle - hide tooltip
        
        // Check if mouse is in the active tooltip zone
        const inTooltipZone = distance >= innerBoundary && distance <= outerBoundary;
        
        // Check if mouse is over any day marker
        const nearDayMarkers = distance >= this.radius - dayHoverRadius && distance <= this.radius + dayHoverRadius;
        
        if (inTooltipZone && nearDayMarkers) {
            // Calculate angle from center, starting from top (negative Y axis) going clockwise
            let angle = Math.atan2(worldY, worldX);
            
            // Normalize to 0-2π range
            if (angle < 0) angle += 2 * Math.PI;
            
            // Rotate so that top of circle (negative Y) is 0, and we go clockwise
            // atan2 gives us angle from positive X axis, but we want from negative Y axis
            let dayAngle = angle + Math.PI / 2;  // Shift by 90 degrees
            if (dayAngle >= 2 * Math.PI) dayAngle -= 2 * Math.PI; // Keep in 0-2π range
            
            // Convert to day of year (1-365)
            const dayOfYear = Math.floor((dayAngle / (2 * Math.PI)) * this.daysInYear) + 1;
            
            if (dayOfYear !== this.hoveredDay && dayOfYear >= 1 && dayOfYear <= this.daysInYear) {
                this.hoveredDay = dayOfYear;
                
                // Show tooltip only if this day has birthdays, hide it otherwise
                if (this.birthdays.has(dayOfYear)) {
                    this.showTooltip(mouseX, mouseY, dayOfYear);
                } else {
                    this.hideTooltip();
                }
                
                this.render(); // Re-render to show hover effect
            }
        } else {
            // Hide tooltip if outside active zone or too close/far from circle
            if (this.hoveredDay !== null) {
                this.hoveredDay = null;
                this.hideTooltip();
                this.render(); // Re-render to remove hover effect
            }
        }
    }
    
    showTooltip(x, y, dayOfYear) {
        const date = this.dayOfYearToDate(dayOfYear);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Only show tooltip for days with birthdays (this function should only be called for those days now)
        const people = this.birthdays.get(dayOfYear);
        
        let content = `<strong>${monthNames[date.getMonth()]} ${date.getDate()}</strong>`;
        content += `<br><div style="margin-top: 8px; color: #4ecdc4; font-weight: 500;">🎂 Birthday${people.length > 1 ? 's' : ''}:</div>`;
        content += people.map(person => `<div style="margin-left: 8px; color: #e2e8f0;">${person.name}</div>`).join('');
        
        this.tooltip.innerHTML = content;
        
        // Position tooltip relative to the page, not the canvas
        const canvasRect = this.canvas.getBoundingClientRect();
        const tooltipX = canvasRect.left + x;
        const tooltipY = canvasRect.top + y;
        
        this.tooltip.style.left = tooltipX + 'px';
        this.tooltip.style.top = tooltipY + 'px';
        this.tooltip.classList.add('visible');
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }
    
    dayOfYearToDate(dayOfYear) {
        const date = new Date(2024, 0, dayOfYear); // Using 2024 as base year
        return date;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context and apply transformations
        this.ctx.save();
        this.ctx.translate(this.centerX + this.offsetX, this.centerY + this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw year circle outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Draw month markers
        this.drawMonthMarkers();
        
        // Draw day markers
        this.drawDayMarkers();
        
        // Draw center
        this.drawCenter();
        
        this.ctx.restore();
    }
    
    drawMonthMarkers() {
        const monthDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Leap year
        const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
                           'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
        
        let currentDay = 0;
        
        // Set smaller font size for month labels
        const fontSize = Math.max(8, Math.min(10, 24 / this.scale));
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.lineWidth = 1;
        
        for (let month = 0; month < 12; month++) {
            const startAngle = (currentDay / this.daysInYear) * 2 * Math.PI - Math.PI / 2;
            const endDay = currentDay + monthDays[month];
            const endAngle = (endDay / this.daysInYear) * 2 * Math.PI - Math.PI / 2;
            const midAngle = (startAngle + endAngle) / 2;
            
            // Draw month divider line at start
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(startAngle) * (this.radius - 15), Math.sin(startAngle) * (this.radius - 15));
            this.ctx.lineTo(Math.cos(startAngle) * (this.radius + 15), Math.sin(startAngle) * (this.radius + 15));
            this.ctx.stroke();
            
            // Draw curved month text
            this.drawCurvedText(monthNames[month], midAngle, this.radius + 35);
            
            currentDay += monthDays[month];
        }
    }
    
    drawCurvedText(text, centerAngle, radius) {
        // Use shorter month names to avoid clutter
        const shortText = text.substring(0, 3); // JAN, FEB, etc.
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Position text radially outward from center
        const x = Math.cos(centerAngle) * radius;
        const y = Math.sin(centerAngle) * radius;
        
        this.ctx.translate(x, y);
        this.ctx.rotate(centerAngle + Math.PI / 2);
        
        // Draw text with subtle outline
        this.ctx.strokeText(shortText, 0, 0);
        this.ctx.fillText(shortText, 0, 0);
        
        this.ctx.restore();
    }
    
    drawDayMarkers() {
        for (let day = 1; day <= this.daysInYear; day++) {
            const angle = ((day - 1) / this.daysInYear) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * this.radius;
            const y = Math.sin(angle) * this.radius;
            
            // Check if this day has birthdays
            const hasBirthday = this.birthdays.has(day);
            const isHovered = this.hoveredDay === day;
            
            if (hasBirthday) {
                // Birthday marker - larger and colored
                this.ctx.fillStyle = isHovered ? '#ff6b6b' : '#4ecdc4';
                this.ctx.beginPath();
                this.ctx.arc(x, y, isHovered ? 10 : 7, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Add a glow effect
                if (isHovered) {
                    this.ctx.shadowColor = '#ff6b6b';
                    this.ctx.shadowBlur = 20;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 10, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
                
                // Draw radial text for birthday names only when heavily zoomed in
                if (this.scale > 4 && hasBirthday) {
                    const people = this.birthdays.get(day);
                    if (people && people.length > 0) {
                        this.drawBirthdayText(people, angle, x, y);
                    }
                }
            } else {
                // Regular day marker
                this.ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
                this.ctx.beginPath();
                this.ctx.arc(x, y, isHovered ? 4 : 2, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }
    
    drawBirthdayText(people, angle, x, y) {
        this.ctx.save();
        
        // Much smaller font size and only show when significantly zoomed in
        const fontSize = Math.max(6, Math.min(8, 16 / this.scale));
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.lineWidth = 1;
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'middle';
        
        // Position text radially outward from the birthday marker
        const textDistance = 15;
        const textX = x + Math.cos(angle) * textDistance;
        const textY = y + Math.sin(angle) * textDistance;
        
        this.ctx.translate(textX, textY);
        
        // Rotate text to be readable (not upside down)
        let textAngle = angle;
        if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
            textAngle += Math.PI;
            this.ctx.textAlign = 'end';
        }
        this.ctx.rotate(textAngle);
        
        // Draw first name only, shorter names
        const firstName = people[0].name.split(' ')[0];
        let displayText = firstName.length > 6 ? firstName.substring(0, 6) : firstName;
        if (people.length > 1) {
            displayText += ` +${people.length - 1}`;
        }
        
        this.ctx.strokeText(displayText, 0, 0);
        this.ctx.fillText(displayText, 0, 0);
        
        this.ctx.restore();
    }
    
    drawCenter() {
        // Draw subtle center dot
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 2, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new BirthdayCircle();
}); 