import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

const CaseSchedule = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("list"); // "list" | "calendar"
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const token = localStorage.getItem("token");
            const userId = localStorage.getItem("userId");
            const response = await fetch(`http://localhost:8000/cases/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) throw new Error("Failed to fetch cases");
            const data = await response.json();
            setCases(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();
    const upcomingHearings = cases
        .filter((c) => {
            if (!c.caseDate) return false;
            const d = new Date(c.caseDate);
            return d >= now && c.status !== "resolved" && c.status !== "Resolved";
        })
        .sort((a, b) => new Date(a.caseDate) - new Date(b.caseDate));

    const getDaysInMonth = (year, month) => {
        const first = new Date(year, month, 1);
        const last = new Date(year, month + 1, 0);
        const days = [];
        const startPad = first.getDay();
        for (let i = 0; i < startPad; i++) days.push(null);
        for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
        return days;
    };

    const getHearingsOnDate = (date) => {
        if (!date) return [];
        const d = date.toDateString();
        return upcomingHearings.filter((c) => new Date(c.caseDate).toDateString() === d);
    };

    const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleString("default", {
        month: "long",
        year: "numeric"
    });

    const prevMonth = () => {
        if (calendarMonth.month === 0) setCalendarMonth({ year: calendarMonth.year - 1, month: 11 });
        else setCalendarMonth({ ...calendarMonth, month: calendarMonth.month - 1 });
    };

    const nextMonth = () => {
        if (calendarMonth.month === 11) setCalendarMonth({ year: calendarMonth.year + 1, month: 0 });
        else setCalendarMonth({ ...calendarMonth, month: calendarMonth.month + 1 });
    };

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const calendarDays = getDaysInMonth(calendarMonth.year, calendarMonth.month);

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">Loading schedule...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header schedule-header">
                <div>
                    <h1>📅 Case Schedule</h1>
                    <p>Upcoming hearings and important dates</p>
                </div>
                <div className="schedule-view-toggle">
                    <button
                        className={view === "list" ? "toggle-btn active" : "toggle-btn"}
                        onClick={() => setView("list")}
                    >
                        List
                    </button>
                    <button
                        className={view === "calendar" ? "toggle-btn active" : "toggle-btn"}
                        onClick={() => setView("calendar")}
                    >
                        Calendar
                    </button>
                </div>
            </div>

            {view === "list" && (
                <div className="schedule-list-section">
                    {upcomingHearings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📅</div>
                            <h3>No upcoming hearings</h3>
                            <p>Hearings will appear here when your cases have hearing dates.</p>
                            <button className="btn-primary" onClick={() => navigate("/my-cases")}>
                                View My Cases
                            </button>
                        </div>
                    ) : (
                        <div className="schedule-list">
                            {upcomingHearings.map((c) => (
                                <div
                                    key={c._id}
                                    className="schedule-list-item"
                                    onClick={() => navigate(`/track-case?id=${c._id}`)}
                                >
                                    <div className="schedule-date-block">
                                        <span className="schedule-day">
                                            {new Date(c.caseDate).getDate()}
                                        </span>
                                        <span className="schedule-month">
                                            {new Date(c.caseDate).toLocaleString("default", { month: "short" })}
                                        </span>
                                    </div>
                                    <div className="schedule-item-content">
                                        <h4>{c.caseTitle}</h4>
                                        <p className="schedule-meta">
                                            {c.caseType || "General"} · {c.court || "Court"}
                                        </p>
                                    </div>
                                    <span className="schedule-arrow">→</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === "calendar" && (
                <div className="schedule-calendar-section">
                    <div className="calendar-nav">
                        <button type="button" className="calendar-nav-btn" onClick={prevMonth}>
                            ← Prev
                        </button>
                        <h2 className="calendar-title">{monthLabel}</h2>
                        <button type="button" className="calendar-nav-btn" onClick={nextMonth}>
                            Next →
                        </button>
                    </div>
                    <div className="calendar-grid">
                        {weekDays.map((day) => (
                            <div key={day} className="calendar-weekday">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map((date, idx) => {
                            const hearings = getHearingsOnDate(date);
                            const isToday =
                                date &&
                                date.getDate() === now.getDate() &&
                                date.getMonth() === now.getMonth() &&
                                date.getFullYear() === now.getFullYear();
                            return (
                                <div
                                    key={idx}
                                    className={`calendar-day ${!date ? "empty" : ""} ${isToday ? "today" : ""} ${hearings.length ? "has-events" : ""}`}
                                >
                                    {date && <span className="calendar-day-num">{date.getDate()}</span>}
                                    {date && hearings.length > 0 && (
                                        <div className="calendar-day-events">
                                            {hearings.slice(0, 2).map((h) => (
                                                <button
                                                    key={h._id}
                                                    className="calendar-event-dot"
                                                    title={h.caseTitle}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/track-case?id=${h._id}`);
                                                    }}
                                                >
                                                    {h.caseTitle.length > 12 ? h.caseTitle.slice(0, 12) + "…" : h.caseTitle}
                                                </button>
                                            ))}
                                            {hearings.length > 2 && (
                                                <span className="calendar-more">+{hearings.length - 2}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseSchedule;