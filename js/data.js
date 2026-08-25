/**
 * CampusFlow - Shared Initial Data
 * Defines the initial default campus events.
 */

const defaultEvents = [
    {
        id: "EVT001",
        name: "WebCraft Hackathon",
        category: "Technical",
        date: "2026-09-10",
        time: "09:00 AM - 05:00 PM",
        venue: "Seminar Hall A",
        registrationFee: 150,
        totalSeats: 50,
        availableSeats: 50,
        description: "24-hour web development competition. Build innovative web apps using HTML, CSS, and JavaScript.",
        status: "Upcoming"
    },
    {
        id: "EVT002",
        name: "CodeFest 2026",
        category: "Technical",
        date: "2026-09-15",
        time: "10:00 AM - 04:00 PM",
        venue: "Main Computer Lab 3",
        registrationFee: 100,
        totalSeats: 40,
        availableSeats: 40,
        description: "Algorithmic competitive programming contest to test your problem-solving skills under time pressure.",
        status: "Upcoming"
    },
    {
        id: "EVT003",
        name: "AI Innovation Workshop",
        category: "Workshop",
        date: "2026-09-20",
        time: "11:00 AM - 03:00 PM",
        venue: "Auditorium Block B",
        registrationFee: 0,
        totalSeats: 60,
        availableSeats: 60,
        description: "Hands-on workshop on generative AI, prompt engineering, and building agentic workflows.",
        status: "Upcoming"
    },
    {
        id: "EVT004",
        name: "Tech Symposium",
        category: "Conference",
        date: "2026-09-25",
        time: "09:30 AM - 05:30 PM",
        venue: "Convention Center",
        registrationFee: 200,
        totalSeats: 100,
        availableSeats: 100,
        description: "Annual paper presentation & keynote lectures from leading industry executives and tech visionaries.",
        status: "Upcoming"
    },
    {
        id: "EVT005",
        name: "Cultural Night Fiesta",
        category: "Cultural",
        date: "2026-10-02",
        time: "05:00 PM - 09:30 PM",
        venue: "Open Air Theatre",
        registrationFee: 50,
        totalSeats: 150,
        availableSeats: 150,
        description: "An enchanting evening featuring music bands, dance performances, fashion walk, and food stalls.",
        status: "Upcoming"
    },
    {
        id: "EVT006",
        name: "Inter-College Sports Meet",
        category: "Sports",
        date: "2026-10-10",
        time: "08:00 AM - 06:00 PM",
        venue: "Campus Sports Ground",
        registrationFee: 120,
        totalSeats: 80,
        availableSeats: 80,
        description: "Annual multi-sport tournament featuring athletics, football, basketball, and badminton.",
        status: "Upcoming"
    }
];

const STORAGE_KEYS = {
    EVENTS: 'campusflow_events',
    REGISTRATIONS: 'campusflow_registrations'
};
