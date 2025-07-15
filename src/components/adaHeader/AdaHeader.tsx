import React, { useEffect, useState } from "react";

import { HamburgerMenu } from "./HamburgerMenu";

const AdaHeader = () => {
  const [time, setTime] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-between p-2 bg-primary text-white">
      <div className="flex items-center space-x-4">
        <HamburgerMenu />
        <small className="font-bold">ADA - Menu</small>
      </div>

      <div>
        <small className="font-medium">{time}</small>
      </div>
    </div>
  );
};

export { AdaHeader };
