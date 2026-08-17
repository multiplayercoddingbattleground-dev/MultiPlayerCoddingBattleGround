import { useEffect, useState } from "react";

function BattleTimer({ initialTime = 900 }) {

  const [time, setTime] = useState(initialTime);

  useEffect(() => {

    if (time <= 0) return;

    const timer = setInterval(() => {
      setTime((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);

  }, [time]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return (
    <div className="battle-timer">
      ⏱️{" "}
      {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </div>
  );
}

export default BattleTimer;