/**
 * Calendar Component
 * 
 * A calendar view component that displays a monthly calendar with navigation.
 * Based on shadcn/ui calendar design pattern.
 * 
 * Attributes:
 * - date: ISO date string (default: current date)
 * - view: 'month' | 'year' (default: 'month')
 * - show-time: boolean (default: false) - shows time selection
 * - time: string (default: '12:00') - initial time in HH:MM format
 * - range-mode: boolean (default: false) - enables date range selection
 * - min-date: ISO date string (default: none) - minimum selectable date
 * - max-date: ISO date string (default: none) - maximum selectable date
 * 
 * Usage:
 * <ui-calendar></ui-calendar>
 * <ui-calendar date="2024-01-15"></ui-calendar>
 * <ui-calendar date="2024-01-15" show-time time="14:30"></ui-calendar>
 * <ui-calendar range-mode="true" min-date="2023-03-01" max-date="2026-03-31"></ui-calendar>
 */
class Calendar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Current date state
        this.currentDate = new Date();
        
        // Initialize viewDate based on date attribute or default to today
        const dateAttr = this.getAttribute('date');
        if (dateAttr) {
            const parsedDate = new Date(dateAttr);
            this.viewDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
            this.selectedDate = parsedDate; // Set the selected date
        } else {
            this.viewDate = new Date();
            this.selectedDate = null; // No selected date
        }
        
        // Time state
        this.showTime = this.hasAttribute('show-time');
        this.selectedTime = this.getAttribute('time') || '12:00';
        
        // Range mode state
        this.rangeMode = this.hasAttribute('range-mode');
        this.minDate = this.getAttribute('min-date') ? new Date(this.getAttribute('min-date')) : null;
        this.maxDate = this.getAttribute('max-date') ? new Date(this.getAttribute('max-date')) : null;
        this.rangeStart = null;
        this.rangeEnd = null;
        
        // Bind methods
        this.previousMonth = this.previousMonth.bind(this);
        this.nextMonth = this.nextMonth.bind(this);
        this.goToToday = this.goToToday.bind(this);
        this.handleTimeChange = this.handleTimeChange.bind(this);
        this.clearRange = this.clearRange.bind(this);
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        // Use 3-letter month names
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        // Year range: 19XX to current+10
        const currentYear = new Date().getFullYear();
        const startYear = parseInt('19' + String(currentYear).slice(2));
        const years = [];
        for (let i = startYear; i <= currentYear + 10; i++) {
            years.push(i);
        }
        
        // Generate time options
        const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
        const minutes = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'));
        const [selectedHour, selectedMinute] = this.selectedTime.split(':');
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                .calendar {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 1rem;
                    width: 100%;
                    max-width: 400px;
                }
                .calendar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                .calendar-nav {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .calendar-center {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                }
                .calendar-title {
                    font-size: 1.125rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .month-year-selector {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .month-select, .year-select {
                    padding: 0.25rem 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background: white;
                    font-size: 0.875rem;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                }
                .month-select:hover, .year-select:hover {
                    border-color: #9ca3af;
                }
                .month-select:focus, .year-select:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                .nav-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 2rem;
                    height: 2rem;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    color: #374151;
                    transition: all 0.15s ease-in-out;
                }
                .nav-button:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }
                .nav-button:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                .nav-button svg {
                    width: 1rem;
                    height: 1rem;
                }
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 1px;
                }
                .calendar-weekday {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 2rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .calendar-day {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 2.5rem;
                    font-size: 0.875rem;
                    color: #374151;
                    cursor: pointer;
                    border-radius: 0.375rem;
                    transition: all 0.15s ease-in-out;
                    position: relative;
                }
                .calendar-day:hover {
                    background: #f3f4f6;
                }
                .calendar-day.today {
                    background: #3b82f6;
                    color: white;
                    font-weight: 600;
                }
                .calendar-day.selected {
                    background: #1e40af;
                    color: white;
                    font-weight: 600;
                }
                .calendar-day.range-start {
                    background: #3b82f6;
                    color: white;
                    font-weight: 600;
                }
                .calendar-day.range-end {
                    background: #1e40af;
                    color: white;
                    font-weight: 600;
                }
                .calendar-day.in-range {
                    background: #dbeafe;
                    color: #1e40af;
                    font-weight: 500;
                }
                .calendar-day.other-month {
                    color: #9ca3af;
                }
                .calendar-day.disabled {
                    color: #d1d5db;
                    cursor: not-allowed;
                }
                .calendar-day.disabled:hover {
                    background: transparent;
                }
                .range-info {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    background: #f3f4f6;
                    border-radius: 0.375rem;
                    font-size: 0.875rem;
                    color: #374151;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .range-info span {
                    font-weight: 600;
                    color: #1e40af;
                }
                .clear-range-button {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #6b7280;
                    background: transparent;
                    border: 1px solid #d1d5db;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                }
                .clear-range-button:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                    color: #374151;
                }
                .today-button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.375rem 0.75rem;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #3b82f6;
                    background: transparent;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                    margin-top: 0.5rem;
                }
                .today-button:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }
                .time-selector {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    justify-content: center;
                }
                .time-selector-label {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                }
                .time-select {
                    padding: 0.25rem 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    background: white;
                    font-size: 0.875rem;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.15s ease-in-out;
                    width: 4rem;
                }
                .time-select:hover {
                    border-color: #9ca3af;
                }
                .time-select:focus {
                    outline: 2px solid #3b82f6;
                    outline-offset: 2px;
                }
                .time-separator {
                    font-size: 0.875rem;
                    color: #6b7280;
                    font-weight: 500;
                }
            </style>
            <div class="calendar">
                <div class="calendar-header">
                    <div class="calendar-nav">
                        <button class="nav-button" id="prev-month" aria-label="Previous month">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div class="calendar-center">
                        <div class="calendar-title">
                            <div class="month-year-selector">
                                <select class="month-select" id="month-select">
                                    ${months.map((monthName, index) => 
                                        `<option value="${index}" ${index === month ? 'selected' : ''}>${monthName}</option>`
                                    ).join('')}
                                </select>
                                <select class="year-select" id="year-select">
                                    ${years.map(y => 
                                        `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="calendar-nav">
                        <button class="nav-button" id="next-month" aria-label="Next month">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="calendar-grid">
                    ${this.renderWeekdays()}
                    ${this.renderDays()}
                </div>
                <button class="today-button" id="go-today">Today</button>
                
                ${this.rangeMode ? `
                <div class="range-info">
                    <div>
                        ${this.rangeStart ? `Start: <span>${this.rangeStart.toLocaleDateString()}</span>` : 'Click to select start date'}
                        ${this.rangeEnd ? ` | End: <span>${this.rangeEnd.toLocaleDateString()}</span>` : ''}
                    </div>
                    ${this.rangeStart ? `<button class="clear-range-button" id="clear-range">Clear</button>` : ''}
                </div>
                ` : ''}
                
                ${this.showTime ? `
                <div class="time-selector">
                    <span class="time-selector-label">Time:</span>
                    <select class="time-select" id="hour-select">
                        ${hours.map(hour => 
                            `<option value="${hour}" ${hour === selectedHour ? 'selected' : ''}>${hour}</option>`
                        ).join('')}
                    </select>
                    <span class="time-separator">:</span>
                    <select class="time-select" id="minute-select">
                        ${minutes.map(minute => 
                            `<option value="${minute}" ${minute === selectedMinute ? 'selected' : ''}>${minute}</option>`
                        ).join('')}
                    </select>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderWeekdays() {
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return weekdays.map(day => `<div class="calendar-weekday">${day}</div>`).join('');
    }

    renderDays() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();
        
        // Get today's date
        const today = new Date();
        const isToday = (date) => {
            return date.getDate() === today.getDate() &&
                   date.getMonth() === today.getMonth() &&
                   date.getFullYear() === today.getFullYear();
        };
        
        // Check if date is in range
        const isInRange = (date) => {
            if (!this.rangeStart || !this.rangeEnd) return false;
            const dateStr = date.toISOString().split('T')[0];
            const startStr = this.rangeStart.toISOString().split('T')[0];
            const endStr = this.rangeEnd.toISOString().split('T')[0];
            return dateStr >= startStr && dateStr <= endStr;
        };
        
        // Check if date is range start/end
        const isRangeStart = (date) => {
            if (!this.rangeStart) return false;
            return date.toISOString().split('T')[0] === this.rangeStart.toISOString().split('T')[0];
        };
        
        const isRangeEnd = (date) => {
            if (!this.rangeEnd) return false;
            return date.toISOString().split('T')[0] === this.rangeEnd.toISOString().split('T')[0];
        };
        
        // Check if date is disabled
        const isDisabled = (date) => {
            if (this.minDate && date < this.minDate) return true;
            if (this.maxDate && date > this.maxDate) return true;
            return false;
        };
        
        let days = '';
        
        // Previous month days
        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            const date = new Date(year, month - 1, day);
            const dateStr = date.toISOString().split('T')[0];
            const classes = ['calendar-day', 'other-month'];
            
            if (isDisabled(date)) {
                classes.push('disabled');
            }
            
            days += `<div class="calendar-day ${classes.join(' ')}" data-date="${dateStr}">${day}</div>`;
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const classes = ['calendar-day'];
            
            if (isToday(date)) {
                classes.push('today');
            }

            if (!this.rangeMode && this.selectedDate && date.toISOString().split('T')[0] === this.selectedDate.toISOString().split('T')[0]) {
                classes.push('selected');
            }
            
            if (this.rangeMode) {
                if (isRangeStart(date)) {
                    classes.push('range-start');
                } else if (isRangeEnd(date)) {
                    classes.push('range-end');
                } else if (isInRange(date)) {
                    classes.push('in-range');
                }
            }
            
            if (isDisabled(date)) {
                classes.push('disabled');
            }
            
            days += `<div class="calendar-day ${classes.join(' ')}" data-date="${dateStr}">${day}</div>`;
        }
        
        // Next month days
        const remainingDays = 42 - (firstDayOfWeek + daysInMonth); // 6 rows * 7 days = 42
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            const dateStr = date.toISOString().split('T')[0];
            const classes = ['calendar-day', 'other-month'];
            
            if (isDisabled(date)) {
                classes.push('disabled');
            }
            
            days += `<div class="calendar-day ${classes.join(' ')}" data-date="${dateStr}">${day}</div>`;
        }
        
        return days;
    }

    setupEventListeners() {
        const prevButton = this.shadowRoot.getElementById('prev-month');
        const nextButton = this.shadowRoot.getElementById('next-month');
        const todayButton = this.shadowRoot.getElementById('go-today');
        const monthSelect = this.shadowRoot.getElementById('month-select');
        const yearSelect = this.shadowRoot.getElementById('year-select');
        const hourSelect = this.shadowRoot.getElementById('hour-select');
        const minuteSelect = this.shadowRoot.getElementById('minute-select');
        const clearRangeButton = this.shadowRoot.getElementById('clear-range');
        
        prevButton.addEventListener('click', this.previousMonth);
        nextButton.addEventListener('click', this.nextMonth);
        todayButton.addEventListener('click', this.goToToday);
        
        if (clearRangeButton) {
            clearRangeButton.addEventListener('click', this.clearRange.bind(this));
        }
        
        if (monthSelect) {
            monthSelect.addEventListener('change', (e) => {
                this.viewDate.setMonth(Number(e.target.value));
                this.render();
                this.setupEventListeners();
                this.dispatchEvent(new CustomEvent('month-change', {
                    detail: { date: this.viewDate },
                    bubbles: true
                }));
            });
        }
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.viewDate.setFullYear(Number(e.target.value));
                this.render();
                this.setupEventListeners();
                this.dispatchEvent(new CustomEvent('month-change', {
                    detail: { date: this.viewDate },
                    bubbles: true
                }));
            });
        }
        
        if (hourSelect) {
            hourSelect.addEventListener('change', this.handleTimeChange);
        }
        if (minuteSelect) {
            minuteSelect.addEventListener('change', this.handleTimeChange);
        }
        
        // Day click events
        const days = this.shadowRoot.querySelectorAll('.calendar-day');
        days.forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.target.dataset.date;
                if (date && !e.target.classList.contains('disabled')) {
                    if (this.rangeMode) {
                        this.selectRangeDate(date);
                    } else {
                        this.selectDate(date);
                    }
                }
            });
        });
    }

    handleTimeChange() {
        const hourSelect = this.shadowRoot.getElementById('hour-select');
        const minuteSelect = this.shadowRoot.getElementById('minute-select');
        
        if (hourSelect && minuteSelect) {
            const hour = hourSelect.value;
            const minute = minuteSelect.value;
            this.selectedTime = `${hour}:${minute}`;
            
            this.dispatchEvent(new CustomEvent('time-change', {
                detail: { time: this.selectedTime },
                bubbles: true
            }));
        }
    }

    previousMonth() {
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.render();
        this.setupEventListeners();
        this.dispatchEvent(new CustomEvent('month-change', {
            detail: { date: this.viewDate },
            bubbles: true
        }));
    }

    nextMonth() {
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.render();
        this.setupEventListeners();
        this.dispatchEvent(new CustomEvent('month-change', {
            detail: { date: this.viewDate },
            bubbles: true
        }));
    }

    goToToday() {
        this.viewDate = new Date();
        this.selectedDate = null; // Clear selected date when going to today
        this.render();
        this.setupEventListeners();
        this.dispatchEvent(new CustomEvent('today', {
            detail: { date: this.viewDate },
            bubbles: true
        }));
    }

    selectDate(dateString) {
        const date = new Date(dateString);
        this.selectedDate = date; // Update the selected date
        this.render(); // Re-render to highlight the selected date
        this.setupEventListeners(); // Re-setup event listeners after re-render
        
        // Create a date-time object if time is enabled
        let dateTimeData = { date: date };
        if (this.showTime) {
            const [hour, minute] = this.selectedTime.split(':');
            const dateTime = new Date(date);
            dateTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
            dateTimeData = { 
                date: dateTime,
                time: this.selectedTime,
                dateTime: dateTime
            };
        }
        
        this.dispatchEvent(new CustomEvent('date-select', {
            detail: dateTimeData,
            bubbles: true
        }));
    }

    selectRangeDate(dateString) {
        const date = new Date(dateString);
        
        // If no start date is selected, or if clicking the same date as start, set as start
        if (!this.rangeStart || (this.rangeStart && this.rangeStart.toISOString().split('T')[0] === dateString)) {
            this.rangeStart = date;
            this.rangeEnd = null; // Reset end date
        } else {
            // If start date is selected, set as end date
            if (date < this.rangeStart) {
                // If selected date is before start date, swap them
                this.rangeEnd = this.rangeStart;
                this.rangeStart = date;
            } else {
                this.rangeEnd = date;
            }
        }
        
        this.render();
        this.setupEventListeners();
        
        // Dispatch range event
        const rangeData = {
            start: this.rangeStart,
            end: this.rangeEnd,
            startDate: this.rangeStart ? this.rangeStart.toISOString().split('T')[0] : null,
            endDate: this.rangeEnd ? this.rangeEnd.toISOString().split('T')[0] : null
        };
        
        this.dispatchEvent(new CustomEvent('range-select', {
            detail: rangeData,
            bubbles: true
        }));
    }

    clearRange() {
        this.rangeStart = null;
        this.rangeEnd = null;
        this.render();
        this.setupEventListeners();
        
        this.dispatchEvent(new CustomEvent('range-clear', {
            detail: { cleared: true },
            bubbles: true
        }));
    }

    static get observedAttributes() {
        return ['date', 'show-time', 'time', 'range-mode', 'min-date', 'max-date'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'date' && newValue) {
            const parsedDate = new Date(newValue);
            if (!isNaN(parsedDate.getTime())) {
                this.viewDate = parsedDate;
                this.selectedDate = parsedDate; // Update selected date on attribute change
                this.render();
                this.setupEventListeners();
            }
        } else if (name === 'show-time') {
            this.showTime = this.hasAttribute('show-time');
            this.render();
            this.setupEventListeners();
        } else if (name === 'time' && newValue) {
            this.selectedTime = newValue;
            this.render();
            this.setupEventListeners();
        } else if (name === 'range-mode') {
            this.rangeMode = this.hasAttribute('range-mode');
            this.render();
            this.setupEventListeners();
        } else if (name === 'min-date' && newValue) {
            this.minDate = new Date(newValue);
            this.render();
            this.setupEventListeners();
        } else if (name === 'max-date' && newValue) {
            this.maxDate = new Date(newValue);
            this.render();
            this.setupEventListeners();
        }
    }
}

customElements.define('ui-calendar', Calendar);

export default Calendar; 