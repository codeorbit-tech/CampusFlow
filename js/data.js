/**
 * CampusFlow - Central Initial Datasets & Storage Keys
 * 
 * Defines initial events with schedule information (date, startTime, endTime)
 * for Smart Seat Management and Event Conflict Detection.
 */

const STORAGE_KEYS = {
    EVENTS: 'campusflow_events',
    REGISTRATIONS: 'campusflow_registrations'
};

/**
 * Initial Default Events Dataset
 */
const initialEvents = [
    {
        id: "EVT001",
        name: "WebCraft Hackathon",
        category: "Technical",
        date: "2026-09-10",
        startTime: "09:00",
        endTime: "17:00",
        timeDisplay: "09:00 AM – 05:00 PM",
        venue: "Main Seminar Hall",
        registrationFee: 150,
        totalSeats: 50,
        availableSeats: 42,
        registeredCount: 8
    },
    {
        id: "EVT002",
        name: "CodeFest 2026",
        category: "Technical",
        date: "2026-09-18",
        startTime: "10:00",
        endTime: "13:00",
        timeDisplay: "10:00 AM – 01:00 PM",
        venue: "Computer Lab 3 & 4",
        registrationFee: 100,
        totalSeats: 60,
        availableSeats: 15,
        registeredCount: 45
    },
    {
        id: "EVT003",
        name: "AI Innovation Workshop",
        category: "Workshop",
        date: "2026-09-25",
        startTime: "10:00",
        endTime: "12:30",
        timeDisplay: "10:00 AM – 12:30 PM",
        venue: "Auditorium B",
        registrationFee: 200,
        totalSeats: 40,
        availableSeats: 0, // FULL demonstration
        registeredCount: 40
    },
    {
        id: "EVT004",
        name: "Tech Symposium",
        category: "Technical",
        date: "2026-09-25",
        startTime: "11:30",
        endTime: "16:00",
        timeDisplay: "11:30 AM – 04:00 PM",
        venue: "Convention Center",
        registrationFee: 250,
        totalSeats: 100,
        availableSeats: 68,
        registeredCount: 32
    },
    {
        id: "EVT005",
        name: "Cultural Night: Tarang",
        category: "Cultural",
        date: "2026-10-12",
        startTime: "17:00",
        endTime: "21:00",
        timeDisplay: "05:00 PM – 09:00 PM",
        venue: "Open Air Amphitheatre",
        registrationFee: 0,
        totalSeats: 300,
        availableSeats: 120,
        registeredCount: 180
    },
    {
        id: "EVT006",
        name: "Inter-College Sports Meet",
        category: "Sports",
        date: "2026-10-20",
        startTime: "08:00",
        endTime: "16:00",
        timeDisplay: "08:00 AM – 04:00 PM",
        venue: "University Sports Complex",
        registrationFee: 50,
        totalSeats: 80,
        availableSeats: 34,
        registeredCount: 46
    },
    {
        id: "EVT007",
        name: "Robotics & IoT Bootcamp",
        category: "Workshop",
        date: "2026-09-18",
        startTime: "11:00",
        endTime: "14:00",
        timeDisplay: "11:00 AM – 02:00 PM",
        venue: "Robotics Lab 2",
        registrationFee: 100,
        totalSeats: 35,
        availableSeats: 20,
        registeredCount: 15
    }
];

// Aliases for compatibility
const defaultEvents = initialEvents;
let events = initialEvents;
let registrations = [];
