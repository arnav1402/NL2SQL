import { useEffect, useState } from "react";
import "./Loader.css";
function Loader({ onComplete }) {
const [progress, setProgress] = useState(0);

useEffect(() => {
    const duration = 1800;
    const interval = 20;
    const increment = 100 / (duration / interval);

    const timer = setInterval(() => {
    setProgress((prev) => {
        const next = prev + increment;

        if (next >= 100) {
        clearInterval(timer);

        setTimeout(() => {
            onComplete();
        }, 150);

        return 100;
        }

        return next;
    });
    }, interval);

    return () => clearInterval(timer);
}, [onComplete]);

return (
    <div className="loader-screen">
    <div className="loader-content">
        <div className="loader-brand">NL2SQL</div>

        <div className="loader-status">
        INITIALIZING DATABASE INTERFACE
        </div>

        <div className="loader-bar">
        <div
            className="loader-progress"
            style={{ width: `${progress}%` }}
        />
        </div>

        <div className="loader-percentage">
        {Math.round(progress).toString().padStart(3, "0")}%
        </div>
    </div>
    </div>
);
}

export default Loader;